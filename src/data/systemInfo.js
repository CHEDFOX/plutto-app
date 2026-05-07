/**
 * System descriptions — shown when user taps the active system name.
 * Short, educational, no jargon.
 */

const SYSTEM_INFO = {
  bphs: {
    name: 'Vedic Astrology',
    origin: 'India · ~3000 BCE',
    tradition: 'Parashara · BPHS',
    description: 'The oldest living astrological tradition. Born in ancient India, preserved in the Brihat Parashara Hora Shastra — a text attributed to the sage Parashara, father of Vyasa who composed the Mahabharata.\n\nVedic astrology uses the sidereal zodiac — aligned with the actual constellations, not the seasons. It reads your karma through planetary periods called dashas, 27 lunar mansions called nakshatras, and a precise system of planetary dignity.\n\nWhere Western astrology asks "who are you?", Vedic astrology asks "what is your path?" It maps not just personality but timing — when things will unfold, what periods bring what lessons.',
    keyIdea: 'Your chart is a map of karma. The stars don\'t cause events — they indicate the timing of what your soul chose to experience.',
  },

  kp: {
    name: 'KP Astrology',
    origin: 'India · 1960s',
    tradition: 'Krishnamurti Paddhati',
    description: 'Created by Professor K.S. Krishnamurti in the 1960s, KP is Vedic astrology refined to surgical precision. Where traditional Vedic can be ambiguous, KP gives yes or no.\n\nThe breakthrough: Krishnamurti subdivided the 27 nakshatras into 249 sub-lord divisions. Each cusp of your chart has a sub-lord, and that sub-lord determines whether an event is promised in your life or not.\n\nKP is the system astrologers use when they need to answer specific questions: Will I get married? When will I get the job? Is this investment safe? It doesn\'t do personality — it does predictions.',
    keyIdea: 'The sub-lord decides everything. If the sub-lord of a house cusp signifies that house, the event is promised. If not, it\'s denied.',
  },

  western: {
    name: 'Western Astrology',
    origin: 'Mesopotamia · Greece · ~500 BCE',
    tradition: 'Tropical · Hellenistic',
    description: 'Born in Babylon, refined by the Greeks, and now the most widely practiced astrology in the world. Western astrology uses the tropical zodiac — aligned with Earth\'s seasons, not the stars.\n\nYour Sun sign is just the beginning. Western astrology reads the angles between planets (aspects), the balance of elements in your chart, and sophisticated timing techniques like profections and zodiacal releasing.\n\nIts strength is psychological depth. It maps your inner landscape — motivations, fears, growth edges, and relationship patterns — with nuance that other systems don\'t attempt.',
    keyIdea: 'The chart is a mirror. It doesn\'t tell you what will happen — it shows you who you are, so you can choose more consciously.',
  },

  chinese: {
    name: 'Chinese Astrology',
    origin: 'China · ~2000 BCE',
    tradition: 'BaZi · Four Pillars of Destiny',
    description: 'Four Pillars of Destiny — or BaZi — reads your fate through the five elements: Wood, Fire, Earth, Metal, Water. Your birth moment creates four pillars (year, month, day, hour), each containing a heavenly stem and earthly branch.\n\nThe Day Stem is your core self — your Day Master. Everything else in the chart is read in relation to it. Are you a strong tree that needs pruning, or a small flame that needs fuel?\n\nBaZi excels at practical questions: career direction, best timing for decisions, which relationships support you. Chinese emperors used it to select ministers, plan wars, and choose marriage partners.',
    keyIdea: 'You are an element in nature. Balance comes from understanding what you need — and the universe provides it in 10-year cycles called luck pillars.',
  },

  num: {
    name: 'Numerology',
    origin: 'Babylon · Greece · India',
    tradition: 'Chaldean · Pythagorean',
    description: 'Numbers are the language underneath language. Pythagoras called them "the first things in nature." The Chaldeans of ancient Babylon mapped letters to numbers and found that names and dates carry vibrations.\n\nYour birth date gives you core numbers that never change — your Life Path (life direction), Birth Number (natural talents), and Personal Year (annual theme). Your name gives you Destiny, Soul Urge, and Personality numbers.\n\nNumerology is the simplest system to understand and the fastest to apply. Change your name\'s spelling, pick the right date for a launch, choose a phone number that resonates — small shifts with measurable effects.',
    keyIdea: 'Every number from 1 to 9 is an archetype. Your numbers tell you which archetypes you embody and which lessons you\'re here to learn.',
  },
};

export default SYSTEM_INFO;