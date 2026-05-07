import { Dimensions } from 'react-native';
const { width: W, height: H } = Dimensions.get('window');

// Simple seeded PRNG — same seed = same star positions everywhere
function sr(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const STAR_COUNT = 200;
const _stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  const s = i + 1;
  const sizeRoll = sr(s * 7);
  const size = sizeRoll < 0.75 ? 0.3 + sr(s * 11) * 0.4 : 0.6 + sr(s * 13) * 0.5;
  _stars.push({
    id: i,
    x: sr(s * 3) * W,
    y: sr(s * 5) * H,
    size,
    baseOpacity: 0.12 + sr(s * 17) * 0.35,
    twinkleSpeed: 2500 + sr(s * 19) * 3500,
    twinkleDelay: sr(s * 23) * 4000,
    driftMag: 3 + sr(s * 29) * 5,
  });
}

export const STARS = _stars;