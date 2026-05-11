/**
 * MEDIA CACHE — Smart image loading with server-side cache busting.
 * 
 * How it works:
 * 1. On app start, calls /media-manifest to get all file modification times
 * 2. Compares with locally stored manifest (AsyncStorage)
 * 3. Builds image URLs with ?v=timestamp — React Native caches by full URL
 * 4. When you replace an image on the server, its timestamp changes
 * 5. New timestamp = new URL = fresh fetch. Same timestamp = cached version.
 * 
 * Result: images cached forever until you change them on the server.
 */

import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setManifest as setRemoteManifest } from '../components/RemoteMedia';

const API = 'https://api.plutto.space/api/public';
const BASE = 'https://api.plutto.space/static';
const MANIFEST_KEY = '@media_manifest';

let manifest = {};    // { "planets/Saturn.png": 1718400000, ... }
let ready = false;

// ─── Initialize on app start ───
export async function initMediaCache() {
  try {
    // Load stored manifest
    const stored = await AsyncStorage.getItem(MANIFEST_KEY);
    const old = stored ? JSON.parse(stored) : {};

    // Fetch fresh manifest from server
    const res = await fetch(`${API}/media-manifest`);
    const data = await res.json();
    manifest = data.files || {};

    // Find changed files
    const changed = [];
    for (const [path, mtime] of Object.entries(manifest)) {
      if (old[path] !== mtime) changed.push(path);
    }

    // Prefetch changed images (cache bust with new version)
    if (changed.length > 0) {
      console.log(`[MediaCache] ${changed.length} images updated, prefetching...`);
      changed.forEach(path => {
        const url = `${BASE}/${path}?v=${manifest[path]}`;
        Image.prefetch(url).catch(() => {});
      });
    } else {
      console.log('[MediaCache] All images up to date');
    }

    // Prefetch any images not yet cached (first install)
    if (!stored) {
      console.log(`[MediaCache] First run, prefetching all ${Object.keys(manifest).length} images...`);
      Object.entries(manifest).forEach(([path, mtime]) => {
        Image.prefetch(`${BASE}/${path}?v=${mtime}`).catch(() => {});
      });
    }

    // Store new manifest
    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
    setRemoteManifest(manifest);
    ready = true;
  } catch (e) {
    console.log('[MediaCache] Manifest fetch failed, using cached:', e.message);
    try {
      const stored = await AsyncStorage.getItem(MANIFEST_KEY);
      if (stored) { manifest = JSON.parse(stored); setRemoteManifest(manifest); }
    } catch (_) {}
    ready = true;
  }
}

// ─── Get versioned image source ───
// Usage: imageSource('planets/Saturn.png') → { uri: 'https://...?v=1718400000' }
export function imageSource(path) {
  const mtime = manifest[path];
  if (!mtime) return null;  // file doesn't exist on server
  return { uri: `${BASE}/${path}?v=${mtime}` };
}

// ─── Convenience getters ───
export function planetImage(name) { return imageSource(`planets/${name}.png`); }
export function systemImage(id) {
  const map = { bphs: 'vedic', kp: 'kp', western: 'western', chinese: 'chinese', numerology: 'numerology', mandala: 'mandala' };
  return imageSource(`systems/${map[id] || id}.png`);
}
export function chapterImage(index) { return imageSource(`features/vedic/chapters/ch${index}.png`); }
export function featureImage(systemDir, featureId) { return imageSource(`features/${systemDir}/${featureId}.png`); }

// ─── All images for a category ───
export function allPlanets() {
  return ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
    .map(n => ({ name: n, source: planetImage(n) }))
    .filter(p => p.source !== null);
}

export function allChapters() {
  return Array.from({ length: 12 }, (_, i) => ({
    index: i + 1,
    source: chapterImage(i + 1),
  })).filter(c => c.source !== null);
}

// ─── Check if an image exists on server ───
export function hasImage(path) { return !!manifest[path]; }
export function isReady() { return ready; }
