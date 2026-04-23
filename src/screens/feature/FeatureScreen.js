import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Platform, Share, LayoutAnimation, UIManager,
} from 'react-native';
import Svg, { Circle, Path, Line, Defs, ClipPath, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme';
import Starfield from '../../components/Starfield';
import * as API from '../../api/backend';
import { tFeature, t } from '../../i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get('window');

const FEATURES = {
  'daily-vibe':       { fetch: (k, l) => API.getDailyVibe(k, l), render: 'vibe' },
  'power-hours':      { fetch: (k, l) => API.getPowerHours(k, l), render: 'power_hours' },
  'planet-strength':  { fetch: (k, l) => API.getPlanetStrength(k, l), render: 'planet_strength' },
  'festivals':        { fetch: (k, l) => API.getFestivals(k, l), render: 'festivals' },
  'soul-profile':     { fetch: (k, l) => API.getSoulProfile(k, l), render: 'soul_profile' },
  'rare-traits':      { fetch: (k, l) => API.getRareTraits(k, l), render: 'rare_traits' },
  'cosmic-novel':     { fetch: (k, l) => API.getCosmicNovel(k, l), render: 'cosmic_novel' },
  'personal-deities': { fetch: (k, l) => API.getPersonalDeities(k, l), render: 'deities' },
  'danger-radar':     { fetch: (k, l) => API.getDangerRadar(k, l), render: 'danger_radar' },
  'year-map':         { fetch: (k, l) => API.getYearMap(k, new Date().getFullYear(), l), render: 'year_map' },
  'gemstone-profile': { fetch: (k, l) => API.getGemstoneProfile(k, l), render: 'gemstones' },
  'money-calendar':   { fetch: (k, l) => API.getMoneyCalendar(k, l), render: 'money_calendar' },
  'ideal-partner':    { fetch: (k, l) => API.getIdealPartner(k, l), render: 'ideal_partner' },
  'active-yogas':     { fetch: (k, l) => API.getActiveYogas(k, l), render: 'active_yogas' },
  'health-map':       { fetch: (k, l) => API.getHealthMap(k, l), render: 'health_map' },
  'career-path':      { fetch: (k, l) => API.getCareerPath(k, l), render: 'career_path' },
  'eclipse-impact':   { fetch: (k, l) => API.getEclipseImpact(k, l), render: 'eclipse_impact' },
  'nadi-reading':     { fetch: (k, l) => API.getNadiReading(k, l), render: 'nadi_reading' },
  'weekly-forecast':  { fetch: (k, l) => API.getWeeklyForecast(k, l), render: 'weekly_forecast' },
  'numerology':       { fetch: (k, l) => API.getNumerology(k, l), render: 'numerology' },
  'vastu':            { fetch: (k, l) => API.getVastu(k, l), render: 'vastu' },
  'nakshatra-profile':{ fetch: (k, l) => API.getNakshatraProfile(k, l), render: 'nakshatra_profile' },
};

// ─── GEOMETRIC PLANET SYMBOLS — gold fills from bottom based on strength ───
const PS = 28;
const PlanetShape = (name, size, color, fill = 'none') => {
  const sw = 0.9;
  const s2 = size / 2, s = size;
  switch (name) {
    case 'Sun': return <><Circle cx={s2} cy={s2} r={s*0.34} stroke={color} strokeWidth={sw} fill={fill}/><Circle cx={s2+0.5} cy={s2-0.3} r={s*0.06} fill={color}/></>;
    case 'Moon': return <Path d={`M${s*0.6} ${s*0.18}A${s*0.32} ${s*0.32} 0 1 0 ${s*0.6} ${s*0.82}A${s*0.22} ${s*0.22} 0 0 1 ${s*0.6} ${s*0.18}`} stroke={color} strokeWidth={sw} fill={fill}/>;
    case 'Mars': return <Path d={`M${s2} ${s*0.14}L${s*0.85} ${s*0.82}L${s*0.15} ${s*0.82}Z`} stroke={color} strokeWidth={sw} fill={fill} strokeLinejoin="round"/>;
    case 'Mercury': return <><Circle cx={s2} cy={s*0.4} r={s*0.2} stroke={color} strokeWidth={sw} fill={fill}/><Line x1={s2} y1={s*0.6} x2={s2} y2={s*0.9} stroke={color} strokeWidth={sw}/><Line x1={s*0.32} y1={s*0.78} x2={s*0.68} y2={s*0.78} stroke={color} strokeWidth={sw}/></>;
    case 'Jupiter': return <Path d={`M${s*0.2} ${s*0.35}L${s*0.8} ${s*0.35}M${s*0.55} ${s*0.18}L${s*0.55} ${s*0.82}M${s*0.35} ${s*0.62}Q${s*0.2} ${s*0.62} ${s*0.2} ${s*0.78}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/>;
    case 'Venus': return <><Circle cx={s2} cy={s*0.34} r={s*0.22} stroke={color} strokeWidth={sw} fill={fill}/><Line x1={s2} y1={s*0.56} x2={s2} y2={s*0.9} stroke={color} strokeWidth={sw}/><Line x1={s*0.32} y1={s*0.76} x2={s*0.68} y2={s*0.76} stroke={color} strokeWidth={sw}/></>;
    case 'Saturn': return <Path d={`M${s*0.35} ${s*0.14}L${s*0.35} ${s*0.82}M${s*0.2} ${s*0.32}L${s*0.65} ${s*0.32}M${s*0.65} ${s*0.32}Q${s*0.82} ${s*0.32} ${s*0.82} ${s*0.48}Q${s*0.82} ${s*0.64} ${s*0.65} ${s*0.64}L${s*0.45} ${s*0.64}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/>;
    case 'Rahu': return <><Path d={`M${s*0.16} ${s*0.65}Q${s*0.16} ${s*0.22} ${s2} ${s*0.22}Q${s*0.84} ${s*0.22} ${s*0.84} ${s*0.65}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/><Circle cx={s*0.16} cy={s*0.65} r={s*0.08} stroke={color} strokeWidth={0.6} fill={fill}/><Circle cx={s*0.84} cy={s*0.65} r={s*0.08} stroke={color} strokeWidth={0.6} fill={fill}/></>;
    case 'Ketu': return <><Path d={`M${s*0.16} ${s*0.35}Q${s*0.16} ${s*0.78} ${s2} ${s*0.78}Q${s*0.84} ${s*0.78} ${s*0.84} ${s*0.35}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/><Circle cx={s*0.16} cy={s*0.35} r={s*0.08} stroke={color} strokeWidth={0.6} fill={fill}/><Circle cx={s*0.84} cy={s*0.35} r={s*0.08} stroke={color} strokeWidth={0.6} fill={fill}/></>;
    default: return <Circle cx={s2} cy={s2} r={s*0.32} stroke={color} strokeWidth={sw} fill={fill}/>;
  }
};

const PlanetSymbol = ({ name, strength = 50, size = PS }) => {
  const pct = Math.max(0, Math.min(100, strength));
  const clipY = size - (size * pct / 100);
  const cid = `pf_${name}`;
  const white = 'rgba(255,255,255,0.45)';
  const gold = colors.gold;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs><ClipPath id={cid}><Rect x={0} y={clipY} width={size} height={size - clipY} /></ClipPath></Defs>
      <G clipPath={`url(#${cid})`}>{PlanetShape(name, size, gold, `${gold}30`)}</G>
      {PlanetShape(name, size, white)}
      {pct > 65 && PlanetShape(name, size, `${gold}50`)}
    </Svg>
  );
};

const SmallPlanetIcon = ({ name, color = 'rgba(255,255,255,0.35)', size = 16 }) => {
  const sw = 0.7;
  const V = { width: size, height: size, viewBox: '0 0 16 16' };
  switch (name) {
    case 'Sun': return <Svg {...V}><Circle cx={8} cy={8} r={5} stroke={color} strokeWidth={sw} fill="none"/><Circle cx={8} cy={8} r={0.8} fill={color}/></Svg>;
    case 'Moon': return <Svg {...V}><Path d="M10 3A5.5 5.5 0 1 0 10 13A4 4 0 0 1 10 3" stroke={color} strokeWidth={sw} fill="none"/></Svg>;
    case 'Mars': return <Svg {...V}><Path d="M8 2.5L13.5 13L2.5 13Z" stroke={color} strokeWidth={sw} fill="none" strokeLinejoin="round"/></Svg>;
    case 'Mercury': return <Svg {...V}><Circle cx={8} cy={6.5} r={3.5} stroke={color} strokeWidth={sw} fill="none"/></Svg>;
    case 'Jupiter': return <Svg {...V}><Path d="M3.5 5.5L12.5 5.5M8.5 3L8.5 13" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/></Svg>;
    case 'Venus': return <Svg {...V}><Circle cx={8} cy={5.5} r={3.8} stroke={color} strokeWidth={sw} fill="none"/><Line x1={8} y1={9.3} x2={8} y2={14} stroke={color} strokeWidth={sw}/></Svg>;
    case 'Saturn': return <Svg {...V}><Path d="M5.5 2L5.5 13M3.5 5L10 5" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/></Svg>;
    case 'Rahu': return <Svg {...V}><Path d="M3 11Q3 4 8 4Q13 4 13 11" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/></Svg>;
    case 'Ketu': return <Svg {...V}><Path d="M3 5Q3 12 8 12Q13 12 13 5" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"/></Svg>;
    default: return <Svg {...V}><Circle cx={8} cy={8} r={5} stroke={color} strokeWidth={sw} fill="none"/></Svg>;
  }
};

// ─── RENDERERS ───

const VibeRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.vibeTitle}>{data.vibe}</Text>
    <Text style={rs.vibeEnergy}>{data.energy_level}</Text>
    <View style={rs.divider} />
    <InfoRow label={t("bestFor", language)} value={data.best_for} />
    <InfoRow label={t("avoid", language)} value={data.avoid} />
    <InfoRow label={t("color", language)} value={data.color} />
    <InfoRow label={t("mantra", language)} value={data.mantra} gold />
    <View style={rs.divider} />
    <View style={rs.shiftRow}><Text style={rs.shiftLabel}>{t('shiftsIn', language)}</Text><Text style={rs.shiftValue}>{data.shifts_in}</Text></View>
    {data.next_vibe && <View style={rs.shiftRow}><Text style={rs.shiftLabel}>{t('nextVibe', language)}</Text><Text style={rs.shiftValue}>{data.next_vibe.vibe}</Text></View>}
    <View style={rs.divider} />
    <Text style={rs.dayNote}>{data.day_note}</Text>
  </View>
);

const ordinal = (n) => { const s=['th','st','nd','rd']; const v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };

const PlanetRow = ({ planet, isExpanded, onToggle, language = 'en' }) => {
  const barColor = planet.current_strength > 65 ? colors.gold : planet.current_strength < 35 ? 'rgba(255,80,60,0.6)' : 'rgba(255,255,255,0.35)';
  return (
    <View>
      <TouchableOpacity style={ps.row} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(planet.name); }}>
        <View style={planet.current_strength > 65 ? ps.symbolGlow : null}>
          <PlanetSymbol name={planet.name} strength={planet.current_strength} />
        </View>
        <View style={ps.info}>
          <View style={ps.nameRow}>
            <Text style={ps.name}>{planet.name}</Text>
            <Text style={[ps.status, barColor === colors.gold && { color: colors.gold }]}>{planet.status}</Text>
          </View>
          <View style={ps.barBg}><View style={[ps.barFill, { width: `${planet.current_strength}%`, backgroundColor: barColor }]} /></View>
        </View>
        <Text style={ps.pct}>{planet.current_strength}%</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={ps.expanded}>
          {planet.significance && <><Text style={ps.sectionHead}>{t('whatGoverns', language).replace('{p}', planet.name)}</Text><Text style={ps.body}>{planet.significance}</Text></>}
          {planet.nature && <><Text style={ps.sectionHead}>{t('itsNature', language)}</Text><Text style={ps.body}>{planet.nature}</Text></>}
          {planet.house_text && <>
            <Text style={ps.sectionHead}>{t('inYourChart', language)}</Text>
            {planet.house && <Text style={ps.houseLabel}>{planet.name} in the <Text style={ps.gold}>{ordinal(planet.house)} house</Text>{planet.house_name ? ` \u2014 ${planet.house_name}` : ''}</Text>}
            <Text style={ps.body}>{planet.house_text}</Text>
          </>}
          {planet.dignity_text && <><Text style={ps.sectionHead}>{t('currentState', language)} \u2014 <Text style={ps.gold}>{planet.dignity_label || planet.status}</Text></Text><Text style={ps.body}>{planet.dignity_text}</Text></>}
          {planet.strength_text && <><Text style={ps.sectionHead}>{planet.current_strength > 55 ? t('strengthGives', language) : t('weaknessMeans', language)}</Text><Text style={ps.body}>{planet.strength_text}</Text></>}
          {planet.day && <View style={ps.detailRow}><Text style={ps.detailLabel}>{t('day', language)}</Text><Text style={ps.detailValue}>{planet.day}</Text></View>}
          {planet.gem && <View style={ps.detailRow}><Text style={ps.detailLabel}>{t('gemstone', language)}</Text><Text style={ps.detailValue}>{planet.gem}</Text></View>}
          {planet.color && <View style={ps.detailRow}><Text style={ps.detailLabel}>{t('color', language)}</Text><Text style={ps.detailValue}>{planet.color}</Text></View>}
          {!planet.significance && planet.domain && <Text style={[ps.body, { marginTop: 4 }]}>{planet.domain}</Text>}
          {planet.modifiers?.length > 0 && <Text style={ps.modifiers}>{planet.modifiers.join('  \u00B7  ')}</Text>}
        </View>
      )}
    </View>
  );
};

const PlanetStrengthRenderer = ({ data, language = 'en' }) => {
  const [exp, setExp] = useState(null);
  const toggle = (n) => { LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'opacity')); setExp(p => p === n ? null : n); };
  return <View style={ps.container}>{data.planets?.map((p, i) => <PlanetRow key={p.name||i} planet={p} isExpanded={exp === p.name} onToggle={toggle} language={language} />)}</View>;
};

const SoulProfileRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.archetype}>{data.archetype}</Text>
    <Text style={rs.archetypeTrait}>{data.archetype_trait}</Text>
    <View style={rs.divider} />
    <InfoRow label={t("mind", language)} value={data.mind_style} /><InfoRow label={t("love", language)} value={data.love_style} /><InfoRow label={t("drive", language)} value={data.drive_style} /><InfoRow label={t("purpose", language)} value={data.purpose} />
    <View style={rs.divider} />
    <InfoRow label={t("superpower", language)} value={data.superpower} gold /><InfoRow label={t("blindSpot", language)} value={data.blind_spot} /><InfoRow label={t("lifeTheme", language)} value={data.life_theme} /><InfoRow label={t("element", language)} value={data.element} />
    <View style={rs.divider} />
    <PillarBar label="Dharma" value={data.dharma} strength={data.dharma_strength} /><PillarBar label="Karma" value={data.karma} strength={data.karma_strength} /><PillarBar label="Kama" value={data.kama} strength={data.kama_strength} /><PillarBar label="Moksha" value={data.moksha} strength={data.moksha_strength} />
  </View>
);

const RareTraitsRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>{data.count} {t('rareTraitsFound', language)}</Text><View style={rs.divider} />
    {data.traits?.map((t, i) => <View key={i} style={rs.traitCard}><View style={rs.traitHeader}><Text style={rs.traitTitle}>{t.title}</Text><View style={rs.rarityBadge}><Text style={rs.rarityText}>{t.rarity}</Text></View></View><Text style={rs.traitDesc}>{t.description}</Text></View>)}
  </View>
);

const CosmicNovelRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.bookTitle}>{data.book_title}</Text>
    <Text style={rs.pageNum}>Page {data.current_page} of {data.total_pages}</Text>
    <View style={rs.divider} />
    {data.current_chapter && <View style={rs.currentChapter}><Text style={rs.chapterCurrent}>Chapter {data.current_chapter.number}: {data.current_chapter.title}</Text><View style={rs.progressBg}><View style={[rs.progressFill, { width: `${data.current_chapter.progress_pct}%` }]} /></View><Text style={rs.progressText}>{data.current_chapter.progress_pct}% through \u00B7 {data.current_chapter.years_remaining} years left</Text></View>}
    {data.current_scene && <View style={rs.sceneBox}><Text style={rs.sceneLabel}>{t('currentScene', language)}</Text><Text style={rs.sceneTitle}>{data.current_scene.title}</Text><Text style={rs.sceneMood}>{data.current_scene.mood}</Text><Text style={rs.sceneEnds}>Ends: {data.current_scene.ends}</Text></View>}
    {data.plot_twist && <View style={[rs.sceneBox, { borderColor: 'rgba(212,175,55,0.2)' }]}><Text style={[rs.sceneLabel, { color: colors.gold }]}>{t('plotTwist', language)}</Text><Text style={rs.sceneTitle}>{data.plot_twist.description}</Text></View>}
    <View style={rs.divider} /><Text style={rs.sectionLabel}>{t('allChapters', language)}</Text>
    {data.chapters?.map((ch, i) => <View key={i} style={[rs.chapterRow, ch.is_current && rs.chapterRowActive]}><View style={{ width: 24, alignItems: 'center' }}><View style={[rs.chapterDot, ch.is_current && { backgroundColor: colors.gold }]} /></View><View style={{ flex: 1 }}><Text style={[rs.chapterTitle, ch.is_current && { color: colors.white }]}>Ch.{ch.number}: {ch.title}</Text><Text style={rs.chapterAge}>Ages {ch.start_age}\u2013{ch.end_age} \u00B7 {ch.genre}</Text></View>{ch.is_current && <Text style={rs.currentBadge}>{t('now', language)}</Text>}</View>)}
  </View>
);

const FestivalsRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.upcoming?.map((f, i) => <View key={i} style={rs.festCard}><View style={rs.festHeader}><Text style={rs.festName}>{f.name}</Text><Text style={rs.festDays}>{f.days_away}d</Text></View><Text style={rs.festDate}>{f.date} \u00B7 {f.deity}</Text><Text style={rs.festAstro}>{f.astro_note}</Text>{f.personal_impact && <View style={rs.festImpact}><Text style={rs.festImpactLevel}>{f.personal_impact.impact_level}</Text><Text style={rs.festImpactNote}>{f.personal_impact.note}</Text>{f.personal_impact.personal_ritual ? <Text style={rs.festRitual}>{f.personal_impact.personal_ritual}</Text> : null}</View>}</View>)}
  </View>
);

const DeitiesRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.recommendations?.map((r, i) => <View key={i} style={rs.deityCard}><Text style={rs.deityPriority}>{r.priority}</Text><Text style={rs.deityName}>{r.deity}</Text><Text style={rs.deityMantra}>{r.mantra}</Text><Text style={rs.deityDay}>{r.day}</Text><Text style={rs.deityReason}>{r.reason}</Text></View>)}
  </View>
);

const DangerRadarRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={[rs.sectionLabel, data.critical_count > 0 ? { color: colors.error } : { color: colors.success }]}>{data.safety_level}</Text><View style={rs.divider} />
    {data.alerts?.length === 0 && <Text style={rs.emptyText}>{t('noAlerts', language)}</Text>}
    {data.alerts?.map((a, i) => <View key={i} style={[rs.alertCard, a.severity === 'CRITICAL' && { borderColor: 'rgba(255,59,48,0.3)' }]}><View style={rs.alertHeader}><View style={[rs.alertDot, a.severity === 'CRITICAL' ? { backgroundColor: colors.error } : { backgroundColor: colors.gold }]} /><Text style={rs.alertType}>{a.type}</Text><Text style={rs.alertDays}>{a.days_until}d</Text></View><Text style={rs.alertDesc}>{a.description}</Text><Text style={rs.alertAdvice}>{a.advice}</Text></View>)}
  </View>
);

const YearMapRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.yearTheme}>{data.year_theme}</Text><Text style={rs.yearPeak}>{t("peak", language)}: {data.peak_period}</Text><View style={rs.divider} />
    {data.months?.map((m, i) => <View key={i} style={rs.monthRow}><Text style={rs.monthName}>{m.short}</Text><View style={rs.monthBarBg}><View style={[rs.monthBarFill, { width: `${m.score}%`, backgroundColor: m.score >= 65 ? colors.gold : m.score >= 50 ? 'rgba(255,255,255,0.3)' : 'rgba(255,80,60,0.5)' }]} /></View><Text style={rs.monthScore}>{m.score}</Text></View>)}
    <View style={rs.divider} /><InfoRow label={t("bestMonth", language)} value={data.best_month?.name} gold /><InfoRow label={t("challenge", language)} value={data.challenge_month?.name} />
  </View>
);

const GemstonesRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.current_phase && <View style={[rs.gemCard, { borderColor: (data.current_phase.color || colors.gold) + '30' }]}><Text style={rs.gemStatus}>{data.current_phase.status}</Text><Text style={rs.gemName}>{data.current_phase.gemstone} ({data.current_phase.gemstone_hindi})</Text><Text style={rs.gemPlanet}>Planet: {data.current_phase.planet} \u00B7 Until {data.current_phase.phase_ends}</Text><InfoRow label={t("metal", language)} value={data.current_phase.metal} /><InfoRow label={t("finger", language)} value={data.current_phase.finger} /><InfoRow label={t("day", language)} value={data.current_phase.day} /><InfoRow label={t("price", language)} value={data.current_phase.price_range} /><Text style={rs.gemMantra}>{data.current_phase.mantra}</Text></View>}
    <Text style={rs.sectionLabel}>{t('upcomingPhases', language)}</Text>
    {data.upcoming_phases?.map((u, i) => <View key={i} style={rs.gemUpcoming}><Text style={rs.gemUpName}>{u.gemstone}</Text><Text style={rs.gemUpDate}>{u.phase_starts} \u2014 {u.phase_ends}</Text><Text style={rs.gemUpStatus}>{u.status}</Text></View>)}
    {data.weakness_remedies?.length > 0 && <><View style={rs.divider} /><Text style={rs.sectionLabel}>{t('weakRemedies', language)}</Text>{data.weakness_remedies.map((w, i) => <View key={i} style={rs.gemWeak}><Text style={rs.gemWeakName}>{w.gemstone} for {w.planet}</Text><Text style={rs.gemWeakIssue}>{w.issues?.join(', ')} \u2014 {w.severity}</Text></View>)}</>}
    {data.conflicts?.length > 0 && <><View style={rs.divider} />{data.conflicts.map((c, i) => <Text key={i} style={rs.gemConflict}>{c.warning}</Text>)}</>}
  </View>
);

const MoneyCalendarRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>{data.verdict}</Text><View style={rs.divider} />
    <Text style={rs.sectionLabel}>{t('bestDays', language)}</Text>
    {data.best_invest_days?.map((d, i) => <View key={i} style={rs.moneyDay}><Text style={rs.moneyDayDate}>{d.date}</Text><Text style={rs.moneyDayName}>{d.day}</Text><Text style={rs.moneyDayScore}>{d.score}/10</Text></View>)}
    <View style={rs.divider} /><Text style={rs.sectionLabel}>{t('avoidDays', language)}</Text>
    {data.danger_days?.map((d, i) => <View key={i} style={rs.moneyDay}><Text style={rs.moneyDayDate}>{d.date}</Text><Text style={rs.moneyDayName}>{d.day}</Text><View style={rs.dangerMark} /></View>)}
  </View>
);

const PowerHoursRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>DAY: {data.day} \u00B7 LORD: {data.day_lord}</Text>
    {data.current_hora && <View style={[rs.sceneBox, { borderColor: 'rgba(212,175,55,0.3)' }]}><Text style={rs.sceneLabel}>{t('rightNow', language)}</Text><View style={{ alignItems: 'center', marginVertical: 8 }}><SmallPlanetIcon name={data.current_hora.planet || data.current_hora.energy} color={colors.gold} size={24} /></View><Text style={rs.vibeTitle}>{data.current_hora.energy}</Text><Text style={rs.festAstro}>{data.current_hora.best_for}</Text></View>}
    <View style={rs.divider} />
    {data.all_hours?.filter(h => h.period === 'day').map((h, i) => <View key={i} style={[rs.horaRow, h.is_current && rs.horaRowActive]}><Text style={rs.horaTime}>{h.start}</Text><View style={{ width: 20, alignItems: 'center' }}><SmallPlanetIcon name={h.planet} color={h.is_current ? colors.gold : 'rgba(255,255,255,0.3)'} /></View><Text style={[rs.horaName, h.is_current && { color: colors.gold }]}>{h.planet}</Text><View style={rs.horaDots}>{Array.from({ length: h.power_level }, (_, j) => <View key={j} style={[rs.horaDot, h.power_level >= 8 && { backgroundColor: colors.gold }]} />)}</View></View>)}
  </View>
);

const IdealPartnerRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.partner_archetype && <Text style={rs.archetype}>{data.partner_archetype}</Text>}
    {data.partner_trait && <Text style={rs.archetypeTrait}>{data.partner_trait}</Text>}
    <View style={rs.divider} />
    <InfoRow label={t("venusSign", language)} value={data.venus_sign} /><InfoRow label={t("seventhHouse", language)} value={data.seventh_house} /><InfoRow label={t("navamsa", language)} value={data.navamsa_venus} />
    <View style={rs.divider} />
    <InfoRow label={t("lookFor", language)} value={data.qualities_to_seek} gold /><InfoRow label={t("avoid", language)} value={data.qualities_to_avoid} /><InfoRow label={t("bestMatch", language)} value={data.compatible_signs} /><InfoRow label={t("timing", language)} value={data.marriage_timing} />
  </View>
);

// ─── ACTIVE YOGAS ───
const YogaCard = ({ yoga, isExpanded, onToggle }) => {
  const strength = yoga.strength || yoga.score || 0;
  const barColor = strength >= 70 ? colors.gold : strength >= 40 ? 'rgba(255,255,255,0.35)' : 'rgba(255,80,60,0.5)';
  return (
    <View>
      <TouchableOpacity style={ns.yogaCard} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(yoga.name); }}>
        <View style={ns.yogaHeader}>
          <View style={{ flex: 1 }}>
            <Text style={ns.yogaName}>{yoga.name}</Text>
            {yoga.sanskrit && <Text style={ns.yogaSanskrit}>{yoga.sanskrit}</Text>}
          </View>
          <View style={[ns.yogaTypeBadge, strength >= 70 && { borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(212,175,55,0.06)' }]}>
            <Text style={[ns.yogaTypeText, strength >= 70 && { color: colors.gold }]}>{yoga.type || 'YOGA'}</Text>
          </View>
        </View>
        <View style={ns.yogaBarBg}><View style={[ns.yogaBarFill, { width: `${strength}%`, backgroundColor: barColor }]} /></View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={ns.yogaExpanded}>
          {yoga.planets && <Text style={ns.yogaDetail}><Text style={ns.yogaDetailLabel}>Planets: </Text>{Array.isArray(yoga.planets) ? yoga.planets.join(', ') : yoga.planets}</Text>}
          {yoga.houses && <Text style={ns.yogaDetail}><Text style={ns.yogaDetailLabel}>Houses: </Text>{Array.isArray(yoga.houses) ? yoga.houses.join(', ') : yoga.houses}</Text>}
          {yoga.effect && <Text style={ns.yogaBody}>{yoga.effect}</Text>}
          {yoga.activation && <Text style={ns.yogaActivation}>{yoga.activation}</Text>}
          {yoga.remedy && <Text style={ns.yogaRemedy}>{yoga.remedy}</Text>}
        </View>
      )}
    </View>
  );
};

const ActiveYogasRenderer = ({ data, language = 'en' }) => {
  const [exp, setExp] = useState(null);
  const toggle = (n) => { LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'opacity')); setExp(p => p === n ? null : n); };
  return (
    <View style={rs.section}>
      <Text style={rs.sectionLabel}>{data.count || data.yogas?.length || 0} {data.label || 'YOGAS ACTIVE'}</Text>
      {data.summary && <Text style={ns.yogaSummary}>{data.summary}</Text>}
      <View style={rs.divider} />
      {data.yogas?.map((y, i) => <YogaCard key={y.name || i} yoga={y} isExpanded={exp === y.name} onToggle={toggle} />)}
    </View>
  );
};

// ─── HEALTH MAP ───
const HealthMapRenderer = ({ data, language = 'en' }) => {
  const [exp, setExp] = useState(null);
  const toggle = (n) => { LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'opacity')); setExp(p => p === n ? null : n); };
  return (
    <View style={rs.section}>
      {data.constitution && <Text style={rs.archetype}>{data.constitution}</Text>}
      {data.dosha && <Text style={rs.archetypeTrait}>{data.dosha}</Text>}
      <View style={rs.divider} />
      {data.vitality_score != null && (
        <View style={ns.vitalRow}>
          <Text style={ns.vitalLabel}>VITALITY</Text>
          <View style={ns.vitalBarBg}><View style={[ns.vitalBarFill, { width: `${data.vitality_score}%`, backgroundColor: data.vitality_score >= 65 ? colors.gold : data.vitality_score >= 40 ? 'rgba(255,255,255,0.35)' : 'rgba(255,80,60,0.5)' }]} /></View>
          <Text style={ns.vitalPct}>{data.vitality_score}%</Text>
        </View>
      )}
      {data.zones?.map((z, i) => (
        <View key={z.body_part || i}>
          <TouchableOpacity style={ns.healthZone} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(z.body_part); }}>
            <View style={{ flex: 1 }}>
              <Text style={ns.healthZoneName}>{z.body_part}</Text>
              <Text style={ns.healthZonePlanet}>{z.planet} · {z.sign || ''}</Text>
            </View>
            <View style={[ns.healthDot, z.status === 'strong' ? { backgroundColor: colors.success + '80' } : z.status === 'vulnerable' ? { backgroundColor: 'rgba(255,80,60,0.6)' } : { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          </TouchableOpacity>
          {exp === z.body_part && (
            <View style={ns.healthExpanded}>
              {z.condition && <Text style={ns.yogaBody}>{z.condition}</Text>}
              {z.remedy && <Text style={ns.yogaRemedy}>{z.remedy}</Text>}
              {z.food && <Text style={ns.yogaDetail}><Text style={ns.yogaDetailLabel}>Foods: </Text>{z.food}</Text>}
            </View>
          )}
        </View>
      ))}
      {data.caution && <><View style={rs.divider} /><Text style={ns.healthCaution}>{data.caution}</Text></>}
    </View>
  );
};

// ─── CAREER PATH ───
const CareerPathRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.career_archetype && <Text style={rs.archetype}>{data.career_archetype}</Text>}
    {data.career_trait && <Text style={rs.archetypeTrait}>{data.career_trait}</Text>}
    <View style={rs.divider} />
    <InfoRow label="10th Lord" value={data.tenth_lord} />
    <InfoRow label="Strength" value={data.career_strength} />
    <InfoRow label="Ideal" value={data.ideal_fields} gold />
    <InfoRow label="Avoid" value={data.fields_to_avoid} />
    <View style={rs.divider} />
    {data.phases?.map((p, i) => (
      <View key={i} style={[rs.alertCard, p.is_current && { borderColor: 'rgba(212,175,55,0.25)' }]}>
        <View style={rs.alertHeader}>
          <View style={[rs.alertDot, p.is_current ? { backgroundColor: colors.gold } : { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <Text style={rs.alertType}>{p.period}</Text>
          {p.is_current && <Text style={rs.alertDays}>NOW</Text>}
        </View>
        <Text style={rs.alertDesc}>{p.prediction}</Text>
        {p.advice && <Text style={rs.alertAdvice}>{p.advice}</Text>}
      </View>
    ))}
    {data.wealth_yoga && <><View style={rs.divider} /><InfoRow label="Wealth" value={data.wealth_yoga} gold /></>}
    {data.timing && <InfoRow label="Timing" value={data.timing} />}
  </View>
);

// ─── ECLIPSE IMPACT ───
const EclipseImpactRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    <Text style={rs.sectionLabel}>{data.summary || 'UPCOMING ECLIPSES'}</Text>
    <View style={rs.divider} />
    {data.eclipses?.map((e, i) => (
      <View key={i} style={[ns.eclipseCard, e.severity === 'high' && { borderColor: 'rgba(255,80,60,0.25)' }]}>
        <View style={ns.eclipseHeader}>
          <View style={{ flex: 1 }}>
            <Text style={ns.eclipseType}>{e.type}</Text>
            <Text style={ns.eclipseDate}>{e.date} · {e.sign}</Text>
          </View>
          <View style={[ns.eclipseSeverity, e.severity === 'high' ? { backgroundColor: 'rgba(255,80,60,0.1)', borderColor: 'rgba(255,80,60,0.25)' } : e.severity === 'medium' ? { backgroundColor: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.2)' } : {}]}>
            <Text style={[ns.eclipseSeverityText, e.severity === 'high' ? { color: colors.error } : e.severity === 'medium' ? { color: colors.gold } : {}]}>{e.severity?.toUpperCase() || 'LOW'}</Text>
          </View>
        </View>
        {e.house && <Text style={ns.eclipseHouse}>House {e.house}{e.house_name ? ` — ${e.house_name}` : ''}</Text>}
        {e.impact && <Text style={rs.alertDesc}>{e.impact}</Text>}
        {e.advice && <Text style={rs.alertAdvice}>{e.advice}</Text>}
        {e.duration && <Text style={ns.eclipseDuration}>Duration: {e.duration}</Text>}
      </View>
    ))}
    {data.general_advice && <><View style={rs.divider} /><Text style={rs.dayNote}>{data.general_advice}</Text></>}
  </View>
);

// ─── NADI READING ───
const NadiReadingRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.nadi_type && <Text style={rs.archetype}>{data.nadi_type}</Text>}
    {data.nadi_sub && <Text style={rs.archetypeTrait}>{data.nadi_sub}</Text>}
    <View style={rs.divider} />
    {data.past_life && <View style={rs.sceneBox}><Text style={rs.sceneLabel}>PAST LIFE</Text><Text style={rs.sceneTitle}>{data.past_life.theme || data.past_life}</Text>{data.past_life.detail && <Text style={rs.sceneMood}>{data.past_life.detail}</Text>}</View>}
    {data.present && <View style={[rs.sceneBox, { borderColor: 'rgba(212,175,55,0.2)' }]}><Text style={[rs.sceneLabel, { color: colors.gold }]}>PRESENT</Text><Text style={rs.sceneTitle}>{data.present.theme || data.present}</Text>{data.present.detail && <Text style={rs.sceneMood}>{data.present.detail}</Text>}</View>}
    {data.future && <View style={rs.sceneBox}><Text style={rs.sceneLabel}>FUTURE</Text><Text style={rs.sceneTitle}>{data.future.theme || data.future}</Text>{data.future.detail && <Text style={rs.sceneMood}>{data.future.detail}</Text>}</View>}
    <View style={rs.divider} />
    {data.karmic_debt && <InfoRow label="Karma" value={data.karmic_debt} />}
    {data.soul_lesson && <InfoRow label="Lesson" value={data.soul_lesson} gold />}
    {data.remedy && <InfoRow label="Remedy" value={data.remedy} />}
    {data.prediction && <><View style={rs.divider} /><Text style={rs.dayNote}>{data.prediction}</Text></>}
  </View>
);

// ─── WEEKLY FORECAST ───
const WeeklyForecastRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.week_theme && <Text style={rs.yearTheme}>{data.week_theme}</Text>}
    {data.overview && <Text style={[rs.archetypeTrait, { marginTop: 6, marginBottom: 4 }]}>{data.overview}</Text>}
    <View style={rs.divider} />
    {data.days?.map((d, i) => {
      const sc = d.score || d.energy || 50;
      const barCol = sc >= 70 ? colors.gold : sc >= 45 ? 'rgba(255,255,255,0.3)' : 'rgba(255,80,60,0.5)';
      return (
        <View key={d.day || i} style={ns.weekDay}>
          <View style={ns.weekDayHeader}>
            <Text style={[ns.weekDayName, d.is_today && { color: colors.gold }]}>{d.day}</Text>
            <View style={ns.weekDayBarBg}><View style={[ns.weekDayBarFill, { width: `${sc}%`, backgroundColor: barCol }]} /></View>
            <Text style={ns.weekDayScore}>{sc}</Text>
          </View>
          {d.vibe && <Text style={ns.weekDayVibe}>{d.vibe}</Text>}
          {d.tip && <Text style={ns.weekDayTip}>{d.tip}</Text>}
        </View>
      );
    })}
    {data.best_day && <><View style={rs.divider} /><InfoRow label="Best day" value={data.best_day} gold /></>}
    {data.caution_day && <InfoRow label="Caution" value={data.caution_day} />}
  </View>
);

// ─── NUMEROLOGY ───
const NumCard = ({ label, number, meaning }) => (
  <View style={ns.numCard}>
    <Text style={ns.numNumber}>{number}</Text>
    <Text style={ns.numLabel}>{label}</Text>
    {meaning && <Text style={ns.numMeaning}>{meaning}</Text>}
  </View>
);

const NumerologyRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.destiny_name && <Text style={rs.archetype}>{data.destiny_name}</Text>}
    {data.tagline && <Text style={rs.archetypeTrait}>{data.tagline}</Text>}
    <View style={rs.divider} />
    <View style={ns.numGrid}>
      {data.life_path != null && <NumCard label="Life Path" number={data.life_path} meaning={data.life_path_meaning} />}
      {data.destiny != null && <NumCard label="Destiny" number={data.destiny} meaning={data.destiny_meaning} />}
      {data.soul_urge != null && <NumCard label="Soul Urge" number={data.soul_urge} meaning={data.soul_urge_meaning} />}
      {data.personality != null && <NumCard label="Personality" number={data.personality} meaning={data.personality_meaning} />}
    </View>
    {data.birth_number != null && <><View style={rs.divider} /><InfoRow label="Birth #" value={`${data.birth_number}${data.birth_meaning ? ' — ' + data.birth_meaning : ''}`} gold /></>}
    {data.name_number != null && <InfoRow label="Name #" value={`${data.name_number}${data.name_meaning ? ' — ' + data.name_meaning : ''}`} />}
    {data.lucky_numbers && <InfoRow label="Lucky" value={Array.isArray(data.lucky_numbers) ? data.lucky_numbers.join(', ') : data.lucky_numbers} gold />}
    {data.lucky_colors && <InfoRow label="Colors" value={Array.isArray(data.lucky_colors) ? data.lucky_colors.join(', ') : data.lucky_colors} />}
    {data.personal_year != null && <><View style={rs.divider} /><InfoRow label="Year #" value={`${data.personal_year}${data.year_theme ? ' — ' + data.year_theme : ''}`} gold /></>}
    {data.year_advice && <Text style={rs.dayNote}>{data.year_advice}</Text>}
  </View>
);

// ─── VASTU ───
const VastuRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.element && <Text style={rs.archetype}>{data.element}</Text>}
    {data.element_trait && <Text style={rs.archetypeTrait}>{data.element_trait}</Text>}
    <View style={rs.divider} />
    {data.best_direction && <InfoRow label="Best Dir" value={data.best_direction} gold />}
    {data.avoid_direction && <InfoRow label="Avoid" value={data.avoid_direction} />}
    {data.sleep_direction && <InfoRow label="Sleep" value={data.sleep_direction} />}
    {data.work_direction && <InfoRow label="Work" value={data.work_direction} />}
    {data.zones?.length > 0 && <><View style={rs.divider} /><Text style={rs.sectionLabel}>DIRECTIONAL ZONES</Text>
      {data.zones.map((z, i) => (
        <View key={z.direction || i} style={ns.vastuZone}>
          <View style={ns.vastuZoneHeader}>
            <Text style={ns.vastuDir}>{z.direction}</Text>
            <View style={[ns.vastuStatusDot, z.status === 'favorable' ? { backgroundColor: colors.success + '80' } : z.status === 'unfavorable' ? { backgroundColor: 'rgba(255,80,60,0.6)' } : { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          </View>
          {z.planet && <Text style={ns.vastuPlanet}>{z.planet}</Text>}
          {z.advice && <Text style={ns.vastuAdvice}>{z.advice}</Text>}
        </View>
      ))}</>}
    {data.remedies?.length > 0 && <><View style={rs.divider} /><Text style={rs.sectionLabel}>REMEDIES</Text>
      {data.remedies.map((r, i) => <Text key={i} style={ns.vastuRemedy}>{r}</Text>)}</>}
    {data.tip && <><View style={rs.divider} /><Text style={rs.dayNote}>{data.tip}</Text></>}
  </View>
);

// ─── NAKSHATRA PROFILE ───
const NakshatraProfileRenderer = ({ data, language = 'en' }) => (
  <View style={rs.section}>
    {data.nakshatra && <Text style={rs.archetype}>{data.nakshatra}</Text>}
    {data.pada && <Text style={[rs.archetypeTrait, { marginBottom: 2 }]}>Pada {data.pada}</Text>}
    {data.deity && <Text style={rs.archetypeTrait}>{data.deity}</Text>}
    <View style={rs.divider} />
    {data.symbol && <InfoRow label="Symbol" value={data.symbol} />}
    {data.ruling_planet && <InfoRow label="Ruler" value={data.ruling_planet} gold />}
    {data.gana && <InfoRow label="Gana" value={data.gana} />}
    {data.animal && <InfoRow label="Animal" value={data.animal} />}
    {data.element && <InfoRow label="Element" value={data.element} />}
    {data.dosha && <InfoRow label="Dosha" value={data.dosha} />}
    <View style={rs.divider} />
    {data.nature && <View style={rs.traitCard}><Text style={rs.traitTitle}>Nature</Text><Text style={rs.traitDesc}>{data.nature}</Text></View>}
    {data.strengths && <View style={rs.traitCard}><Text style={rs.traitTitle}>Strengths</Text><Text style={rs.traitDesc}>{data.strengths}</Text></View>}
    {data.challenges && <View style={rs.traitCard}><Text style={rs.traitTitle}>Challenges</Text><Text style={rs.traitDesc}>{data.challenges}</Text></View>}
    {data.compatibility && <><View style={rs.divider} /><InfoRow label="Compatible" value={data.compatibility} gold /></>}
    {data.mantra && <Text style={rs.gemMantra}>{data.mantra}</Text>}
  </View>
);

// ─── SHARED COMPONENTS ───
const InfoRow = ({ label, value, gold }) => (
  <View style={rs.infoRow}><Text style={rs.infoLabel}>{label}</Text><Text style={[rs.infoValue, gold && { color: colors.gold }]} numberOfLines={3}>{value}</Text></View>
);
const PillarBar = ({ label, value, strength }) => (
  <View style={rs.pillarRow}><Text style={rs.pillarLabel}>{label}</Text><View style={rs.pillarBarBg}><View style={[rs.pillarBarFill, { width: `${(strength||0)*100}%` }]} /></View><Text style={rs.pillarValue}>{value}</Text></View>
);

const RENDERERS = {
  vibe: VibeRenderer, planet_strength: PlanetStrengthRenderer, soul_profile: SoulProfileRenderer,
  rare_traits: RareTraitsRenderer, cosmic_novel: CosmicNovelRenderer, festivals: FestivalsRenderer,
  deities: DeitiesRenderer, danger_radar: DangerRadarRenderer, year_map: YearMapRenderer,
  gemstones: GemstonesRenderer, money_calendar: MoneyCalendarRenderer, power_hours: PowerHoursRenderer,
  ideal_partner: IdealPartnerRenderer, active_yogas: ActiveYogasRenderer, health_map: HealthMapRenderer,
  career_path: CareerPathRenderer, eclipse_impact: EclipseImpactRenderer, nadi_reading: NadiReadingRenderer,
  weekly_forecast: WeeklyForecastRenderer, numerology: NumerologyRenderer, vastu: VastuRenderer,
  nakshatra_profile: NakshatraProfileRenderer,
};

// ─── MAIN SCREEN ───
export default function FeatureScreen({ featureId, kundliData, language, onBack, embedded = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const config = FEATURES[featureId];
  const title = tFeature(featureId, 'title', language);

  useEffect(() => {
    if (!config?.fetch) { setLoading(false); setError(t('comingSoon', language)); return; }
    loadData();
  }, [featureId]);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const result = await config.fetch(kundliData, language);
      if (result?.success && result?.data) setData(result.data);
      else setError(result?.error || t('starsUnclear', language));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleShare = useCallback(async () => {
    try { await Share.share({ message: data?.share_text || `Check out my ${title} on Plutto` }); } catch (e) {}
  }, [data, title]);

  const Renderer = RENDERERS[config?.render];
  return (
    <View style={[st.container, embedded && { backgroundColor: 'transparent' }]}>
      {!embedded && <Starfield />}
      <View style={[st.header, embedded && st.headerEmbedded]}>
        {!embedded && <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBack(); }} style={st.backBtn}><Text style={st.backText}>{'\u2039'}</Text></TouchableOpacity>}
        <Text style={[st.title, embedded && st.titleEmbedded]}>{title || 'Feature'}</Text>
        {data?.share_text && !embedded && <TouchableOpacity onPress={handleShare} style={st.shareBtn}><Text style={st.shareText}>{t('share', language)}</Text></TouchableOpacity>}
      </View>
      {loading ? <View style={st.loadingWrap}><ActivityIndicator color={colors.gold} size="small" /><Text style={st.loadingText}>{t('readingStars', language)}</Text></View>
       : error ? <View style={st.errorWrap}><Text style={st.errorText}>{error}</Text><TouchableOpacity onPress={loadData} style={st.retryBtn}><Text style={st.retryText}>{t('tryAgain', language)}</Text></TouchableOpacity></View>
       : <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>{Renderer && data ? <Renderer data={data} language={language} /> : <Text style={st.fallback}>{t('featureComingSoon', language)}</Text>}</ScrollView>}
    </View>
  );
}

// ─── STYLES ───
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 20, paddingBottom: 16 },
  headerEmbedded: { paddingTop: 22, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 28, fontWeight: '200', color: 'rgba(255,255,255,0.7)' },
  title: { flex: 1, fontSize: 20, fontWeight: '200', color: colors.white, letterSpacing: 0.5, textAlign: 'center' },
  titleEmbedded: { color: colors.gold, fontStyle: 'italic', fontSize: 17, letterSpacing: 1.2, fontWeight: '300' },
  shareBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.3)' },
  shareText: { fontSize: 12, fontWeight: '400', color: colors.gold, letterSpacing: 0.5 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 40 },
  errorText: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' },
  retryText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  fallback: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
});

const ps = StyleSheet.create({
  container: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  symbolGlow: { shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },
  status: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' },
  barBg: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  barFill: { height: 2, borderRadius: 1 },
  pct: { fontSize: 13, fontWeight: '200', color: 'rgba(255,255,255,0.75)', width: 36, textAlign: 'right' },
  expanded: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sectionHead: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  body: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.75)', lineHeight: 20, letterSpacing: 0.2 },
  houseLabel: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: 0.2 },
  gold: { color: colors.gold },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.03)' },
  detailLabel: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.2)', letterSpacing: 0.8, textTransform: 'uppercase' },
  detailValue: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  modifiers: { fontSize: 11, fontWeight: '400', color: colors.gold, marginTop: 12, letterSpacing: 0.5, textAlign: 'center' },
});

const rs = StyleSheet.create({
  section: { marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  vibeTitle: { fontSize: 24, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 1 },
  vibeEnergy: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4, letterSpacing: 0.5 },
  shiftRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  shiftLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  shiftValue: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  dayNote: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic' },
  infoRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoLabel: { width: 90, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
  archetype: { fontSize: 28, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 2 },
  archetypeTrait: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 6, letterSpacing: 0.3 },
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pillarLabel: { width: 60, fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillarBarBg: { width: 60, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 8 },
  pillarBarFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  pillarValue: { flex: 1, fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  traitCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  traitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  traitTitle: { fontSize: 16, fontWeight: '400', color: colors.white, flex: 1 },
  rarityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)' },
  rarityText: { fontSize: 10, fontWeight: '500', color: colors.gold, letterSpacing: 0.3 },
  traitDesc: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  bookTitle: { fontSize: 22, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 1 },
  pageNum: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4 },
  currentChapter: { marginBottom: 16 },
  chapterCurrent: { fontSize: 15, fontWeight: '300', color: colors.gold, marginBottom: 8 },
  progressBg: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  sceneBox: { padding: 16, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', marginVertical: 8 },
  sceneLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  sceneTitle: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  sceneMood: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.35)', marginTop: 4, fontStyle: 'italic' },
  sceneEnds: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  chapterRowActive: { backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  chapterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  chapterTitle: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  chapterAge: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 },
  currentBadge: { fontSize: 9, fontWeight: '600', color: colors.gold, letterSpacing: 1 },
  festCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  festHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  festName: { fontSize: 16, fontWeight: '400', color: colors.white },
  festDays: { fontSize: 12, fontWeight: '500', color: colors.gold },
  festDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  festAstro: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 18 },
  festImpact: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  festImpactLevel: { fontSize: 12, fontWeight: '500', color: colors.gold },
  festImpactNote: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 18 },
  festRitual: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.35)', marginTop: 6, fontStyle: 'italic' },
  deityCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  deityPriority: { fontSize: 9, fontWeight: '600', color: colors.gold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  deityName: { fontSize: 18, fontWeight: '300', color: colors.white },
  deityMantra: { fontSize: 13, fontWeight: '300', color: 'rgba(212,175,55,0.7)', marginTop: 6, fontStyle: 'italic' },
  deityDay: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  deityReason: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 18 },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20 },
  alertCard: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertType: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.7)', flex: 1 },
  alertDays: { fontSize: 11, fontWeight: '500', color: colors.gold },
  alertDesc: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  alertAdvice: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginTop: 6, fontStyle: 'italic' },
  yearTheme: { fontSize: 18, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 0.5 },
  yearPeak: { fontSize: 12, color: colors.gold, textAlign: 'center', marginTop: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  monthName: { width: 32, fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.75)' },
  monthBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 8 },
  monthBarFill: { height: 6, borderRadius: 3 },
  monthScore: { width: 24, fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  gemCard: { padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, marginBottom: 16 },
  gemStatus: { fontSize: 10, fontWeight: '600', color: colors.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  gemName: { fontSize: 20, fontWeight: '200', color: colors.white, letterSpacing: 0.5 },
  gemPlanet: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, marginBottom: 12 },
  gemMantra: { fontSize: 13, fontWeight: '300', color: 'rgba(212,175,55,0.6)', marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
  gemUpcoming: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  gemUpName: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.7)', flex: 1 },
  gemUpDate: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  gemUpStatus: { fontSize: 9, fontWeight: '600', color: colors.gold, letterSpacing: 0.5, marginLeft: 8 },
  gemWeak: { paddingVertical: 8 },
  gemWeakName: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.75)' },
  gemWeakIssue: { fontSize: 11, color: 'rgba(255,80,60,0.6)', marginTop: 2 },
  gemConflict: { fontSize: 12, color: 'rgba(255,80,60,0.5)', marginTop: 8, lineHeight: 18 },
  moneyDay: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  moneyDayDate: { width: 90, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  moneyDayName: { flex: 1, fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.75)' },
  moneyDayScore: { fontSize: 12, fontWeight: '500', color: colors.gold },
  dangerMark: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,80,60,0.6)' },
  horaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.03)' },
  horaRowActive: { backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 8 },
  horaTime: { width: 60, fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  horaName: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.75)', width: 70, marginLeft: 8 },
  horaDots: { flexDirection: 'row', gap: 3, flex: 1 },
  horaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
});

// ─── NEW RENDERER STYLES ───
const ns = StyleSheet.create({
  // Active Yogas
  yogaCard: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  yogaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yogaName: { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  yogaSanskrit: { fontSize: 11, fontWeight: '300', color: 'rgba(255,255,255,0.25)', marginTop: 2, fontStyle: 'italic' },
  yogaTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  yogaTypeText: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, textTransform: 'uppercase' },
  yogaBarBg: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 10 },
  yogaBarFill: { height: 2, borderRadius: 1 },
  yogaSummary: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  yogaExpanded: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 16 },
  yogaDetail: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.6)', marginTop: 6, lineHeight: 18 },
  yogaDetailLabel: { fontWeight: '500', color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 },
  yogaBody: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginTop: 8 },
  yogaActivation: { fontSize: 12, fontWeight: '300', color: colors.gold, marginTop: 8, fontStyle: 'italic' },
  yogaRemedy: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.4)', marginTop: 6, fontStyle: 'italic' },

  // Health Map
  vitalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  vitalLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, width: 60 },
  vitalBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 10 },
  vitalBarFill: { height: 4, borderRadius: 2 },
  vitalPct: { fontSize: 13, fontWeight: '200', color: 'rgba(255,255,255,0.7)', width: 36, textAlign: 'right' },
  healthZone: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  healthZoneName: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.8)' },
  healthZonePlanet: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthExpanded: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 14 },
  healthCaution: { fontSize: 12, fontWeight: '300', color: 'rgba(255,80,60,0.6)', textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },

  // Eclipse Impact
  eclipseCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  eclipseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eclipseType: { fontSize: 16, fontWeight: '400', color: colors.white },
  eclipseDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  eclipseSeverity: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  eclipseSeverityText: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8 },
  eclipseHouse: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  eclipseDuration: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 },

  // Weekly Forecast
  weekDay: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  weekDayHeader: { flexDirection: 'row', alignItems: 'center' },
  weekDayName: { width: 38, fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  weekDayBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 10 },
  weekDayBarFill: { height: 4, borderRadius: 2 },
  weekDayScore: { width: 24, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  weekDayVibe: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginTop: 4, marginLeft: 48 },
  weekDayTip: { fontSize: 11, fontWeight: '300', color: 'rgba(255,255,255,0.3)', marginTop: 2, marginLeft: 48, fontStyle: 'italic' },

  // Numerology
  numGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  numCard: { width: (SW - 52) / 2, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  numNumber: { fontSize: 32, fontWeight: '200', color: colors.gold, letterSpacing: 1 },
  numLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 },
  numMeaning: { fontSize: 11, fontWeight: '300', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6, lineHeight: 16 },

  // Vastu
  vastuZone: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  vastuZoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vastuDir: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },
  vastuStatusDot: { width: 8, height: 8, borderRadius: 4 },
  vastuPlanet: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  vastuAdvice: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 18 },
  vastuRemedy: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.6)', paddingVertical: 6, lineHeight: 20 },
});