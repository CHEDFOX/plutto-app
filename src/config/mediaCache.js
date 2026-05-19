/**
 * MEDIA CACHE — Downloads and caches all static media.
 * Checks backend manifest. Only re-downloads when hash changes.
 * Components use getMediaUri('transitions/lens_change.mp4') to get local path.
 */
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setManifest } from '../components/RemoteMedia';

const API = 'https://api.plutto.space';
const MANIFEST_URL = `${API}/api/public/media-manifest`;
const CACHE_DIR = `${FileSystem.cacheDirectory}plutto_media/`;
const MANIFEST_KEY = 'media_manifest_local';

let localManifest = {};
let initialized = false;

// Sync the file-list view that RemoteMedia uses for resolveMedia().
function syncRemoteMediaManifest(filesObj) {
  const view = {};
  for (const [path, info] of Object.entries(filesObj || {})) {
    view[path] = info?.hash || '1';
  }
  setManifest(view);
}

export async function initMediaCache() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }

    const stored = await AsyncStorage.getItem(MANIFEST_KEY);
    if (stored) {
      localManifest = JSON.parse(stored);
      syncRemoteMediaManifest(localManifest);
    }

    const resp = await fetch(MANIFEST_URL);
    if (!resp.ok) {
      console.log('[MediaCache] Manifest fetch failed, using local cache');
      initialized = true;
      return;
    }
    const remote = await resp.json();
    const remoteFiles = remote.files || {};
    syncRemoteMediaManifest(remoteFiles);

    let changed = 0;
    const downloads = [];
    for (const [path, info] of Object.entries(remoteFiles)) {
      const local = localManifest[path];
      if (local && local.hash === info.hash) continue;
      downloads.push({ path, hash: info.hash });
    }

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

    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(localManifest));
    syncRemoteMediaManifest(remoteFiles);
    console.log(`[MediaCache] ${changed} files updated`);
    initialized = true;
  } catch (e) {
    console.log('[MediaCache] Init error:', e.message);
    initialized = true;
  }
}

export function getMediaUri(path) {
  const local = localManifest[path];
  if (local && local.localUri) {
    return local.localUri;
  }
  return `${API}/static/${path}`;
}

export function isMediaCached(path) {
  return !!(localManifest[path] && localManifest[path].localUri);
}

export async function refreshMedia(path) {
  try {
    const remoteUrl = `${API}/static/${path}`;
    const localPath = CACHE_DIR + path.replace(/\//g, '_');
    const result = await FileSystem.downloadAsync(remoteUrl, localPath);
    if (result.status === 200) {
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