import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SYSTEMS } from '../theme/design';
import { useSystem } from '../context/SystemContext';

const { width: SW } = Dimensions.get('window');
const ITEM_W = 110;
const SIDE_PAD = (SW - ITEM_W) / 2;
const ARC_BOTTOM = 65;
const MAX_RISE = 50;
const COUNT = SYSTEMS.length;
const COPIES = 3;
const TOTAL = COUNT * COPIES;
const MID_START = COUNT; // start of middle copy

function curveY(dist) {
  return Math.min(dist * dist * 12, MAX_RISE);
}

export default function ArcSelector() {
  const { systemId, switchSystem } = useSystem();
  const activeIdx = SYSTEMS.findIndex(s => s.id === systemId);
  const scrollRef = useRef(null);
  const [visualIdx, setVisualIdx] = useState(activeIdx);
  const isResetting = useRef(false);

  // Build repeated array
  const items = [];
  for (let c = 0; c < COPIES; c++) {
    SYSTEMS.forEach((sys, i) => {
      items.push({ ...sys, originalIdx: i, key: `${c}-${i}` });
    });
  }

  const scrollToIdx = useCallback((scrollIdx, animated = true) => {
    scrollRef.current?.scrollTo({ x: scrollIdx * ITEM_W, animated });
  }, []);

  // Initial scroll to middle copy
  React.useEffect(() => {
    setTimeout(() => {
      scrollToIdx(MID_START + activeIdx, false);
    }, 100);
  }, []);

  const handleScrollEnd = useCallback((e) => {
    if (isResetting.current) {
      isResetting.current = false;
      return;
    }

    const rawIdx = Math.round(e.nativeEvent.contentOffset.x / ITEM_W);
    const originalIdx = ((rawIdx % COUNT) + COUNT) % COUNT;

    // Switch system
    switchSystem(SYSTEMS[originalIdx].id);
    setVisualIdx(originalIdx);

    // If we've scrolled into first or last copy, silently reset to middle
    if (rawIdx < COUNT || rawIdx >= COUNT * 2) {
      isResetting.current = true;
      setTimeout(() => {
        scrollToIdx(MID_START + originalIdx, false);
        isResetting.current = false;
      }, 50);
    }
  }, [switchSystem, scrollToIdx]);

  const handleTap = useCallback((scrollIdx) => {
    scrollToIdx(scrollIdx, true);
    const originalIdx = ((scrollIdx % COUNT) + COUNT) % COUNT;
    switchSystem(SYSTEMS[originalIdx].id);
    setVisualIdx(originalIdx);
  }, [switchSystem, scrollToIdx]);

  // Dots for SVG — show 5 around active
  const dots = SYSTEMS.map((_, i) => {
    const dist = Math.abs(i - visualIdx);
    // Handle wrap-around distance
    const wrapDist = Math.min(dist, COUNT - dist);
    const dir = i - visualIdx;
    const x = SW / 2 + dir * ITEM_W;
    const y = ARC_BOTTOM - curveY(wrapDist);
    return { x, y, wrapDist };
  });

  const extL = { x: dots[0].x - ITEM_W * 0.6, y: Math.max(5, dots[0].y - 10) };
  const extR = { x: dots[dots.length - 1].x + ITEM_W * 0.6, y: Math.max(5, dots[dots.length - 1].y - 10) };
  const all = [extL, ...dots, extR];

  let threadPath = `M ${all[0].x} ${all[0].y}`;
  for (let i = 0; i < all.length - 1; i++) {
    const curr = all[i];
    const next = all[i + 1];
    const mx = (curr.x + next.x) / 2;
    const my = (curr.y + next.y) / 2;
    threadPath += ` Q ${curr.x} ${curr.y} ${mx} ${my}`;
  }
  const last = all[all.length - 1];
  threadPath += ` Q ${all[all.length - 2].x} ${all[all.length - 2].y} ${last.x} ${last.y}`;

  return (
    <View style={s.wrap}>
      <Svg width={SW} height={ARC_BOTTOM + 10} style={s.svg} pointerEvents="none">
        <Path d={threadPath} stroke="rgba(255,255,255,0.08)" strokeWidth={1} fill="none" />
        {dots.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y}
            r={i === visualIdx ? 4 : 2.5}
            fill={i === visualIdx ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'} />
        ))}
      </Svg>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_W}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={200}
      >
        {items.map((sys, scrollIdx) => {
          const dist = Math.abs(sys.originalIdx - visualIdx);
          const wrapDist = Math.min(dist, COUNT - dist);
          const isActive = sys.originalIdx === visualIdx;
          const yOffset = curveY(wrapDist);

          return (
            <TouchableOpacity
              key={sys.key}
              activeOpacity={0.7}
              onPress={() => handleTap(scrollIdx)}
              style={[s.item, { paddingTop: ARC_BOTTOM + 16 + yOffset }]}
            >
              <Text
                numberOfLines={1}
                style={[
                  s.label,
                  isActive && s.labelActive,
                  !isActive && { opacity: wrapDist === 1 ? 0.35 : 0.2 },
                ]}
              >
                {sys.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    height: 135,
    overflow: 'hidden',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  item: {
    width: ITEM_W,
    alignItems: 'center',
  },
  label: {
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  labelActive: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.5,
  },
});