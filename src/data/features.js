/**
 * FEATURE MAP v4 — 28 features. Each system has unique daily engagement.
 * 
 * interactive: true → needs user input
 * shareable: true → designed for screenshots
 * selector: true → rotatable/tappable element selector
 */

const VEDIC = [
  { section: 'EVERY DAY' },
  { cards: [
    { id: 'daily-vibe', title: 'Today', sub: 'Your sky right now', w: 0.55, h: 95, vis: 'bars' },
    { id: 'todays-word', title: "Today's word", w: 0.45, h: 95, shareable: true },
  ]},
  { cards: [
    { id: 'what-you-need-to-hear', title: 'What you need to hear', w: 1, h: 75, type: 'accent', shareable: true },
  ]},

  { section: 'WHO YOU ARE' },
  { cards: [
    { id: 'soul-profile', title: 'Who you are', w: 1, h: 110, type: 'hero' },
  ]},
  { cards: [
    { id: 'you-in-3-words', title: 'You in 3 words', w: 0.48, h: 85, shareable: true },
    { id: 'your-superpower', title: 'Your superpower', w: 0.52, h: 85, shareable: true },
  ]},

  { section: 'YOUR PLANETS' },
  { cards: [
    { id: 'planet-strength', title: 'Planet strength', sub: 'Explore each planet', w: 1, h: 95, type: 'hero', selector: true },
  ]},
  { cards: [
    { id: 'your-blind-spot', title: 'Your blind spot', w: 0.5, h: 80, shareable: true },
    { id: 'career-path', title: 'Career', w: 0.5, h: 80 },
  ]},

  { section: 'YOUR TIMELINE' },
  { cards: [
    { id: 'dasha-timeline', title: 'Your period', sub: 'Where you are in life', w: 1, h: 85, vis: 'line' },
  ]},
  { cards: [
    { id: 'danger-radar', title: 'Danger radar', w: 0.42, h: 75, type: 'accent' },
    { id: 'cosmic-bond', title: 'Compatibility', w: 0.58, h: 75, interactive: true },
  ]},
];

const KP = [
  { section: 'THIS MOMENT' },
  { cards: [
    { id: 'kp-ruling-planets', title: 'Right now', sub: 'This moment', w: 1, h: 90, vis: 'dots' },
  ]},
  { cards: [
    { id: 'todays-word', title: "Today's word", w: 0.5, h: 85, shareable: true },
    { id: 'your-superpower', title: 'Your superpower', w: 0.5, h: 85, shareable: true },
  ]},

  { section: 'PREDICTIONS' },
  { cards: [
    { id: 'kp-event-promise', title: 'Will it happen?', sub: 'Ask any life question', w: 1, h: 90, type: 'accent', interactive: true },
  ]},
  { cards: [
    { id: 'kp-chart', title: 'Your chart', w: 0.55, h: 85, type: 'hero' },
    { id: 'kp-profession', title: 'Career', w: 0.45, h: 85 },
  ]},
];

const WESTERN = [
  { section: 'TODAY' },
  { cards: [
    { id: 'western-daily-vibe', title: 'Today', sub: "Today's sky", w: 0.55, h: 95, vis: 'bars' },
    { id: 'todays-word', title: "Today's word", w: 0.45, h: 95, shareable: true },
  ]},

  { section: 'WHO YOU ARE' },
  { cards: [
    { id: 'western-chart', title: 'Sun · Moon · Rising', w: 1, h: 110, type: 'hero' },
  ]},
  { cards: [
    { id: 'you-in-3-words', title: 'You in 3 words', w: 0.48, h: 85, shareable: true },
    { id: 'western-element-balance', title: 'Your element', sub: 'Fire · Earth · Air · Water', w: 0.52, h: 85, selector: true },
  ]},
  { cards: [
    { id: 'your-superpower', title: 'Your superpower', w: 0.5, h: 80, shareable: true },
    { id: 'western-lilith', title: 'Your shadow', w: 0.5, h: 80 },
  ]},

  { section: 'THIS YEAR' },
  { cards: [
    { id: 'western-profections', title: "This year's theme", w: 1, h: 80, vis: 'line' },
  ]},
];

const CHINESE = [
  { section: 'YOUR ELEMENT' },
  { cards: [
    { id: 'chinese-day-master', title: 'Who you are', sub: 'Your core element', w: 1, h: 110, type: 'hero' },
  ]},
  { cards: [
    { id: 'chinese-element-balance', title: 'Five elements', sub: 'Wood · Fire · Earth · Metal · Water', w: 1, h: 90, selector: true },
  ]},
  { cards: [
    { id: 'you-in-3-words', title: 'You in 3 words', w: 0.48, h: 85, shareable: true },
    { id: 'chinese-yong-shen', title: 'Your medicine', w: 0.52, h: 85, type: 'accent' },
  ]},

  { section: 'TIMING' },
  { cards: [
    { id: 'chinese-luck-periods', title: 'Your decade', w: 0.55, h: 80, vis: 'line' },
    { id: 'your-superpower', title: 'Your superpower', w: 0.45, h: 80, shareable: true },
  ]},
  { cards: [
    { id: 'todays-word', title: "Today's word", w: 1, h: 70, shareable: true },
  ]},
];

const NUMEROLOGY = [
  { section: 'YOUR NUMBERS' },
  { cards: [
    { id: 'num-chart', title: 'Your numbers', sub: 'Complete profile', w: 1, h: 110, type: 'hero' },
  ]},
  { cards: [
    { id: 'num-life-path', title: 'Life path', w: 0.55, h: 90 },
    { id: 'your-superpower', title: 'Your superpower', w: 0.45, h: 90, shareable: true },
  ]},
  { cards: [
    { id: 'you-in-3-words', title: 'You in 3 words', w: 0.48, h: 80, shareable: true },
    { id: 'your-blind-spot', title: 'Your blind spot', w: 0.52, h: 80, shareable: true },
  ]},

  { section: 'RIGHT NOW' },
  { cards: [
    { id: 'num-personal-year', title: 'This year', sub: 'Your year theme', w: 1, h: 80, type: 'accent' },
  ]},
  { cards: [
    { id: 'todays-word', title: "Today's word", w: 1, h: 70, shareable: true },
  ]},

  { section: 'TOOLS' },
  { cards: [
    { id: 'num-name-analysis', title: 'Name lab', sub: 'Analyze any name', w: 1, h: 78, interactive: true },
  ]},
];

export const FEATURE_MAP = {
  bphs:    VEDIC,
  kp:      KP,
  western: WESTERN,
  chinese: CHINESE,
  num:     NUMEROLOGY,
};

export default FEATURE_MAP;