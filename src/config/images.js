/**
 * REMOTE IMAGES — All images served from backend.
 * 
 * Directory structure on server:
 * static/
 *   systems/             ← arc headers
 *   planets/             ← small planet icons (wheel center)
 *   readings/
 *     planets/           ← planet reading illustrations (larger, can be gif/mp4)
 *     chapters/          ← life story chapter illustrations
 *     features/          ← per-feature reading illustrations
 *   features/            ← feature card thumbnails
 */

const BASE = 'https://api.plutto.space/static';

export const SYSTEM_IMAGES = {
  bphs:       { uri: `${BASE}/systems/vedic.png` },
  kp:         { uri: `${BASE}/systems/kp.png` },
  western:    { uri: `${BASE}/systems/western.png` },
  chinese:    { uri: `${BASE}/systems/chinese.png` },
  numerology: { uri: `${BASE}/systems/numerology.png` },
  mandala:    { uri: `${BASE}/systems/mandala.png` },
};

export const PLANET_ICONS = {
  Sun: `planets/Sun`, Moon: `planets/Moon`, Mars: `planets/Mars`,
  Mercury: `planets/Mercury`, Jupiter: `planets/Jupiter`, Venus: `planets/Venus`,
  Saturn: `planets/Saturn`, Rahu: `planets/Rahu`, Ketu: `planets/Ketu`,
};

export const PLANET_READINGS = {
  Sun: `readings/planets/Sun`, Moon: `readings/planets/Moon`, Mars: `readings/planets/Mars`,
  Mercury: `readings/planets/Mercury`, Jupiter: `readings/planets/Jupiter`, Venus: `readings/planets/Venus`,
  Saturn: `readings/planets/Saturn`, Rahu: `readings/planets/Rahu`, Ketu: `readings/planets/Ketu`,
};

export const CHAPTER_PATHS = {};
for (let i = 1; i <= 12; i++) CHAPTER_PATHS[i] = `readings/chapters/ch${i}`;

export const FEATURE_READINGS = {
  'planet-strength':         'readings/features/planet-strength',
  'dasha-timeline':          'readings/features/dasha-timeline',
  'past-life':               'readings/features/past-life',
  'four-pillars':            'readings/features/four-pillars',
  'daily-vibe':              'readings/features/daily-vibe',
  'kp-chart':                'readings/features/kp-chart',
  'kp-event-promise':        'readings/features/kp-event-promise',
  'todays-word':             'readings/features/todays-word',
  'western-chart':           'readings/features/western-chart',
  'blunt-seer':              'readings/features/blunt-seer',
  'western-daily-vibe':      'readings/features/western-daily-vibe',
  'chinese-element-balance': 'readings/features/chinese-element-balance',
  'chinese-day-master':      'readings/features/chinese-day-master',
  'num-chart':               'readings/features/num-chart',
  'num-name-analysis':       'readings/features/num-name-analysis',
  'num-biz-name':            'readings/features/num-biz-name',
  'num-mobile':              'readings/features/num-mobile',
};

export { BASE as IMAGE_BASE };
