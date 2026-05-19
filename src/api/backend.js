const API_BASE_URL = 'https://api.plutto.space';

const _post = async (endpoint, body = {}) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    console.error(`API ${endpoint}:`, e);
    return { success: false, error: e.message };
  }
};

// Feature API wrapper — extracts math object for renderers
const _feature = async (endpoint, body = {}) => {
  try {
    const r = await _post(endpoint, body);
    if (r.math) return { success: true, data: r.math };
    if (r.success !== undefined) return r;
    if (r.detail) return { success: false, error: r.detail };
    return { success: true, data: r };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const _get = async (endpoint) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public${endpoint}`);
    return await r.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const _bd = (kundliData) => {
  // Handle both formats: direct kundliData or nested
  if (kundliData?.raw?.birth_details) {
    return { kundli_data: kundliData };
  }
  // If kundliData IS the birth_details
  if (kundliData?.year || kundliData?.birth_details) {
    return { kundli_data: { raw: { birth_details: kundliData.birth_details || kundliData } } };
  }
  return { kundli_data: kundliData };
};
// ─── CORE ───

export const generateKundli = async (userData, birthData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/kundli/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
        name: userData?.name || 'User',
        gender: userData?.gender || birthData?.gender || null,
        language: userData?.language || 'en',
        date: { day: parseInt(birthData?.date?.day) || 1, month: birthData?.date?.monthIndex || 1, year: parseInt(birthData?.date?.year) || 2000 },
        time: { hour: parseInt(birthData?.time?.hour) || 12, minute: parseInt(birthData?.time?.minute) || 0 },
        place: { name: birthData?.place?.name || 'New Delhi', lat: birthData?.place?.lat || 28.6139, lng: birthData?.place?.lng || 77.2090 },
      }),
    });
    const data = await response.json();
    if (data.success) {
      const kundli = data.kundli || {};
      const planets = kundli.planets || {};
      const birthDate = `${birthData?.date?.year}-${String(birthData?.date?.monthIndex).padStart(2,'0')}-${String(birthData?.date?.day).padStart(2,'0')}`;
      return { success: true, data: {
        raw: { ...kundli, birth_details: { date: birthDate, time: `${String(birthData?.time?.hour).padStart(2,'0')}:${String(birthData?.time?.minute).padStart(2,'0')}`, latitude: birthData?.place?.lat, longitude: birthData?.place?.lng, place: birthData?.place?.name, year: parseInt(birthData?.date?.year), month: parseInt(birthData?.date?.monthIndex), day: parseInt(birthData?.date?.day), hour: parseInt(birthData?.time?.hour), minute: parseInt(birthData?.time?.minute) } },
        formatted: data.formatted, sun_sign: planets.Sun?.rashi_english || '', moon_sign: planets.Moon?.rashi_english || '', ascendant: kundli.ascendant?.rashi_english || '', nakshatra: planets.Moon?.nakshatra || '', current_dasha: kundli.current_dasha || {}, planets,
      }};
    }
    return { success: false, error: data.detail || 'Failed' };
  } catch (e) { return { success: false, error: e.message }; }
};

export const chatWithOracle = async (message, kundliData, history = [], language = 'en') => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, kundli_data: kundliData, history: history.slice(-8), language }) });
    return { success: true, data: await r.json() };
  } catch (e) { return { success: false, error: e.message }; }
};

// Streaming version — uses XMLHttpRequest because React Native's fetch doesn't reliably
// expose response.body as a ReadableStream on Android. XHR's onprogress fires as data arrives.
// Yields: { type: 'delta', text } for each token, { type: 'done', hook, response, intent } at end
export const chatWithOracleStream = async function* (message, kundliData, history = [], language = 'en') {
  const url = `${API_BASE_URL}/api/public/chat/stream`;
  const body = JSON.stringify({ message, kundli_data: kundliData, history: history.slice(-8), language });

  // Buffer of events we have parsed but not yet yielded
  const eventQueue = [];
  let resolveNext = null;
  let streamDone = false;
  let streamError = null;
  let textBuffer = '';
  let processedLength = 0;

  const pushEvent = (ev) => {
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      r(ev);
    } else {
      eventQueue.push(ev);
    }
  };

  const parseNewChunks = (responseText) => {
    // Only parse the new portion since last call
    const newPortion = responseText.slice(processedLength);
    processedLength = responseText.length;
    textBuffer += newPortion;
    // Split on \n\n event boundary
    const events = textBuffer.split('\n\n');
    textBuffer = events.pop(); // keep incomplete tail
    for (const event of events) {
      if (!event.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(event.slice(6));
        if (data.delta) {
          pushEvent({ type: 'delta', text: data.delta });
        } else if (data.done) {
          pushEvent({ type: 'done', hook: data.hook || '', response: data.response, intent: data.intent });
        } else if (data.error) {
          streamError = new Error(data.error);
        }
      } catch (e) {
        // skip malformed
      }
    }
  };

  // Kick off the request
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onprogress = () => {
    parseNewChunks(xhr.responseText);
  };
  xhr.onload = () => {
    parseNewChunks(xhr.responseText);
    streamDone = true;
    if (resolveNext) { const r = resolveNext; resolveNext = null; r(null); }
  };
  xhr.onerror = () => {
    streamError = new Error('XHR error: ' + xhr.statusText);
    streamDone = true;
    if (resolveNext) { const r = resolveNext; resolveNext = null; r(null); }
  };
  xhr.ontimeout = () => {
    streamError = new Error('XHR timeout');
    streamDone = true;
    if (resolveNext) { const r = resolveNext; resolveNext = null; r(null); }
  };
  xhr.timeout = 60000;
  xhr.send(body);

  // Async generator loop
  try {
    while (true) {
      if (eventQueue.length > 0) {
        yield eventQueue.shift();
        continue;
      }
      if (streamDone) {
        if (streamError) throw streamError;
        return;
      }
      // Wait for next event or completion
      const ev = await new Promise((resolve) => { resolveNext = resolve; });
      if (ev) yield ev;
    }
  } finally {
    try { xhr.abort(); } catch (e) {}
  }
};

export const transcribeAudio = async (audioUri) => {
  try {
    const fd = new FormData(); fd.append('file', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' });
    const r = await fetch(`${API_BASE_URL}/api/public/whisper/transcribe`, { method: 'POST', body: fd });
    const d = await r.json(); return { success: true, transcript: d.text || d.transcript || '' };
  } catch (e) { return { success: false, error: e.message }; }
};

export const textToSpeech = async (text) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const d = await r.json(); return d.audio ? { success: true, audio: d.audio, format: d.format } : { success: false, error: 'No audio' };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getDailyRitual = async (userData, kundliData) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/daily-ritual`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userData?.name || 'Seeker', kundli_data: kundliData }) });
    return await r.json();
  } catch (e) { return { success: false, error: e.message }; }
};

// ─── SHAREABLE ───
export const getSoulProfile = (k, lang = 'en') => _feature('/soul-profile', { ..._bd(k), language: lang });
export const getRareTraits = (k, lang = 'en') => _feature('/rare-traits', { ..._bd(k), language: lang });
export const getIdealPartner = (k, lang = 'en') => _feature('/ideal-partner', { ..._bd(k), language: lang });
export const getDailyVibe = (k, lang = 'en') => _feature('/daily-vibe', { ..._bd(k), language: lang });
export const getYearMap = (k, year, lang = 'en') => _feature('/year-map', { ..._bd(k), year, language: lang });
export const getGemstoneProfile = (k, lang = 'en') => _feature('/gemstone-profile', { ..._bd(k), language: lang });

// ─── COMPATIBILITY ───
export const getCosmicMatch = (p1, p2, type = 'marriage') => _post('/cosmic-match', { person1: p1, person2: p2, relationship_type: type });
export const getMatchOracle = (p1, p2, question, topic) => _post('/match-oracle', { person1: p1, person2: p2, question, topic });
export const getRelationshipXray = (p1, p2) => _post('/relationship-xray', { person1: p1, person2: p2 });

// ─── ENGAGEMENT ───
export const getPowerHours = (k, lang = 'en') => _feature('/power-hours', { ..._bd(k), language: lang });
export const getDangerRadar = (k, lang = 'en') => _feature('/danger-radar', { ..._bd(k), language: lang });
export const getMoneyCalendar = (k, lang = 'en') => _feature('/money-calendar', { ..._bd(k), language: lang });
export const getPastEvent = (k, date, type = 'general') => _post('/past-event', { ..._bd(k), event_date: date, event_type: type });
export const getWhatIf = (k, scenario, details = {}) => _post('/what-if', { ..._bd(k), scenario, details });
export const getFamilyKarma = (k, members = []) => _post('/family-karma', { ..._bd(k), members });

// ─── UNIQUE ───
export const getCosmicNovel = (k, lang = 'en') => _feature('/cosmic-novel', { ..._bd(k), language: lang });
export const getPlanetStrength = (k, lang = 'en') => _feature('/planet-strength', { ..._bd(k), language: lang });

// ─── SPIRITUAL ───
export const getFestivals = (k, lang = 'en') => _feature('/festivals', { ..._bd(k), language: lang });
export const getPersonalDeities = (k, lang = 'en') => _feature('/personal-deities', { ..._bd(k), language: lang });
export const getPlanetDeity = (planet) => _get(`/planet-deity/${planet}`);

// ─── TOOLS ───
export const findMuhurta = (k, event = 'general', days = 90) => _post('/find-muhurta', { ..._bd(k), event, days });
export const getMuhurtaTopics = () => _get('/muhurta-topics');

export const saveUser = async () => ({ success: true });

// ─── NEW FEATURES ───
export const getActiveYogas = (k, lang = 'en') => _feature('/active-yogas', { ..._bd(k), language: lang });
export const getHealthMap = (k, lang = 'en') => _feature('/health-map', { ..._bd(k), language: lang });
export const getCareerPath = (k, lang = 'en') => _feature('/career-path', { ..._bd(k), language: lang });
export const getEclipseImpact = (k, lang = 'en') => _feature('/eclipse-impact', { ..._bd(k), language: lang });
export const getNadiReading = (k, lang = 'en') => _feature('/nadi-reading', { ..._bd(k), language: lang });
export const getWeeklyForecast = (k, lang = 'en') => _feature('/weekly-forecast', { ..._bd(k), language: lang });
export const getNumerology = (k, lang = 'en') => _feature('/numerology', { ..._bd(k), language: lang });
export const getVastu = (k, lang = 'en') => _feature('/vastu', { ..._bd(k), language: lang });
export const getNakshatraProfile = (k, lang = 'en') => _feature('/nakshatra-profile', { ..._bd(k), language: lang });

// Generic feature dispatcher — returns { anchor, line, hold, math, thread }
const FEATURE_API = {
  'daily-vibe':       (k) => getDailyVibe(k),
  'power-hours':      (k) => getPowerHours(k),
  'planet-strength':  (k) => getPlanetStrength(k),
  'year-map':         (k) => getYearMap(k, new Date().getFullYear()),
  'danger-radar':     (k) => getDangerRadar(k),
  'gemstone-profile': (k) => getGemstoneProfile(k),
  'personal-deities': (k) => getPersonalDeities(k),
  'soul-profile':     (k) => getSoulProfile(k),
  'rare-traits':      (k) => getRareTraits(k),
  'cosmic-novel':     (k) => getCosmicNovel(k),
  'money-calendar':   (k) => getMoneyCalendar(k),
  'festivals':        (k) => getFestivals(k),
  'ideal-partner':    (k) => getIdealPartner(k),
};
export const getFeature = async (featureId, kundliData, lang = 'en') => {
  // FeatureSkyScreen needs the FULL response (anchor, line, hold, math)
  // Don't use _feature() which strips to math only
  try {
    const r = await _post('/' + featureId, { ..._bd(kundliData), language: lang });
    if (r?.anchor) return r; // full response with anchor/line/hold/math
    if (r?.detail) return { success: false, error: r.detail };
    return r;
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ─── Bond chat — dedicated endpoint for compatibility reading ───
export const chatBondStream = async function* (message, userKundli, partnerKundli, matchResult, partnerType, history = [], language = 'en') {
  const url = `${API_BASE_URL}/api/public/chat/bond/stream`;
  const body = JSON.stringify({
    message,
    kundli_data: userKundli,
    partner_data: partnerKundli || {},
    match_result: matchResult || {},
    partner_type: partnerType || 'life',
    history: history.slice(-8),
    language,
  });

  // Try dedicated endpoint first, fall back to regular chat with context
  try {
    const stream = _streamFromUrl(url, body);
    let gotData = false;
    for await (const event of stream) {
      gotData = true;
      yield event;
    }
    if (gotData) return;
  } catch (e) { /* fallback below */ }

  // Fallback: inject context into regular chat endpoint
  const context = `[BOND MODE] Reading compatibility. Partner type: ${partnerType}. Match: ${matchResult ? `${matchResult.total_score}/${matchResult.max_score} (${Math.round(matchResult.percentage)}%)` : 'N/A'}. Answer about this bond.\n\n`;
  const fallbackStream = chatWithOracleStream(history.length <= 1 ? context + message : message, userKundli, history, language);
  for await (const event of fallbackStream) yield event;
};

// ─── Other Sky chat — dedicated endpoint for reading another person ───
export const chatOtherSkyStream = async function* (message, userKundli, otherKundli, otherData, history = [], language = 'en') {
  const url = `${API_BASE_URL}/api/public/chat/other-sky/stream`;
  const body = JSON.stringify({
    message,
    kundli_data: userKundli,
    other_kundli: otherKundli || {},
    other_birth: otherData ? { year: otherData.year, month: otherData.month, day: otherData.day, hour: otherData.hour, minute: otherData.minute, lat: otherData.lat, lng: otherData.lng, place: otherData.place } : {},
    history: history.slice(-8),
    language,
  });

  try {
    const stream = _streamFromUrl(url, body);
    let gotData = false;
    for await (const event of stream) {
      gotData = true;
      yield event;
    }
    if (gotData) return;
  } catch (e) { /* fallback below */ }

  // Fallback: inject context into regular chat endpoint
  const otherInfo = otherData ? `born ${otherData.day}/${otherData.month}/${otherData.year} in ${otherData.place || 'unknown'}` : '';
  const context = `[OTHER SKY MODE] Reading another person's chart for the user. Other person: ${otherInfo}. Do NOT read the user's chart.\n\n`;
  const fallbackStream = chatWithOracleStream(history.length <= 1 ? context + message : message, otherKundli || userKundli, history, language);
  for await (const event of fallbackStream) yield event;
};

// ─── Shared XHR streaming helper ───
const _streamFromUrl = async function* (url, body) {
  const eventQueue = [];
  let resolveNext = null;
  let streamDone = false;
  let streamError = null;
  let textBuffer = '';
  let processedLength = 0;

  const pushEvent = (ev) => {
    if (resolveNext) { const r = resolveNext; resolveNext = null; r(ev); }
    else eventQueue.push(ev);
  };

  const parseNewChunks = (responseText) => {
    const newPortion = responseText.slice(processedLength);
    processedLength = responseText.length;
    textBuffer += newPortion;
    const events = textBuffer.split('\n\n');
    textBuffer = events.pop();
    for (const event of events) {
      if (!event.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(event.slice(6));
        if (data.delta) pushEvent({ type: 'delta', text: data.delta });
        else if (data.type === 'delta' && data.text) pushEvent({ type: 'delta', text: data.text });
        else if (data.done || data.type === 'done') pushEvent({ type: 'done', hook: data.hook || '', response: data.response, intent: data.intent });
        else if (data.error || data.type === 'error') streamError = new Error(data.error || data.message);
      } catch (e) {}
    }
  };

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onprogress = () => parseNewChunks(xhr.responseText);
  xhr.onload = () => { parseNewChunks(xhr.responseText); streamDone = true; if (resolveNext) resolveNext(null); };
  xhr.onerror = () => { streamError = new Error('Network error'); streamDone = true; if (resolveNext) resolveNext(null); };
  xhr.ontimeout = () => { streamError = new Error('Timeout'); streamDone = true; if (resolveNext) resolveNext(null); };
  xhr.timeout = 60000;
  xhr.send(body);

  while (true) {
    if (eventQueue.length > 0) { const ev = eventQueue.shift(); if (ev) yield ev; continue; }
    if (streamDone) { if (streamError) throw streamError; break; }
    const ev = await new Promise(r => { resolveNext = r; });
    if (ev) yield ev;
    else if (streamDone) break;
  }
};

// ─── Places proxy — API key stays on server ───
export const searchPlaces = async (query) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/places/autocomplete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return await r.json();
  } catch (e) { return { predictions: [] }; }
};

export const getPlaceDetails = async (placeId) => {
  try {
    const r = await fetch(`${API_BASE_URL}/api/public/places/details`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_id: placeId }),
    });
    return await r.json();
  } catch (e) { return { result: {} }; }
};

// ─── Side screen chat — Cosmic Bond + Another Sky ───
export const chatSideStream = async function* (message, kundliData, otherKundliData, otherName, mode = 'bond', history = [], language = 'en') {
  const url = `${API_BASE_URL}/api/public/chat/side/stream`;
  const body = JSON.stringify({
    message, kundli_data: kundliData, other_kundli_data: otherKundliData,
    other_name: otherName, mode, history: history.slice(-8), language,
  });

  try {
    const stream = _streamFromUrl(url, body);
    let gotData = false;
    for await (const event of stream) {
      gotData = true;
      yield event;
    }
    if (gotData) return;
  } catch (e) { /* fallback below */ }

  // Fallback: use regular oracle chat with context
  const context = mode === 'bond'
    ? `[Reading the bond between user and ${otherName}. Answer about this connection.]\n\n`
    : `[Reading ${otherName}'s chart for the user. Explain this person to the user.]\n\n`;
  // XHR streaming broken in Expo — use non-streaming fallback
  try {
    const result = await chatWithOracle(
      history.length <= 1 ? context + message : message,
      kundliData, history, language
    );
    const text = result?.data?.response || result?.response || '';
    if (text) {
      yield { type: 'delta', text };
      yield { type: 'done', response: text };
    }
  } catch (e) {}
};

;