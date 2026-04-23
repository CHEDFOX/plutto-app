/**
 * i18n.js — Multilingual translations for Jyotish AI
 * Languages: en, hi, es, pt, zh, ja
 * Usage: import { t, tFeature } from '../i18n';
 *        t('askAnything', language)
 *        tFeature('daily-vibe', 'title', language)
 */

const UI = {
  // ─── Chat ───
  askAnything:    { en: 'Ask anything...', hi: 'कुछ भी पूछें...', es: 'Pregunta lo que sea...', pt: 'Pergunte qualquer coisa...', zh: '问任何问题...', ja: '何でも聞いて...' },
  readingStars:   { en: 'Reading the stars...', hi: 'तारे पढ़ रहे हैं...', es: 'Leyendo las estrellas...', pt: 'Lendo as estrelas...', zh: '正在解读星象...', ja: '星を読んでいます...' },
  starsUnclear:   { en: 'The stars are unclear. Please try again.', hi: 'तारे अस्पष्ट हैं। कृपया फिर प्रयास करें।', es: 'Las estrellas no están claras. Intenta de nuevo.', pt: 'As estrelas não estão claras. Tente novamente.', zh: '星象不明。请重试。', ja: '星が不明です。もう一度お試しください。' },
  send:           { en: 'Send', hi: 'भेजें', es: 'Enviar', pt: 'Enviar', zh: '发送', ja: '送信' },

  // ─── Features UI ───
  explore:        { en: 'Explore', hi: 'खोजें', es: 'Explorar', pt: 'Explorar', zh: '探索', ja: '探索' },
  share:          { en: 'Share', hi: 'शेयर', es: 'Compartir', pt: 'Compartilhar', zh: '分享', ja: '共有' },
  tryAgain:       { en: 'Try again', hi: 'फिर कोशिश करें', es: 'Intentar de nuevo', pt: 'Tentar novamente', zh: '重试', ja: 'もう一度' },
  comingSoon:     { en: 'Coming soon', hi: 'जल्द आ रहा है', es: 'Próximamente', pt: 'Em breve', zh: '即将推出', ja: '近日公開' },
  loading:        { en: 'Loading...', hi: 'लोड हो रहा...', es: 'Cargando...', pt: 'Carregando...', zh: '加载中...', ja: '読み込み中...' },
  featureComingSoon: { en: 'Feature coming soon', hi: 'फीचर जल्द आ रहा है', es: 'Función próximamente', pt: 'Recurso em breve', zh: '功能即将推出', ja: '機能は近日公開' },

  // ─── Auth ───
  welcomeBack:    { en: 'Welcome back', hi: 'वापसी पर स्वागत', es: 'Bienvenido de nuevo', pt: 'Bem-vindo de volta', zh: '欢迎回来', ja: 'おかえりなさい' },
  createAccount:  { en: 'Create account', hi: 'खाता बनाएँ', es: 'Crear cuenta', pt: 'Criar conta', zh: '创建账户', ja: 'アカウント作成' },
  signIn:         { en: 'Sign in', hi: 'साइन इन', es: 'Iniciar sesión', pt: 'Entrar', zh: '登录', ja: 'サインイン' },
  email:          { en: 'Email', hi: 'ईमेल', es: 'Correo', pt: 'Email', zh: '邮箱', ja: 'メール' },
  password:       { en: 'Password', hi: 'पासवर्ड', es: 'Contraseña', pt: 'Senha', zh: '密码', ja: 'パスワード' },
  name:           { en: 'Name', hi: 'नाम', es: 'Nombre', pt: 'Nome', zh: '姓名', ja: '名前' },

  // ─── Birth Input ───
  birthDate:      { en: 'Birth Date', hi: 'जन्म तिथि', es: 'Fecha de nacimiento', pt: 'Data de nascimento', zh: '出生日期', ja: '生年月日' },
  birthTime:      { en: 'Birth Time', hi: 'जन्म समय', es: 'Hora de nacimiento', pt: 'Hora de nascimento', zh: '出生时间', ja: '出生時刻' },
  birthPlace:     { en: 'Birth Place', hi: 'जन्म स्थान', es: 'Lugar de nacimiento', pt: 'Local de nascimento', zh: '出生地点', ja: '出生地' },
  enterBirthPlace:{ en: 'Enter your birth city...', hi: 'अपना जन्म शहर दर्ज करें...', es: 'Ingresa tu ciudad de nacimiento...', pt: 'Digite sua cidade natal...', zh: '输入出生城市...', ja: '出生都市を入力...' },
  next:           { en: 'Next', hi: 'आगे', es: 'Siguiente', pt: 'Próximo', zh: '下一步', ja: '次へ' },
  done:           { en: 'Done', hi: 'पूरा', es: 'Listo', pt: 'Pronto', zh: '完成', ja: '完了' },
  generateKundli: { en: 'Generate your chart', hi: 'अपनी कुंडली बनाएँ', es: 'Generar tu carta', pt: 'Gerar seu mapa', zh: '生成你的星盘', ja: 'チャートを生成' },

  // ─── Cosmic Bond / Another Sky ───
  addToFamily:    { en: 'Add to Family', hi: 'परिवार में जोड़ें', es: 'Añadir a familia', pt: 'Adicionar à família', zh: '添加到家庭', ja: '家族に追加' },
  compatibility:  { en: 'Compatibility', hi: 'अनुकूलता', es: 'Compatibilidad', pt: 'Compatibilidade', zh: '兼容性', ja: '相性' },
  anotherSky:     { en: 'Another Sky', hi: 'एक और आकाश', es: 'Otro cielo', pt: 'Outro céu', zh: '另一片天空', ja: '別の空' },
  askAboutBond:   { en: 'Ask about this bond...', hi: 'इस बंधन के बारे में पूछें...', es: 'Pregunta sobre este vínculo...', pt: 'Pergunte sobre este vínculo...', zh: '询问这段关系...', ja: 'この絆について聞く...' },
  askAboutChart:  { en: 'Ask about their chart...', hi: 'उनकी कुंडली के बारे में पूछें...', es: 'Pregunta sobre su carta...', pt: 'Pergunte sobre o mapa...', zh: '询问他们的星盘...', ja: '彼らのチャートについて...' },
  searchCity:     { en: 'Search city...', hi: 'शहर खोजें...', es: 'Buscar ciudad...', pt: 'Buscar cidade...', zh: '搜索城市...', ja: '都市を検索...' },

  // ─── Settings ───
  settings:       { en: 'Settings', hi: 'सेटिंग्स', es: 'Ajustes', pt: 'Configurações', zh: '设置', ja: '設定' },
  language:       { en: 'Language', hi: 'भाषा', es: 'Idioma', pt: 'Idioma', zh: '语言', ja: '言語' },
  logout:         { en: 'Logout', hi: 'लॉग आउट', es: 'Cerrar sesión', pt: 'Sair', zh: '退出', ja: 'ログアウト' },

  // ─── Planet Strength educational ───
  whatGoverns:    { en: 'what {p} governs', hi: '{p} क्या नियंत्रित करता है', es: 'qué gobierna {p}', pt: 'o que {p} governa', zh: '{p}掌管什么', ja: '{p}が司るもの' },
  itsNature:      { en: 'its nature', hi: 'इसका स्वभाव', es: 'su naturaleza', pt: 'sua natureza', zh: '其本质', ja: 'その性質' },
  inYourChart:    { en: 'in your chart', hi: 'आपकी कुंडली में', es: 'en tu carta', pt: 'no seu mapa', zh: '在你的星盘中', ja: 'あなたのチャートで' },
  currentState:   { en: 'current state', hi: 'वर्तमान स्थिति', es: 'estado actual', pt: 'estado atual', zh: '当前状态', ja: '現在の状態' },
  strengthGives:  { en: 'what this strength gives you', hi: 'यह शक्ति आपको क्या देती है', es: 'lo que esta fuerza te da', pt: 'o que essa força te dá', zh: '这个力量给你什么', ja: 'この強さがあなたに与えるもの' },
  weaknessMeans:  { en: 'what this weakness means', hi: 'इस कमज़ोरी का अर्थ', es: 'qué significa esta debilidad', pt: 'o que essa fraqueza significa', zh: '这个弱点意味着什么', ja: 'この弱さの意味' },
  day:            { en: 'day', hi: 'दिन', es: 'día', pt: 'dia', zh: '日', ja: '日' },
  gemstone:       { en: 'gemstone', hi: 'रत्न', es: 'gema', pt: 'pedra', zh: '宝石', ja: '宝石' },
  color:          { en: 'color', hi: 'रंग', es: 'color', pt: 'cor', zh: '颜色', ja: '色' },

  // ─── Common renderer labels ───
  bestFor:        { en: 'Best for', hi: 'इसके लिए उत्तम', es: 'Mejor para', pt: 'Melhor para', zh: '最适合', ja: '最適' },
  avoid:          { en: 'Avoid', hi: 'बचें', es: 'Evitar', pt: 'Evitar', zh: '避免', ja: '避ける' },
  mantra:         { en: 'Mantra', hi: 'मंत्र', es: 'Mantra', pt: 'Mantra', zh: '咒语', ja: 'マントラ' },
  shiftsIn:       { en: 'Shifts in', hi: 'बदलाव', es: 'Cambia en', pt: 'Muda em', zh: '转变于', ja: '変化まで' },
  nextVibe:       { en: 'Next vibe', hi: 'अगली ऊर्जा', es: 'Próxima vibra', pt: 'Próxima vibe', zh: '下一个能量', ja: '次のバイブ' },
  bestMonth:      { en: 'Best month', hi: 'सबसे अच्छा महीना', es: 'Mejor mes', pt: 'Melhor mês', zh: '最佳月份', ja: '最良の月' },
  challenge:      { en: 'Challenge', hi: 'चुनौती', es: 'Desafío', pt: 'Desafio', zh: '挑战', ja: '課題' },
  lookFor:        { en: 'Look for', hi: 'खोजें', es: 'Busca', pt: 'Procure', zh: '寻找', ja: '探す' },
  timing:         { en: 'Timing', hi: 'समय', es: 'Momento', pt: 'Momento', zh: '时机', ja: 'タイミング' },
  rightNow:       { en: 'RIGHT NOW', hi: 'अभी', es: 'AHORA', pt: 'AGORA', zh: '此刻', ja: '今' },
  allChapters:    { en: 'ALL CHAPTERS', hi: 'सभी अध्याय', es: 'TODOS LOS CAPÍTULOS', pt: 'TODOS OS CAPÍTULOS', zh: '所有章节', ja: '全章' },
  currentScene:   { en: 'CURRENT SCENE', hi: 'वर्तमान दृश्य', es: 'ESCENA ACTUAL', pt: 'CENA ATUAL', zh: '当前场景', ja: '現在のシーン' },
  plotTwist:      { en: 'PLOT TWIST', hi: 'कथानक मोड़', es: 'GIRO ARGUMENTAL', pt: 'REVIRAVOLTA', zh: '情节转折', ja: 'どんでん返し' },
  bestDays:       { en: 'BEST DAYS TO INVEST', hi: 'निवेश के सर्वश्रेष्ठ दिन', es: 'MEJORES DÍAS PARA INVERTIR', pt: 'MELHORES DIAS PARA INVESTIR', zh: '最佳投资日', ja: '最良の投資日' },
  avoidDays:      { en: 'AVOID DAYS', hi: 'बचने के दिन', es: 'DÍAS A EVITAR', pt: 'DIAS A EVITAR', zh: '避免的日子', ja: '避ける日' },
  upcomingPhases: { en: 'UPCOMING PHASES', hi: 'आगामी चरण', es: 'FASES PRÓXIMAS', pt: 'FASES PRÓXIMAS', zh: '即将到来的阶段', ja: '今後のフェーズ' },
  weakRemedies:   { en: 'WEAKNESS REMEDIES', hi: 'कमज़ोरी उपाय', es: 'REMEDIOS', pt: 'REMÉDIOS', zh: '弱点补救', ja: '弱点の対策' },
  noAlerts:       { en: 'No alerts — smooth sailing ahead', hi: 'कोई चेतावनी नहीं — आगे सब ठीक', es: 'Sin alertas — todo bien', pt: 'Sem alertas — tudo tranquilo', zh: '没有警报——一帆风顺', ja: 'アラートなし——順調です' },
  rareTraitsFound:{ en: 'RARE TRAITS FOUND', hi: 'दुर्लभ गुण मिले', es: 'RASGOS RAROS ENCONTRADOS', pt: 'TRAÇOS RAROS ENCONTRADOS', zh: '发现稀有特征', ja: '稀少な特性を発見' },
  // ─── Soul profile labels ───
  mind:           { en: 'Mind', hi: 'मन', es: 'Mente', pt: 'Mente', zh: '心灵', ja: '心' },
  love:           { en: 'Love', hi: 'प्रेम', es: 'Amor', pt: 'Amor', zh: '爱情', ja: '愛' },
  drive:          { en: 'Drive', hi: 'प्रेरणा', es: 'Impulso', pt: 'Impulso', zh: '驱力', ja: '原動力' },
  purpose:        { en: 'Purpose', hi: 'उद्देश्य', es: 'Propósito', pt: 'Propósito', zh: '目的', ja: '目的' },
  superpower:     { en: 'Superpower', hi: 'महाशक्ति', es: 'Superpoder', pt: 'Superpoder', zh: '超能力', ja: '超能力' },
  blindSpot:      { en: 'Blind spot', hi: 'अंधा बिंदु', es: 'Punto ciego', pt: 'Ponto cego', zh: '盲点', ja: '盲点' },
  lifeTheme:      { en: 'Life theme', hi: 'जीवन विषय', es: 'Tema de vida', pt: 'Tema de vida', zh: '人生主题', ja: '人生のテーマ' },
  element:        { en: 'Element', hi: 'तत्व', es: 'Elemento', pt: 'Elemento', zh: '元素', ja: '元素' },
  // ─── Gemstone labels ───
  metal:          { en: 'Metal', hi: 'धातु', es: 'Metal', pt: 'Metal', zh: '金属', ja: '金属' },
  finger:         { en: 'Finger', hi: 'अंगुली', es: 'Dedo', pt: 'Dedo', zh: '手指', ja: '指' },
  price:          { en: 'Price', hi: 'कीमत', es: 'Precio', pt: 'Preço', zh: '价格', ja: '価格' },
  // ─── Partner labels ───
  venusSign:      { en: 'Venus sign', hi: 'शुक्र राशि', es: 'Signo de Venus', pt: 'Signo de Vênus', zh: '金星星座', ja: '金星星座' },
  seventhHouse:   { en: '7th house', hi: '7वाँ भाव', es: 'Casa 7', pt: 'Casa 7', zh: '第七宫', ja: '第7ハウス' },
  navamsa:        { en: 'Navamsa', hi: 'नवमांश', es: 'Navamsa', pt: 'Navamsa', zh: '九分图', ja: 'ナヴァムシャ' },
  bestMatch:      { en: 'Best match', hi: 'सबसे अच्छा मेल', es: 'Mejor pareja', pt: 'Melhor par', zh: '最佳匹配', ja: '最良の相性' },
  // ─── Cosmic novel labels ───
  page:           { en: 'Page', hi: 'पृष्ठ', es: 'Página', pt: 'Página', zh: '页', ja: 'ページ' },
  of:             { en: 'of', hi: 'का', es: 'de', pt: 'de', zh: '/', ja: '/' },
  chapter:        { en: 'Chapter', hi: 'अध्याय', es: 'Capítulo', pt: 'Capítulo', zh: '章', ja: '章' },
  through:        { en: 'through', hi: 'पूरा', es: 'completado', pt: 'completo', zh: '完成', ja: '完了' },
  yearsLeft:      { en: 'years left', hi: 'साल शेष', es: 'años restantes', pt: 'anos restantes', zh: '年剩余', ja: '年残り' },
  now:            { en: 'NOW', hi: 'अभी', es: 'AHORA', pt: 'AGORA', zh: '现在', ja: '今' },
  peak:           { en: 'Peak', hi: 'शिखर', es: 'Pico', pt: 'Pico', zh: '峰值', ja: 'ピーク' },
};

// ─── Feature titles in all 6 languages ───
const FEATURE_TITLES = {
  'daily-vibe':       { en: 'Your Vibe',       hi: 'आपकी ऊर्जा',     es: 'Tu Vibra',         pt: 'Sua Vibe',         zh: '你的能量',     ja: 'あなたの波動' },
  'power-hours':      { en: 'Power Hours',     hi: 'शक्ति घंटे',      es: 'Horas de Poder',   pt: 'Horas de Poder',   zh: '力量时刻',     ja: 'パワーアワー' },
  'planet-strength':  { en: 'Planet Power',    hi: 'ग्रह शक्ति',       es: 'Poder Planetario', pt: 'Poder Planetário', zh: '行星力量',     ja: '惑星の力' },
  'festivals':        { en: 'Festivals',       hi: 'त्योहार',          es: 'Festivales',       pt: 'Festivais',        zh: '节日',         ja: '祭り' },
  'soul-profile':     { en: 'Soul Profile',    hi: 'आत्मा प्रोफ़ाइल',  es: 'Perfil del Alma',  pt: 'Perfil da Alma',   zh: '灵魂档案',     ja: '魂のプロフィール' },
  'rare-traits':      { en: 'Rare Traits',     hi: 'दुर्लभ गुण',       es: 'Rasgos Raros',     pt: 'Traços Raros',     zh: '稀有特质',     ja: '稀少な特性' },
  'cosmic-novel':     { en: 'Your Life Story', hi: 'जीवन कहानी',      es: 'Tu Historia',      pt: 'Sua História',     zh: '你的人生故事',  ja: 'あなたの物語' },
  'personal-deities': { en: 'Your Deities',    hi: 'आपके देवता',      es: 'Tus Deidades',     pt: 'Suas Divindades',  zh: '你的神明',     ja: 'あなたの神' },
  'danger-radar':     { en: 'Danger Radar',    hi: 'खतरा रडार',       es: 'Radar de Peligro', pt: 'Radar de Perigo',  zh: '危险雷达',     ja: '危険レーダー' },
  'year-map':         { en: 'Year Map',        hi: 'वर्ष नक्शा',       es: 'Mapa del Año',     pt: 'Mapa do Ano',      zh: '年度地图',     ja: '年間マップ' },
  'gemstone-profile': { en: 'Gemstones',       hi: 'रत्न',             es: 'Gemas',            pt: 'Pedras Preciosas', zh: '宝石',         ja: '宝石' },
  'money-calendar':   { en: 'Money Calendar',  hi: 'धन कैलेंडर',      es: 'Calendario Dinero',pt: 'Calendário Dinheiro',zh: '财富日历',    ja: 'マネーカレンダー' },
  'ideal-partner':    { en: 'Ideal Partner',   hi: 'आदर्श साथी',      es: 'Pareja Ideal',     pt: 'Parceiro Ideal',   zh: '理想伴侣',     ja: '理想のパートナー' },
  'active-yogas':     { en: 'Active Yogas',    hi: 'सक्रिय योग',       es: 'Yogas Activos',    pt: 'Yogas Ativos',     zh: '活跃瑜伽',     ja: '活性ヨーガ' },
  'health-map':       { en: 'Health Map',      hi: 'स्वास्थ्य नक्शा',   es: 'Mapa de Salud',    pt: 'Mapa de Saúde',    zh: '健康地图',     ja: '健康マップ' },
  'career-path':      { en: 'Career Path',     hi: 'करियर मार्ग',      es: 'Camino Profesional',pt: 'Carreira',         zh: '职业道路',     ja: 'キャリアパス' },
  'eclipse-impact':   { en: 'Eclipse Impact',  hi: 'ग्रहण प्रभाव',     es: 'Impacto Eclipse',  pt: 'Impacto Eclipse',  zh: '日食影响',     ja: '食の影響' },
  'nadi-reading':     { en: 'Nadi Reading',    hi: 'नाड़ी पठन',        es: 'Lectura Nadi',     pt: 'Leitura Nadi',     zh: '纳迪解读',     ja: 'ナーディー' },
  'weekly-forecast':  { en: 'Weekly Forecast', hi: 'साप्ताहिक भविष्य', es: 'Pronóstico Semanal',pt: 'Previsão Semanal',zh: '周运势',       ja: '週間予報' },
  'numerology':       { en: 'Numerology',      hi: 'अंकशास्त्र',       es: 'Numerología',      pt: 'Numerologia',      zh: '数字命理',     ja: '数秘術' },
  'vastu':            { en: 'Vastu',           hi: 'वास्तु',           es: 'Vastu',            pt: 'Vastu',            zh: '风水',         ja: 'ヴァーストゥ' },
  'nakshatra-profile':{ en: 'Nakshatra',       hi: 'नक्षत्र',          es: 'Nakshatra',        pt: 'Nakshatra',        zh: '月宿',         ja: 'ナクシャトラ' },
  // Oracle features
  'cosmic-match':     { en: 'Cosmic Match',    hi: 'कॉस्मिक मैच',     es: 'Coincidencia Cósmica',pt: 'Combinação Cósmica',zh: '宇宙配对', ja: 'コズミックマッチ' },
  'match-oracle':     { en: 'Match Oracle',    hi: 'मैच ओरेकल',       es: 'Oráculo de Pareja',pt: 'Oráculo de Par',   zh: '配对神谕',     ja: 'マッチオラクル' },
  'what-if':          { en: 'What If?',        hi: 'क्या होगा?',       es: '¿Y si...?',        pt: 'E se...?',         zh: '如果呢？',     ja: 'もしも？' },
  'find-muhurta':     { en: 'Best Date',       hi: 'शुभ मुहूर्त',      es: 'Mejor Fecha',      pt: 'Melhor Data',      zh: '吉日',         ja: '吉日' },
  'past-event':       { en: 'Past Event',      hi: 'पिछली घटना',      es: 'Evento Pasado',    pt: 'Evento Passado',   zh: '过去事件',     ja: '過去の出来事' },
  'family-karma':     { en: 'Family Karma',    hi: 'परिवार कर्म',      es: 'Karma Familiar',   pt: 'Karma Familiar',   zh: '家族业力',     ja: '家族カルマ' },
};

// ─── Feature category titles ───
const CATEGORIES = {
  todayGuide:    { en: "Today's Guide",      hi: 'आज का मार्गदर्शन',    es: 'Guía de Hoy',       pt: 'Guia de Hoje',      zh: '今日指南',     ja: '今日のガイド' },
  loveRelations: { en: 'Love & Relationships',hi: 'प्रेम और रिश्ते',     es: 'Amor y Relaciones', pt: 'Amor e Relações',   zh: '爱情与关系',   ja: '愛と関係' },
  knowYourself:  { en: 'Know Yourself',       hi: 'खुद को जानें',       es: 'Conócete',          pt: 'Conheça-se',        zh: '认识自己',     ja: '自己を知る' },
  moneyCareer:   { en: 'Money & Career',      hi: 'धन और करियर',       es: 'Dinero y Carrera',  pt: 'Dinheiro e Carreira',zh: '财富与事业',  ja: 'お金とキャリア' },
  lifeDecisions: { en: 'Life Decisions',      hi: 'जीवन निर्णय',       es: 'Decisiones de Vida',pt: 'Decisões de Vida',  zh: '人生决策',     ja: '人生の決断' },
  deepDive:      { en: 'Deep Dive',           hi: 'गहन विश्लेषण',      es: 'Análisis Profundo', pt: 'Análise Profunda',  zh: '深入分析',     ja: '深掘り' },
};

// ─── Feature subtitles ───
const FEATURE_SUBS = {
  'daily-vibe':      { en: 'Right now',       hi: 'अभी',              es: 'Ahora mismo',      pt: 'Agora',             zh: '此刻',         ja: '今' },
  'power-hours':     { en: 'Hourly guide',    hi: 'घंटे की गाइड',     es: 'Guía por hora',    pt: 'Guia por hora',     zh: '小时指南',     ja: '時間ガイド' },
  'planet-strength': { en: 'Live dashboard',  hi: 'लाइव डैशबोर्ड',    es: 'Panel en vivo',    pt: 'Painel ao vivo',    zh: '实时面板',     ja: 'ライブ' },
  'festivals':       { en: 'Coming up',       hi: 'आने वाले',         es: 'Próximos',         pt: 'Próximos',          zh: '即将到来',     ja: '今後の' },
  'soul-profile':    { en: 'Who you are',     hi: 'आप कौन हैं',       es: 'Quién eres',       pt: 'Quem você é',       zh: '你是谁',       ja: 'あなたは誰' },
  'rare-traits':     { en: 'Unique combos',   hi: 'अद्वितीय संयोग',    es: 'Combinaciones únicas',pt: 'Combinações únicas',zh: '独特组合',   ja: '稀少な組合' },
  'cosmic-novel':    { en: 'Your book',       hi: 'आपकी किताब',       es: 'Tu libro',         pt: 'Seu livro',         zh: '你的书',       ja: 'あなたの本' },
  'personal-deities':{ en: 'Sacred guide',    hi: 'दिव्य मार्गदर्शन',  es: 'Guía sagrada',     pt: 'Guia sagrado',      zh: '神圣指南',     ja: '聖なるガイド' },
  'danger-radar':    { en: 'Warnings',        hi: 'चेतावनी',           es: 'Advertencias',     pt: 'Avisos',            zh: '警告',         ja: '警告' },
  'year-map':        { en: '2026 ahead',      hi: '2026 आगे',         es: '2026 adelante',    pt: '2026 adiante',      zh: '2026展望',     ja: '2026年' },
  'gemstone-profile':{ en: 'Your stones',     hi: 'आपके रत्न',        es: 'Tus piedras',      pt: 'Suas pedras',       zh: '你的宝石',     ja: 'あなたの石' },
  'money-calendar':  { en: 'Best days',       hi: 'सबसे अच्छे दिन',   es: 'Mejores días',     pt: 'Melhores dias',     zh: '最佳日',       ja: '最良の日' },
  'ideal-partner':   { en: 'Find them',       hi: 'उन्हें खोजें',      es: 'Encuéntralos',     pt: 'Encontre-os',       zh: '找到他们',     ja: '見つける' },
  'active-yogas':    { en: 'Live yogas',      hi: 'सक्रिय योग',        es: 'Yogas en vivo',    pt: 'Yogas ativos',      zh: '活跃瑜伽',     ja: '活性ヨーガ' },
  'health-map':      { en: 'Body & planets',  hi: 'शरीर और ग्रह',      es: 'Cuerpo y planetas',pt: 'Corpo e planetas',  zh: '身体与行星',   ja: '体と惑星' },
  'career-path':     { en: 'Your path',       hi: 'आपका मार्ग',       es: 'Tu camino',        pt: 'Seu caminho',       zh: '你的道路',     ja: 'あなたの道' },
  'eclipse-impact':  { en: 'Coming eclipses', hi: 'आने वाले ग्रहण',    es: 'Eclipses próximos',pt: 'Eclipses próximos', zh: '即将到来的日食',ja: '今後の食' },
  'nadi-reading':    { en: 'Bhrigu Nadi',     hi: 'भृगु नाड़ी',        es: 'Nadi Bhrigu',      pt: 'Nadi Bhrigu',       zh: '布里古纳迪',   ja: 'ブリグナーディー' },
  'weekly-forecast': { en: 'This week',       hi: 'इस सप्ताह',        es: 'Esta semana',      pt: 'Esta semana',       zh: '本周',         ja: '今週' },
  'numerology':      { en: 'Your numbers',    hi: 'आपके अंक',         es: 'Tus números',      pt: 'Seus números',      zh: '你的数字',     ja: 'あなたの数字' },
  'vastu':           { en: 'Space & energy',   hi: 'स्थान और ऊर्जा',    es: 'Espacio y energía',pt: 'Espaço e energia',  zh: '空间与能量',   ja: '空間とエネルギー' },
  'nakshatra-profile':{ en: 'Moon star',      hi: 'चंद्र नक्षत्र',     es: 'Estrella lunar',   pt: 'Estrela lunar',     zh: '月宿',         ja: '月の星' },
};

/**
 * Get translated UI string. Falls back to English.
 * Usage: t('askAnything', 'hi') → 'कुछ भी पूछें...'
 */
export const t = (key, lang = 'en') => {
  const entry = UI[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
};

/**
 * Get translated feature title, subtitle, or category.
 * Usage: tFeature('daily-vibe', 'title', 'hi') → 'आपकी ऊर्जा'
 */
export const tFeature = (featureId, field = 'title', lang = 'en') => {
  if (field === 'title') {
    const entry = FEATURE_TITLES[featureId];
    return entry ? (entry[lang] || entry.en || featureId) : featureId;
  }
  if (field === 'sub') {
    const entry = FEATURE_SUBS[featureId];
    return entry ? (entry[lang] || entry.en || '') : '';
  }
  return featureId;
};

/**
 * Get translated category title.
 * Usage: tCategory('todayGuide', 'ja') → '今日のガイド'
 */
export const tCategory = (catKey, lang = 'en') => {
  const entry = CATEGORIES[catKey];
  return entry ? (entry[lang] || entry.en || catKey) : catKey;
};

export { FEATURE_TITLES, FEATURE_SUBS, CATEGORIES, UI };