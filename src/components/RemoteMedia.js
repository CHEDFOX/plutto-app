/**
 * REMOTE MEDIA — Universal component that renders any media type.
 * 
 * Drop a PNG, GIF, MP4, MOV, or WebP on the server.
 * This component auto-detects the type and renders correctly.
 * 
 * Usage:
 *   <RemoteMedia path="planets/Saturn" size={150} style={{ opacity: 0.7 }} />
 *   <RemoteMedia path="features/vedic/chapters/ch3" size={120} rounded />
 *   <RemoteMedia path="systems/vedic" width={400} height={200} />
 * 
 * It checks the manifest for what file exists (Saturn.png? Saturn.gif? Saturn.mp4?)
 * and renders the right component.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

let VideoView, useVideoPlayer;
try {
  const expoVideo = require('expo-video');
  VideoView = expoVideo.VideoView;
  useVideoPlayer = expoVideo.useVideoPlayer;
} catch (e) {
  // expo-video not installed — video won't render
}

const BASE = 'https://api.plutto.space/static';
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'mov'];
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
const VIDEO_EXTS = ['mp4', 'mov'];

// Shared manifest reference — set by mediaCache.initMediaCache()
let manifestRef = {};
export function setManifest(m) { manifestRef = m; }

/**
 * Find what file exists for a given base path.
 * e.g. "planets/Saturn" → checks manifest for planets/Saturn.png, .gif, .mp4, etc.
 * Returns { uri, type: 'image'|'video'|'gif', ext } or null
 */
function resolveMedia(basePath) {
  // If basePath already has extension, use it directly
  const hasExt = EXTENSIONS.some(e => basePath.endsWith(`.${e}`));
  if (hasExt) {
    const ext = basePath.split('.').pop().toLowerCase();
    const mtime = manifestRef[basePath];
    if (!mtime) return null;
    return {
      uri: `${BASE}/${basePath}?v=${mtime}`,
      type: VIDEO_EXTS.includes(ext) ? 'video' : (ext === 'gif' ? 'gif' : 'image'),
      ext,
    };
  }

  // Try each extension
  for (const ext of EXTENSIONS) {
    const fullPath = `${basePath}.${ext}`;
    const mtime = manifestRef[fullPath];
    if (mtime) {
      return {
        uri: `${BASE}/${fullPath}?v=${mtime}`,
        type: VIDEO_EXTS.includes(ext) ? 'video' : (ext === 'gif' ? 'gif' : 'image'),
        ext,
      };
    }
  }
  return null;
}

// ─── Video sub-component ───
function VideoMedia({ uri, width, height, style, loop = true }) {
  if (!VideoView || !useVideoPlayer) return null;
  const player = useVideoPlayer(uri, p => {
    p.loop = loop;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={[{ width, height }, style]}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

// ─── Main Component ───
export default function RemoteMedia({
  path,                // e.g. "planets/Saturn" or "planets/Saturn.png"
  size,                // shorthand for width=height=size
  width: w,
  height: h,
  style,
  rounded = false,     // borderRadius = size/2
  fadeIn = true,       // fade in on load
  loop = true,         // for videos
  resizeMode = 'contain',
  fallback = null,     // render this if no media found
}) {
  const [media, setMedia] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  const finalW = w || size || 100;
  const finalH = h || size || 100;

  useEffect(() => {
    const resolved = resolveMedia(path);
    setMedia(resolved);
    setLoaded(false);
    opacity.setValue(0);
  }, [path]);

  const onLoad = () => {
    setLoaded(true);
    if (fadeIn) {
      Animated.timing(opacity, { toValue: 1, duration: 400, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
    } else {
      opacity.setValue(1);
    }
  };

  if (!media) return fallback;

  const containerStyle = [
    { width: finalW, height: finalH, overflow: 'hidden' },
    rounded && { borderRadius: finalW / 2 },
    style,
  ];

  // Video
  if (media.type === 'video') {
    return (
      <View style={containerStyle}>
        <VideoMedia uri={media.uri} width={finalW} height={finalH} loop={loop} />
      </View>
    );
  }

  // Image (PNG, JPG, WebP, GIF)
  return (
    <Animated.View style={[containerStyle, fadeIn && { opacity }]}>
      <Image
        source={{ uri: media.uri }}
        style={{ width: finalW, height: finalH }}
        resizeMode={resizeMode}
        onLoad={onLoad}
      />
    </Animated.View>
  );
}

// ─── Hook for checking what's available ───
export function useMediaExists(path) {
  const [exists, setExists] = useState(false);
  useEffect(() => { setExists(resolveMedia(path) !== null); }, [path]);
  return exists;
}
