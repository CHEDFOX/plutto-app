/**
 * MEDIA CACHE — Downloads and caches all static media.
 * Checks backend manifest. Only re-downloads when hash changes.
 * Components use getMediaUri('transitions/lens_change.mp4') to get local path.
 *
 * Flow:
 * 1. App launch → initMediaCache()
 * 2. Fetches /media-manifest (list of files + hashes)
 * 3. Compares with locally stored manifest
 * 4. Downloads only changed/new files
 * 5. Components call getMediaUri(path) → returns local file:// URI
 * 6. If not cached yet, falls back to remote URL
 */
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'https://api.plutto.space';
const MANIFEST_URL = `${API}/api/public/media-manifest`;
const CACHE_DIR = `${FileSystem.cacheDirectory}plutto_media/`;
const MANIFEST_KEY = 'media_manifest_local';

let localManifest = {}; // { "transitions/lens_change.mp4": { hash: "abc123", localUri: "file://..." } }
let initialized = false;

/**
 * Initialize media cache. Call once on app launch.
 * Downloads any new/changed media in background.
 */
export async function initMediaCache() {
  try {
    // Ensure cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }

    // Load local manifest from AsyncStorage
    const stored = await AsyncStorage.getItem(MANIFEST_KEY);
    if (stored) {
      localManifest = JSON.parse(stored);
    }

    // Fetch remote manifest
    const resp = await fetch(MANIFEST_URL);
    if (!resp.ok) {
      console.log('[MediaCache] Manifest fetch failed, using local cache');
      initialized = true;
      return;
    }
    const remote = await resp.json();
    const remoteFiles = remote.files || {};

    // Compare and download changes
    let changed = 0;
    const downloads = [];

    for (const [path, info] of Object.entries(remoteFiles)) {
      const local = localManifest[path];
      if (local && local.hash === info.hash) continue; // unchanged

      // Need to download this file
      downloads.push({ path, hash: info.hash });
    }

    // Remove files that no longer exist on backend
    for (const path of Object.keys(localManifest)) {
      if (!remoteFiles[path]) {
        const localPath = CACHE_DIR + path.replace(/\//g, '_');
        try { await FileSystem.deleteAsync(localPath, { idempotent: true }); } catch (_) {}
        delete localManifest[path];
      }
    }

    if (downloads.length === 0) {
      console.log('[MediaCache] All media up to date');
      initialized = true;
      return;
    }

    console.log(`[MediaCache] Downloading ${downloads.length} files...`);

    // Download in parallel (max 3 concurrent)
    const batchSize = 3;
    for (let i = 0; i < downloads.length; i += batchSize) {
      const batch = downloads.slice(i, i + batchSize);
      await Promise.all(batch.map(async ({ path, hash }) => {
        try {
          const remoteUrl = `${API}/static/${path}`;
          const localPath = CACHE_DIR + path.replace(/\//g, '_');
          const result = await FileSystem.downloadAsync(remoteUrl, localPath);
          if (result.status === 200) {
            localManifest[path] = { hash, localUri: localPath };
            changed++;
            console.log(`[MediaCache] Downloaded: ${path}`);
          }
        } catch (e) {
          console.log(`[MediaCache] Failed: ${path}`, e.message);
        }
      }));
    }

    // Save updated manifest
    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(localManifest));
    console.log(`[MediaCache] ${changed} files updated`);
    initialized = true;
  } catch (e) {
    console.log('[MediaCache] Init error:', e.message);
    initialized = true; // still mark as initialized so fallback works
  }
}

/**
 * Get local URI for a media file. Falls back to remote URL if not cached.
 * @param {string} path - Relative path like "transitions/lens_change.mp4"
 * @returns {string} Local file URI or remote URL
 */
export function getMediaUri(path) {
  const local = localManifest[path];
  if (local && local.localUri) {
    return local.localUri;
  }
  // Fallback to remote URL
  return `${API}/static/${path}`;
}

/**
 * Check if a specific file is cached locally.
 * @param {string} path
 * @returns {boolean}
 */
export function isMediaCached(path) {
  return !!(localManifest[path] && localManifest[path].localUri);
}

/**
 * Force re-download a specific file (e.g., after error).
 * @param {string} path
 */
export async function refreshMedia(path) {
  try {
    const remoteUrl = `${API}/static/${path}`;
    const localPath = CACHE_DIR + path.replace(/\//g, '_');
    const result = await FileSystem.downloadAsync(remoteUrl, localPath);
    if (result.status === 200) {
      // Fetch hash from manifest
      const resp = await fetch(MANIFEST_URL);
      const remote = await resp.json();
      const hash = remote.files?.[path]?.hash || Date.now().toString();
      localManifest[path] = { hash, localUri: localPath };
      await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(localManifest));
    }
  } catch (e) {
    console.log(`[MediaCache] Refresh failed: ${path}`, e.message);
  }
}

/**
 * Clear all cached media.
 */
export async function clearMediaCache() {
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    localManifest = {};
    await AsyncStorage.removeItem(MANIFEST_KEY);
    console.log('[MediaCache] Cache cleared');
  } catch (e) {
    console.log('[MediaCache] Clear error:', e.message);
  }
}