/**
 * DATA CACHE — Zero-loading-state caching with pre-emptive refresh.
 *
 * How it works:
 *   Day 0: First fetch. Data cached. User sees loading ONLY this once.
 *   Day 1-5: Cache serves instantly. No fetch.
 *   Day 6+: Cache serves instantly. Background fetch fires silently.
 *           New data replaces old. Fresh language for the user.
 *   Day 7 end: If refresh failed, old data still serves (grace period).
 *   Day 8+: If still no refresh, next app open triggers foreground fetch.
 *
 * Background refresh:
 *   - On every getOrFetch call, checks if refresh is due
 *   - On AppState 'active', checks all registered entries
 *   - Via expo-background-fetch (if available), checks periodically even when app is closed
 *
 * Registry:
 *   Features register their fetch functions so background refresh knows how to call them.
 *   dataCache.register('chart-overview', kundliData, fetchFn, CACHE_POLICY.STATIC);
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// ─── Cache Policies ───

export const CACHE_POLICY = {
  STATIC: {
    ttl:          7 * 24 * 60 * 60 * 1000,   // 7 days
    refreshAfter: 6 * 24 * 60 * 60 * 1000,   // start refresh on day 6
    grace:        2 * 24 * 60 * 60 * 1000,   // 2 day grace if refresh fails
  },
  DAILY: {
    ttl:          24 * 60 * 60 * 1000,
    refreshAfter: 20 * 60 * 60 * 1000,       // refresh after 20 hours
    grace:        6 * 60 * 60 * 1000,
  },
  WEEKLY: {
    ttl:          7 * 24 * 60 * 60 * 1000,
    refreshAfter: 6 * 24 * 60 * 60 * 1000,
    grace:        2 * 24 * 60 * 60 * 1000,
  },
  HOURLY: {
    ttl:          60 * 60 * 1000,
    refreshAfter: 45 * 60 * 1000,
    grace:        30 * 60 * 1000,
  },
};

// For backward compat
export const TTL = {
  STATIC:  CACHE_POLICY.STATIC.ttl,
  DAILY:   CACHE_POLICY.DAILY.ttl,
  WEEKLY:  CACHE_POLICY.WEEKLY.ttl,
  HOURLY:  CACHE_POLICY.HOURLY.ttl,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  SESSION: 0,
};

const PREFIX = '@plutto_cache:';

// ─── In-memory state ───

const _refreshing = {};         // keys currently being refreshed (prevent duplicates)
const _registry = {};           // registered features for background refresh
let _appStateListener = null;
let _bgTaskRegistered = false;


// ─── Helpers ───

function _birthHash(kundliData) {
  try {
    const raw = kundliData?.raw?.birth_details || kundliData?.birth_details || {};
    const str = `${raw.year||0}-${raw.month||0}-${raw.day||0}-${raw.hour||0}-${raw.minute||0}-${raw.latitude||0}-${raw.longitude||0}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch (_) { return 'x'; }
}

function _key(feature, kundliData, extra = '') {
  return `${PREFIX}${feature}:${_birthHash(kundliData)}${extra ? ':' + extra : ''}`;
}

function _endOfDay(timestamp) {
  const d = new Date(timestamp);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}


// ═══════════════════════════════════════════════════════════════
// CORE
// ═══════════════════════════════════════════════════════════════

const dataCache = {

  /**
   * Read from cache. Returns { data, needsRefresh, expired } or null.
   */
  async read(feature, kundliData, policy = CACHE_POLICY.STATIC, extra = '') {
    try {
      const key = _key(feature, kundliData, extra);
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry = JSON.parse(raw);
      const now = Date.now();
      const age = now - entry.cached_at;

      // Hard expired (past ttl + grace)
      if (age > policy.ttl + policy.grace) {
        AsyncStorage.removeItem(key).catch(() => {});
        return null;
      }

      return {
        data: entry.data,
        needsRefresh: age >= policy.refreshAfter,
        expired: age >= policy.ttl,
        age,
        cached_at: entry.cached_at,
      };
    } catch (_) { return null; }
  },

  /**
   * Write to cache.
   */
  async write(feature, kundliData, data, extra = '') {
    try {
      const key = _key(feature, kundliData, extra);
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        cached_at: Date.now(),
      }));
    } catch (_) {}
  },

  /**
   * The main method. Zero loading state after first load.
   *
   * Returns data immediately from cache if available.
   * If refresh is due, fetches in background — user never waits.
   * Only waits on the very first load (no cache exists).
   */
  async getOrFetch(feature, kundliData, fetchFn, policy = CACHE_POLICY.STATIC, extra = '') {
    const cached = await this.read(feature, kundliData, policy, extra);

    if (cached && !cached.expired) {
      // Cache hit — serve immediately
      if (cached.needsRefresh) {
        // Day 6+: trigger silent background refresh
        this._backgroundRefresh(feature, kundliData, fetchFn, extra);
      }
      return { data: cached.data, fromCache: true, age: cached.age };
    }

    if (cached && cached.expired && cached.data) {
      // Expired but within grace — serve stale, refresh in background
      this._backgroundRefresh(feature, kundliData, fetchFn, extra);
      return { data: cached.data, fromCache: true, stale: true, age: cached.age };
    }

    // No cache at all — first load, must wait
    try {
      const data = await fetchFn();
      if (data) {
        await this.write(feature, kundliData, data, extra);
      }
      return { data, fromCache: false };
    } catch (e) {
      // If fetch fails on first load, return null
      return { data: null, fromCache: false, error: e.message };
    }
  },

  /**
   * Silent background refresh. Non-blocking. Deduped.
   */
  async _backgroundRefresh(feature, kundliData, fetchFn, extra = '') {
    const key = _key(feature, kundliData, extra);
    if (_refreshing[key]) return; // already refreshing

    _refreshing[key] = true;
    try {
      const data = await fetchFn();
      if (data) {
        await this.write(feature, kundliData, data, extra);
      }
    } catch (_) {
      // Silent failure — old cache remains valid
    }
    delete _refreshing[key];
  },

  /**
   * Register a feature for background refresh.
   * Call this once per feature (e.g., on app startup).
   */
  register(feature, kundliData, fetchFn, policy = CACHE_POLICY.STATIC, extra = '') {
    const regKey = `${feature}:${_birthHash(kundliData)}${extra ? ':' + extra : ''}`;
    _registry[regKey] = { feature, kundliData, fetchFn, policy, extra };
  },

  /**
   * Check all registered features and refresh any that are due.
   * Called on AppState 'active' and by background task.
   */
  async refreshAllDue() {
    const entries = Object.values(_registry);
    for (const { feature, kundliData, fetchFn, policy, extra } of entries) {
      try {
        const cached = await this.read(feature, kundliData, policy, extra);
        if (!cached || cached.needsRefresh || cached.expired) {
          this._backgroundRefresh(feature, kundliData, fetchFn, extra);
        }
      } catch (_) {}
    }
  },

  /**
   * Invalidate a cache entry.
   */
  async invalidate(feature, kundliData, extra = '') {
    try { await AsyncStorage.removeItem(_key(feature, kundliData, extra)); } catch (_) {}
  },

  /**
   * Clear all plutto cache.
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const ours = keys.filter(k => k.startsWith(PREFIX));
      if (ours.length) await AsyncStorage.multiRemove(ours);
    } catch (_) {}
  },

  /**
   * Initialize listeners. Call once at app startup.
   */
  init() {
    // AppState listener — refresh stale entries when app becomes active
    if (!_appStateListener) {
      _appStateListener = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          // Small delay to not block app activation
          setTimeout(() => dataCache.refreshAllDue(), 2000);
        }
      });
    }

    // Background fetch — if expo-task-manager is available
    if (!_bgTaskRegistered) {
      _bgTaskRegistered = true;
      try {
        const TaskManager = require('expo-task-manager');
        const BackgroundFetch = require('expo-background-fetch');

        const TASK_NAME = 'plutto-cache-refresh';

        TaskManager.defineTask(TASK_NAME, async () => {
          try {
            await dataCache.refreshAllDue();
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } catch (_) {
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        });

        BackgroundFetch.registerTaskAsync(TASK_NAME, {
          minimumInterval: 12 * 60 * 60, // every 12 hours
          stopOnTerminate: false,
          startOnBoot: true,
        }).catch(() => {
          // Background fetch not available on this platform — that's fine
        });
      } catch (_) {
        // expo-task-manager not installed — rely on AppState listener only
      }
    }
  },
};

export default dataCache;