/**
 * UNIVERSAL MEDIA VIEW — Renders image, video, or GIF from any URI.
 * Auto-detects type from extension. Handles loading + errors.
 * Drop-in replacement anywhere media needs to appear.
 *
 * Usage:
 *   <MediaView uri="planets/vedic/Sun.png" style={{width:40,height:40}} rounded />
 *   <MediaView uri="readings/today/vedic.mp4" style={{width:'100%',height:160}} autoPlay />
 *   <MediaView uri="illustrations/wheel_bg.gif" style={{flex:1}} />
 */
import React,{useState,useRef,useEffect,useCallback} from 'react';
import {View,Image,Animated,Easing,StyleSheet} from 'react-native';
let VideoComp=null;
try{VideoComp=require('expo-av').Video}catch(_){try{const E=require('expo-video');VideoComp=E.VideoView||E.Video}catch(__){}}
let getMediaUri;
try{({getMediaUri}=require('../config/mediaCache'))}catch(_){getMediaUri=p=>'https://api.plutto.space/static/'+p}

const IMG_EXT=['.png','.jpg','.jpeg','.webp','.gif'];
const VID_EXT=['.mp4','.mov','.webm','.m4v'];

function getType(uri){
  const lower=(uri||'').toLowerCase();
  if(VID_EXT.some(e=>lower.endsWith(e)))return 'video';
  if(IMG_EXT.some(e=>lower.endsWith(e)))return 'image';
  return 'image'; // default
}

export default function MediaView({
  uri,          // relative path like 'planets/vedic/Sun.png' or full URL
  style,        // container style (width, height required)
  rounded,      // boolean — clip to circle
  autoPlay=false,// auto-play videos
  loop=false,    // loop videos
  muted=true,    // mute videos
  fadeIn=true,   // fade in on load
  onLoaded,      // callback when media loads
  onFailed,      // callback when media fails
  onFinish,      // callback when video finishes playing
  resizeMode='contain',
}){
  const[loaded,setLoaded]=useState(false);
  const[failed,setFailed]=useState(false);
  const opacity=useRef(new Animated.Value(fadeIn?0:1)).current;
  const vRef=useRef(null);

  // Resolve URI
  const resolvedUri=uri?(uri.startsWith('http')||uri.startsWith('file')?uri:getMediaUri(uri)):null;
  const type=getType(resolvedUri||uri||'');

  const handleLoad=useCallback(()=>{
    setLoaded(true);setFailed(false);
    if(fadeIn)Animated.timing(opacity,{toValue:1,duration:600,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}).start();
    if(onLoaded)onLoaded();
  },[fadeIn,onLoaded]);

  const handleError=useCallback(()=>{
    setFailed(true);setLoaded(false);
    if(onFailed)onFailed();
  },[onFailed]);

  // Auto-play video
  useEffect(()=>{
    if(type==='video'&&autoPlay&&vRef.current){
      setTimeout(()=>{try{vRef.current?.playAsync?.()}catch(e){}},200);
    }
  },[type,autoPlay,resolvedUri]);

  if(!resolvedUri||failed)return null;

  const containerStyle=[style,rounded?{borderRadius:9999,overflow:'hidden'}:null];

  if(type==='video'){
    return<Animated.View style={[containerStyle,{opacity}]}>
      {VideoComp?<VideoComp
        ref={vRef}
        source={{uri:resolvedUri}}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        shouldPlay={autoPlay}
        isLooping={loop}
        volume={muted?0:1}
        onLoad={handleLoad}
        onError={handleError}
        onPlaybackStatusUpdate={st=>{if(st.didJustFinish&&onFinish)onFinish()}}
      />:<View/>}
    </Animated.View>
  }

  // Image or GIF
  return<Animated.View style={[containerStyle,{opacity}]}>
    <Image
      source={{uri:resolvedUri}}
      style={StyleSheet.absoluteFill}
      resizeMode={resizeMode}
      onLoad={handleLoad}
      onError={handleError}
    />
  </Animated.View>
}

/**
 * Check if a path points to a video file.
 */
export function isVideo(path){return getType(path)==='video'}

/**
 * Check if a path points to an image/gif file.
 */
export function isImage(path){return getType(path)==='image'}