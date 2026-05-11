/**
 * ARC SELECTOR v6
 * 
 * - Center item drops DOWN (perceived as heading below the arc)
 * - Inactive items float higher along the arc
 * - Image: old fades out THEN new fades in (sequential, not crossfade)
 * - Thread: deeper dip, more visible, double-line glow
 * - Numerology: wider items, no clipping
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, Easing, Platform, Image,
} from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

// ─── Layout ───
const IMG_SIZE = SW * 0.55;
const IMG_TOP = -IMG_SIZE * 0.18;
const IMG_BOTTOM = IMG_TOP + IMG_SIZE;

const GAP_IMAGE_TO_ARC = 55;
const ARC_AREA_TOP = IMG_BOTTOM + GAP_IMAGE_TO_ARC;

const ITEM_WIDTH = 130;
const SIDE_PAD = (SW - ITEM_WIDTH) / 2;
const ARC_DROP = 24;                           // how much center drops below others
const ARC_AREA_HEIGHT = ARC_DROP + 70;
const BOTTOM_GAP = 30;

const TOTAL_HEIGHT = ARC_AREA_TOP + ARC_AREA_HEIGHT + BOTTOM_GAP;

// ─── Systems ───
const SYSTEMS = [
  { id: 'bphs',    label: 'Vedic' },
  { id: 'kp',      label: 'KP' },
  { id: 'western', label: 'Western' },
  { id: 'chinese', label: 'Chinese' },
  { id: 'num',     label: 'Numerology' },
  { id: 'mandala', label: 'Mandala' },
];

const COUNT = SYSTEMS.length;
const COPIES = 3;
const MID_START = COUNT;
const INITIAL_OFFSET = MID_START * ITEM_WIDTH;

const SYSTEM_IMAGES = {
  bphs:    { uri: 'https://api.plutto.space/static/systems/system_vedic.png' },
  kp:      { uri: 'https://api.plutto.space/static/systems/system_kp.png' },
  western: { uri: 'https://api.plutto.space/static/systems/system_western.png' },
  chinese: { uri: 'https://api.plutto.space/static/systems/system_chinese.png' },
  num:     { uri: 'https://api.plutto.space/static/systems/system_numerology.png' },
};

const ITEMS = [];
for (let c = 0; c < COPIES; c++) {
  SYSTEMS.forEach((sys, i) => {
    ITEMS.push({ ...sys, originalIdx: i, key: `${c}-${i}` });
  });
}

// ─── Thread: deeper dip, attractive curve ───
function buildThread() {
  const baseY = ARC_AREA_TOP + 20;
  const dip = 28;
  // Smooth curve that dips in the center
  return `M -30 ${baseY + 6} C ${SW * 0.2} ${baseY - 2}, ${SW * 0.35} ${baseY + dip - 4}, ${SW * 0.5} ${baseY + dip} C ${SW * 0.65} ${baseY + dip - 4}, ${SW * 0.8} ${baseY - 2}, ${SW + 30} ${baseY + 6}`;
}

function buildThreadGlow() {
  const baseY = ARC_AREA_TOP + 20;
  const dip = 28;
  return `M -30 ${baseY + 6} C ${SW * 0.2} ${baseY - 2}, ${SW * 0.35} ${baseY + dip - 4}, ${SW * 0.5} ${baseY + dip} C ${SW * 0.65} ${baseY + dip - 4}, ${SW * 0.8} ${baseY - 2}, ${SW + 30} ${baseY + 6}`;
}

// ─── Main ───
export default function ArcSelector({ activeSystem = 'bphs', onSystemChange, onActivePress }) {
  const [activeId, setActiveId] = useState(activeSystem);
  const [displayedId, setDisplayedId] = useState(activeSystem);
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(INITIAL_OFFSET)).current;
  const isResetting = useRef(false);

  // Image animation — sequential: out then in
  const imgOpacity = useRef(new Animated.Value(1)).current;
  const imgScale = useRef(new Animated.Value(1)).current;

  const initIdx = SYSTEMS.findIndex(s => s.id === activeSystem);
  const threadPath = buildThread();
  const svgHeight = ARC_AREA_TOP + ARC_AREA_HEIGHT;

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: (MID_START + initIdx) * ITEM_WIDTH,
        animated: false,
      });
    }, 50);
  }, []);

  // Sequential image transition: fade out old → swap source → fade in new
  const transitionImage = useCallback((newId) => {
    // Phase 1: fade out current
    Animated.parallel([
      Animated.timing(imgOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
      Animated.timing(imgScale, {
        toValue: 1.03,
        duration: 250,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: swap the source
      setDisplayedId(newId);
      imgScale.setValue(0.9);

      // Phase 3: fade in new
      Animated.parallel([
        Animated.timing(imgOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.bezier(0, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.spring(imgScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [imgOpacity, imgScale]);

  const handleScrollEnd = useCallback((e) => {
    if (isResetting.current) {
      isResetting.current = false;
      return;
    }

    const x = e.nativeEvent.contentOffset.x;
    const rawIdx = Math.round(x / ITEM_WIDTH);
    const originalIdx = ((rawIdx % COUNT) + COUNT) % COUNT;
    const newId = SYSTEMS[originalIdx].id;

    if (newId !== activeId) {
      setActiveId(newId);
      transitionImage(newId);
      if (onSystemChange) onSystemChange(newId);
    }

    if (rawIdx < COUNT * 0.5 || rawIdx >= COUNT * 2.5) {
      isResetting.current = true;
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: (MID_START + originalIdx) * ITEM_WIDTH,
          animated: false,
        });
        isResetting.current = false;
      }, 50);
    }
  }, [activeId, transitionImage, onSystemChange]);

  return (
    <View style={[s.container, { height: TOTAL_HEIGHT }]}>

      {/* SVG: dashed arcs + thread */}
      <Svg width={SW} height={svgHeight} style={StyleSheet.absoluteFill}>
        {/* Dashed concentric arcs behind image */}
        <Ellipse
          cx={SW / 2} cy={IMG_TOP + IMG_SIZE * 0.5}
          rx={SW * 0.50} ry={SW * 0.46}
          stroke="white" strokeWidth={0.8}
          strokeDasharray="6,9" fill="none" opacity={0.06}
        />
        <Ellipse
          cx={SW / 2} cy={IMG_TOP + IMG_SIZE * 0.5}
          rx={SW * 0.39} ry={SW * 0.35}
          stroke="white" strokeWidth={0.8}
          strokeDasharray="4,11" fill="none" opacity={0.04}
        />
        <Ellipse
          cx={SW / 2} cy={IMG_TOP + IMG_SIZE * 0.5}
          rx={SW * 0.28} ry={SW * 0.24}
          stroke="white" strokeWidth={0.8}
          strokeDasharray="3,13" fill="none" opacity={0.025}
        />

        {/* Thread glow (wider, dimmer) */}
        <Path
          d={threadPath}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={4}
          fill="none"
        />
        {/* Thread core (sharp, brighter) */}
        <Path
          d={threadPath}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={0.8}
          fill="none"
        />
      </Svg>

      {/* System image — sequential fade */}
      <View style={s.imageWrap} pointerEvents="none">
        <Animated.View
          style={[
            s.imgLayer,
            {
              opacity: imgOpacity,
              transform: [{ scale: imgScale }],
            },
          ]}
        >
          <Image
            source={SYSTEM_IMAGES[displayedId]}
            style={s.img}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Scrollable arc labels */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentOffset={{ x: INITIAL_OFFSET, y: 0 }}
        contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={[s.scrollView, { top: ARC_AREA_TOP }]}
      >
        {ITEMS.map((item, index) => {
          const inputRange = [
            (index - 2) * ITEM_WIDTH,
            (index - 1) * ITEM_WIDTH,
            index * ITEM_WIDTH,
            (index + 1) * ITEM_WIDTH,
            (index + 2) * ITEM_WIDTH,
          ];

          // Scale: center = full, edges = smaller
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.38, 0.48, 1, 0.48, 0.38],
            extrapolate: 'clamp',
          });

          // Center drops DOWN (positive Y), edges float UP (negative Y)
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [-6, -3, ARC_DROP, -3, -6],
            extrapolate: 'clamp',
          });

          // Opacity
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.12, 0.2, 0.92, 0.2, 0.12],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => {
                if (item.id === activeId && onActivePress) {
                  onActivePress(item.id);
                } else {
                  // Scroll to this item
                  const targetIdx = MID_START + item.originalIdx;
                  scrollRef.current?.scrollTo({ x: targetIdx * ITEM_WIDTH, animated: true });
                }
              }}
            >
              <Animated.View
                style={[
                  s.item,
                  {
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <View style={s.dot} />
                <Text style={s.label} numberOfLines={1}>
                  {item.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: SW,
    overflow: 'visible',
  },
  imageWrap: {
    position: 'absolute',
    top: IMG_TOP,
    left: (SW - IMG_SIZE) / 2,
    width: IMG_SIZE,
    height: IMG_SIZE,
  },
  imgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  img: {
    width: IMG_SIZE,
    height: IMG_SIZE,
  },
  scrollView: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ARC_AREA_HEIGHT,
    overflow: 'visible',
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    overflow: 'visible',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 22,
    fontWeight: '300',
    color: 'white',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});