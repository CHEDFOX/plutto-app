/**
 * FEATURE CACHE — Smart feature content loader.
 * 
 * On app open: calls /batch-interpret with stale feature IDs.
 * ONE LLM call generates all readings. Cached locally by tier:
 *   - daily:  refresh every day
 *   - static: refresh every 7 days
 *   - yearly: refresh every 30 days
 * 
 * Usage:
 *   await featureCache.load('bphs', kundliData);
 *   const reading = featureCache.get('soul-profile');
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.plutto.space/api/public';

// Cache TTLs in milliseconds
const TTL = {
  daily:  24 * 60 * 60 * 1000,          // 1 day
  static: 7 * 24 * 60 * 60 * 1000,      // 7 days
  yearly: 30 * 24 * 60 * 60 * 1000,     // 30 days
};

const CACHE_KEY = 'plutto_feature_cache';

class FeatureCache {
  constructor() {
    this.cache = {};        // { featureId: { anchor, line, hold, reading, math, tier, timestamp } }
    this.loading = false;
    this.loaded = false;
    this.listeners = new Set();
  }

  // Subscribe to cache updates
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    this.listeners.forEach(fn => fn());
  }

  // Get a cached feature reading
  get(featureId) {
    return this.cache[featureId] || null;
  }

  // Get all features for a system
  getAll(systemId) {
    const prefix = {
      bphs: '', kp: 'kp-', western: 'western-', chinese: 'chinese-', num: 'num-',
    }[systemId] || '';

    const results = {};
    for (const [key, val] of Object.entries(this.cache)) {
      if (systemId === 'bphs') {
        // Vedic features have no prefix
        if (!key.includes('-') || key.startsWith('daily-') || key.startsWith('power-') ||
            key.startsWith('soul-') || key.startsWith('planet-') || key.startsWith('active-') ||
            key.startsWith('rare-') || key.startsWith('nakshatra-') || key.startsWith('dasha-') ||
            key.startsWith('cosmic-') || key.startsWith('career-') || key.startsWith('year-') ||
            key.startsWith('weekly-') || key.startsWith('money-') || key.startsWith('danger-') ||
            key.startsWith('gemstone-') || key.startsWith('health-') || key.startsWith('eclipse-') ||
            key.startsWith('ideal-') || key.startsWith('another-') || key.startsWith('personal-') ||
            key.startsWith('nadi-') || key.startsWith('find-') || key === 'chart' ||
            key === 'festivals' || key === 'vastu') {
          results[key] = val;
        }
      } else if (key.startsWith(prefix)) {
        results[key] = val;
      }
    }
    return results;
  }

  // Check if a feature is stale
  _isStale(featureId) {
    const cached = this.cache[featureId];
    if (!cached || !cached.timestamp) return true;

    const tier = cached.tier || 'static';
    const ttl = TTL[tier] || TTL.static;
    return Date.now() - cached.timestamp > ttl;
  }

  // Load from disk
  async _loadFromDisk() {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (e) {
      console.log('Cache load error:', e);
    }
  }

  // Save to disk
  async _saveToDisk() {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.log('Cache save error:', e);
    }
  }

  /**
   * Main load function. Call on app open and system switch.
   * 
   * @param {string} systemId - bphs, kp, western, chinese, num
   * @param {object} kundliData - { raw: { birth_details: {...} } }
   * @param {string} language - 'en', 'hi', etc.
   */
  async load(systemId, kundliData, language = 'en') {
    if (this.loading) return;
    this.loading = true;

    // Load from disk first (instant)
    if (!this.loaded) {
      await this._loadFromDisk();
      this.loaded = true;
      this._notify();
    }

    // Determine which features are already fresh
    const allFeatures = this._getSystemFeatures(systemId);
    const cachedFeatures = allFeatures.filter(fid => !this._isStale(fid));

    // Check system info freshness
    const sysInfoKey = `${systemId}-system-info`;
    if (!this._isStale(sysInfoKey)) {
      cachedFeatures.push('system-info');
    }

    // If everything is fresh, skip API call
    if (cachedFeatures.length === allFeatures.length) {
      this.loading = false;
      return;
    }

    // Call batch-interpret
    try {
      const response = await fetch(`${API_BASE}/batch-interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemId,
          kundli_data: kundliData,
          cached_features: cachedFeatures,
          language,
        }),
      });

      const data = await response.json();

      if (data.features) {
        const now = Date.now();
        for (const [fid, feature] of Object.entries(data.features)) {
          if (feature.reading || feature.line) {
            this.cache[fid] = {
              ...feature,
              timestamp: now,
            };
          }
        }

        // Cache system info if returned
        if (data.system_info) {
          this.cache[`${systemId}-system-info`] = {
            reading: data.system_info,
            timestamp: now,
            tier: 'static',
          };
        }

        await this._saveToDisk();
        this._notify();
      }
    } catch (e) {
      console.log('Batch interpret error:', e);
    }

    this.loading = false;
  }

  // Force refresh a single feature (e.g., after user input)
  async refresh(featureId, kundliData, language = 'en') {
    try {
      const response = await fetch(`${API_BASE}/${featureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kundli_data: kundliData, language }),
      });
      const data = await response.json();
      if (data.anchor) {
        this.cache[featureId] = {
          ...data,
          reading: data.reading || data.line,
          timestamp: Date.now(),
        };
        await this._saveToDisk();
        this._notify();
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  // Get system info (LLM-generated description)
  getSystemInfo(systemId) {
    const cached = this.cache[`${systemId}-system-info`];
    return cached?.reading || null;
  }

  // Clear all cache
  async clear() {
    this.cache = {};
    await AsyncStorage.removeItem(CACHE_KEY);
    this._notify();
  }

  _getSystemFeatures(systemId) {
    const map = {
      bphs: ['daily-vibe', 'todays-word', 'what-you-need-to-hear',
             'soul-profile', 'you-in-3-words', 'your-superpower',
             'planet-strength', 'your-blind-spot', 'career-path',
             'dasha-timeline', 'danger-radar', 'cosmic-bond'],
      kp: ['kp-ruling-planets', 'todays-word', 'your-superpower',
           'kp-event-promise', 'kp-chart', 'kp-profession'],
      western: ['western-daily-vibe', 'todays-word',
                'western-chart', 'you-in-3-words', 'western-element-balance',
                'your-superpower', 'western-lilith', 'western-profections'],
      chinese: ['chinese-day-master', 'chinese-element-balance',
                'you-in-3-words', 'chinese-yong-shen',
                'chinese-luck-periods', 'your-superpower', 'todays-word'],
      num: ['num-chart', 'num-life-path', 'your-superpower',
            'you-in-3-words', 'your-blind-spot',
            'num-personal-year', 'todays-word', 'num-name-analysis'],
    };
    return map[systemId] || map.bphs;
  }
}

// Singleton
export const featureCache = new FeatureCache();
export default featureCache;