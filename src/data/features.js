const VEDIC = [
  { section: 'YOUR PLANETS' },
  { cards: [
    { id: 'planet-strength', title: 'Your planets', sub: 'Spin the wheel · explore each graha', w: 1, h: 100, type: 'hero', selector: true },
  ]},
  { section: 'YOUR STORY' },
  { cards: [
    { id: 'dasha-timeline', title: 'Life story', sub: 'Every chapter from birth to beyond', w: 1, h: 100, type: 'hero', vis: 'line' },
  ]},
  { cards: [
    { id: 'past-life', title: 'Past life', sub: 'Who you were before', w: 0.55, h: 90, type: 'accent' },
    { id: 'four-pillars', title: 'Four pillars', sub: 'Kama · Karma · Dharma · Moksha', w: 0.45, h: 90 },
  ]},
  { section: 'TODAY' },
  { cards: [
    { id: 'daily-vibe', title: 'Today', sub: 'What the day holds', w: 1, h: 85 },
  ]},
];

const KP = [
  { section: 'YOUR CHART' },
  { cards: [
    { id: 'kp-chart', title: 'House clock', sub: 'Spin through all 12 houses', w: 1, h: 100, type: 'hero' },
  ]},
  { section: 'ASK' },
  { cards: [
    { id: 'kp-event-promise', title: 'Ask the universe', sub: 'One number · one answer · once a day', w: 1, h: 90, type: 'accent', interactive: true },
  ]},
  { cards: [
    { id: 'todays-word', title: 'The word', sub: 'Tap a question', w: 1, h: 80, shareable: true },
  ]},
];

const WESTERN = [
  { section: 'YOUR PLANETS' },
  { cards: [
    { id: 'western-chart', title: 'Your planets', sub: 'Spin · explore · read every aspect', w: 1, h: 110, type: 'hero' },
  ]},
  { section: 'THE MIRROR' },
  { cards: [
    { id: 'blunt-seer', title: 'The blunt seer', sub: 'Tap if you dare', w: 1, h: 90, type: 'accent' },
  ]},
  { section: 'TIME' },
  { cards: [
    { id: 'western-daily-vibe', title: 'Your time', sub: 'Today · week · month', w: 1, h: 85 },
  ]},
];

const CHINESE = [
  { section: 'YOUR ELEMENT' },
  { cards: [
    { id: 'chinese-element-balance', title: 'Five elements', sub: 'Wood · Fire · Earth · Metal · Water', w: 1, h: 100, type: 'hero', selector: true },
  ]},
  { section: 'YOUR ANIMALS' },
  { cards: [
    { id: 'chinese-day-master', title: 'The zoo', sub: 'Your 4 hidden animals', w: 1, h: 100, type: 'hero' },
  ]},
];

const NUMEROLOGY = [
  { section: 'YOUR NUMBERS' },
  { cards: [
    { id: 'num-chart', title: 'Your numbers', sub: 'Every number that defines you', w: 1, h: 100, type: 'hero' },
  ]},
  { section: 'TOOLS' },
  { cards: [
    { id: 'num-name-analysis', title: 'Name correction', sub: 'Is your name working for you?', w: 1, h: 78, interactive: true },
  ]},
  { cards: [
    { id: 'num-biz-name', title: 'Business name', sub: 'Check your brand vibration', w: 1, h: 78, interactive: true },
  ]},
  { cards: [
    { id: 'num-mobile', title: 'Mobile number', sub: 'Dial your digits', w: 1, h: 78, interactive: true },
  ]},
];

const MANDALA = [];

export const FEATURE_MAP = {
  bphs:    VEDIC,
  kp:      KP,
  western: WESTERN,
  chinese: CHINESE,
  num:     NUMEROLOGY,
  mandala: MANDALA,
};

export default FEATURE_MAP;