import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal, Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Card, BottomNav, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

// ── Constants ─────────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: '😢', label: 'Awful',  value: 1 },
  { emoji: '😕', label: 'Bad',    value: 2 },
  { emoji: '😐', label: 'Okay',   value: 3 },
  { emoji: '🙂', label: 'Good',   value: 4 },
  { emoji: '😄', label: 'Great',  value: 5 },
];

const TRIGGERS = [
  'Stress', 'Boredom', 'Social pressure',
  'After meals', 'Sadness', 'Anxiety', 'Habit', 'Other',
];

// Time slots for "when did you vape" — clearer than raw 0-23
const TIME_SLOTS = [
  { id: 'early_morning', label: 'Early Morning',  sub: '12am – 6am',  hour: 3  },
  { id: 'morning',       label: 'Morning',         sub: '6am – 10am', hour: 8  },
  { id: 'midday',        label: 'Midday',           sub: '10am – 1pm', hour: 11 },
  { id: 'afternoon',     label: 'Afternoon',        sub: '1pm – 5pm',  hour: 14 },
  { id: 'evening',       label: 'Evening',          sub: '5pm – 9pm',  hour: 18 },
  { id: 'night',         label: 'Night',            sub: '9pm – 12am', hour: 22 },
];

// Duration options — replaces "puff count" since puffs are immeasurable
const DURATIONS = [
  { id: 'under_5',  label: 'under 5 min',   minutes: 4   },
  { id: 'under_15', label: '5–15 min',  minutes: 10  },
  { id: 'under_30', label: '15–30 min', minutes: 22  },
  { id: 'under_60', label: '30–60 min', minutes: 45  },
  { id: 'over_60',  label: 'over an hour',  minutes: 90  },
];

// Vape device types — synced with DetailsScreen choices
const VAPE_DEVICES = [
  { id: 'pod',        label: 'Pod System' },
  { id: 'disposable', label: 'Disposable' },
  { id: 'mod',        label: 'Box Mod' },
  { id: 'pen',        label: 'Vape Pen' },
  { id: 'other',      label: 'Other' },
];

// ── VapingDetailsSection sub-component ───────────────────────────────────────
function VapingDetailsSection({
  disabled, goal, sessions, setSessions,
  currentSession, setCurrentSession, addSession, removeSession,
}) {
  const showPuffCounter = goal && goal.dailyPuffLimit >= 15;
  const puffLimit       = goal?.dailyPuffLimit || 20;
  const [puffCount, setPuffCount] = React.useState(0);

  const puffPct   = puffLimit > 0 ? (puffCount / puffLimit) * 100 : 0;
  const puffColor = puffPct >= 90 ? colors.danger : puffPct >= 60 ? colors.warning : colors.success;

  return (
    <View style={vStyles.wrap}>
      <Text style={vStyles.title}>Tell us about your vaping today</Text>

      {/* Q1: When */}
      <Text style={vStyles.qLabel}>When did you vape?</Text>
      <Text style={vStyles.qHint}>Select the time(s) of day</Text>
      <View style={vStyles.timeGrid}>
        {TIME_SLOTS.map((slot) => {
          const active = currentSession.timeSlotId === slot.id;
          return (
            <TouchableOpacity
              key={slot.id}
              style={[vStyles.timeChip, active && vStyles.timeChipActive]}
              onPress={() => !disabled && setCurrentSession((p) => ({ ...p, timeSlotId: slot.id }))}
              activeOpacity={0.8}
            >
              <Text style={[vStyles.timeChipLabel, active && vStyles.timeChipLabelActive]}>{slot.label}</Text>
              <Text style={[vStyles.timeChipSub, active && { color: colors.lavender }]}>{slot.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Q2: Sessions list */}
      <Text style={[vStyles.qLabel, { marginTop: 16 }]}>How many sessions?</Text>
      <Text style={vStyles.qHint}>Add one entry per vaping session</Text>
      {sessions.map((s, idx) => {
        const slot = TIME_SLOTS.find((t) => t.id === s.timeSlotId);
        const dur  = DURATIONS.find((d)   => d.id  === s.durationId);
        const dev  = VAPE_DEVICES.find((v) => v.id === s.deviceId);
        return (
          <View key={idx} style={vStyles.sessionRow}>
            <Text style={vStyles.sessionNum}>#{idx + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={vStyles.sessionText}>{slot?.label || '—'} · {dur?.label || '—'}</Text>
              {dev && <Text style={vStyles.sessionDevice}>{dev.emoji} {dev.label}</Text>}
            </View>
            {!disabled && (
              <TouchableOpacity onPress={() => removeSession(idx)} style={vStyles.removeBtn}>
                <Text style={vStyles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Q3: Duration */}
      <Text style={[vStyles.qLabel, { marginTop: 12 }]}>How long did each session last?</Text>
      <View style={vStyles.durationRow}>
        {DURATIONS.map((d) => {
          const active = currentSession.durationId === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[vStyles.durationChip, active && vStyles.durationChipActive]}
              onPress={() => !disabled && setCurrentSession((p) => ({ ...p, durationId: d.id }))}
              activeOpacity={0.8}
            >
              <Text style={[vStyles.durationText, active && vStyles.durationTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Q4: Device */}
      <Text style={[vStyles.qLabel, { marginTop: 16 }]}>What device did you use?</Text>
      <View style={vStyles.deviceGrid}>
        {VAPE_DEVICES.map((dev) => {
          const active = currentSession.deviceId === dev.id;
          return (
            <TouchableOpacity
              key={dev.id}
              style={[vStyles.deviceChip, active && vStyles.deviceChipActive]}
              onPress={() => !disabled && setCurrentSession((p) => ({ ...p, deviceId: dev.id }))}
              activeOpacity={0.8}
            >
              <Text style={vStyles.deviceEmoji}>{dev.emoji}</Text>
              <Text style={[vStyles.deviceLabel, active && vStyles.deviceLabelActive]}>{dev.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add session button */}
      {!disabled && (
        <TouchableOpacity
          style={[vStyles.addBtn, (!currentSession.timeSlotId || !currentSession.durationId) && vStyles.addBtnDisabled]}
          onPress={addSession}
          disabled={!currentSession.timeSlotId || !currentSession.durationId}
          activeOpacity={0.8}
        >
          <Text style={vStyles.addBtnText}>＋ Add this session</Text>
        </TouchableOpacity>
      )}

      {/* Puff counter — light goal only */}
      {showPuffCounter && (
        <View style={vStyles.puffWrap}>
          <Text style={vStyles.qLabel}>Puff Counter</Text>
          <Text style={vStyles.qHint}>Your goal: max {puffLimit} puffs/day — tap each time you puff</Text>
          <View style={vStyles.puffCounterRow}>
            <TouchableOpacity style={vStyles.puffDecBtn} onPress={() => !disabled && setPuffCount((p) => Math.max(0, p - 1))}>
              <Text style={vStyles.puffDecText}>−</Text>
            </TouchableOpacity>
            <Text style={[vStyles.puffNum, { color: puffColor }]}>{puffCount}</Text>
            <TouchableOpacity style={vStyles.puffIncBtn} onPress={() => !disabled && setPuffCount((p) => Math.min(puffLimit, p + 1))}>
              <Text style={vStyles.puffIncText}>+1 puff</Text>
            </TouchableOpacity>
          </View>
          {/* Dot grid — one dot per allowed puff */}
          <View style={vStyles.puffDotGrid}>
            {Array.from({ length: puffLimit }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => !disabled && setPuffCount(i + 1)} activeOpacity={0.7}>
                <View style={[vStyles.puffDot, i < puffCount && { backgroundColor: puffColor, borderColor: puffColor }]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={vStyles.puffBar}>
            <View style={[vStyles.puffBarFill, { width: `${puffPct}%`, backgroundColor: puffColor }]} />
          </View>
          <Text style={[vStyles.puffBarLabel, { color: puffColor }]}>
            {puffCount}/{puffLimit} puffs{puffPct >= 90 ? ' — at your limit!' : puffPct >= 60 ? ' — getting close' : ' today'}
          </Text>
        </View>
      )}

      {/* Goal reminder */}
      {goal && (
        <View style={[vStyles.goalReminder, { borderColor: goal.color + '60' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[vStyles.goalReminderTitle, { color: goal.color }]}>Quit plan: {goal.label}</Text>
            <Text style={vStyles.goalReminderText}>
              {goal.weeklyGoal} — {sessions.length === 0
                ? 'Log your sessions above so we can track your progress.'
                : `${sessions.length} session${sessions.length > 1 ? 's' : ''} logged today.`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── VapingDetailsSection Styles ───────────────────────────────────────────────
const vStyles = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(224,112,112,0.07)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(224,112,112,0.25)', padding: 16, marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 14 },
  qLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 },
  qHint: { fontSize: 11, color: colors.textMuted, marginBottom: 10 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  timeChip: { width: '47%', padding: 10, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  timeChipActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  timeChipLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  timeChipLabelActive: { color: colors.lavender },
  timeChipSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 6 },
  sessionNum: { fontSize: 12, color: colors.lavender, fontWeight: '800', width: 20 },
  sessionText: { fontSize: 12, color: colors.bone, fontWeight: '500' },
  sessionDevice: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: colors.danger, fontWeight: '700' },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  durationChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  durationChipActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  durationText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  durationTextActive: { color: colors.lavender, fontWeight: '700' },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  deviceChip: { width: '30%', padding: 10, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', gap: 4 },
  deviceChipActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  deviceEmoji: { fontSize: 20 },
  deviceLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },
  deviceLabelActive: { color: colors.lavender, fontWeight: '700' },
  addBtn: { marginTop: 14, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.35 },
  addBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
  puffWrap: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(181,125,218,0.25)' },
  puffCounterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 14 },
  puffDecBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  puffDecText: { fontSize: 20, color: colors.textMuted, lineHeight: 24 },
  puffNum: { fontSize: 42, fontWeight: '800', minWidth: 60, textAlign: 'center' },
  puffIncBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.frenchBlue },
  puffIncText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
  puffDotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, justifyContent: 'center' },
  puffDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  puffBar: { height: 6, backgroundColor: 'rgba(170,160,187,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  puffBarFill: { height: '100%', borderRadius: 3 },
  puffBarLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  goalReminder: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, backgroundColor: 'rgba(65,71,139,0.25)', borderRadius: radius.md, borderWidth: 1, padding: 12 },
  goalReminderIcon: { fontSize: 18 },
  goalReminderTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  goalReminderText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});

function getLast7Days(moodLogs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label   = i === 0 ? 'Today' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const log     = moodLogs.find((l) => l.date === dateStr);
    days.push({ label, craving: log?.craving ?? 0, isToday: i === 0, isHigh: (log?.craving ?? 0) >= 7 });
  }
  return days;
}

const cravingBadge = (v) =>
  v <= 3 ? { text: 'Low',      color: colors.success  }
: v <= 6 ? { text: 'Moderate', color: colors.warning  }
:          { text: 'High',     color: colors.danger   };

// ── Component ─────────────────────────────────────────────────────────────────
export default function MoodScreen({ navigation }) {
  const {
    currentUser, logMoodEntry, getUnreadCount,
    moodDraft, updateMoodDraft, clearMoodDraft,
  } = useAuth();
  const unreadCount   = getUnreadCount();
  const moodLogs      = currentUser?.moodLogs || [];
  const streak        = currentUser?.streak   || 0;
  const todayStr      = new Date().toISOString().split('T')[0];
  const alreadyLogged = moodLogs.some((l) => l.date === todayStr);

  // Form state
  const [mood,         setMood]        = useState(moodDraft?.mood ?? null);
  const [triggers,     setTriggers]    = useState(moodDraft?.triggers ?? []);
  const [otherTrigger, setOtherTrigger] = useState(moodDraft?.otherTrigger ?? '');
  const [craving,      setCraving]     = useState(moodDraft?.craving ?? 0);
  const [vaped,        setVaped]       = useState(moodDraft?.vaped ?? null);
  const [vaperSessions,setVapeSessions]= useState(moodDraft?.vaperSessions ?? []);  // array of { timeSlotId, durationId }
  const [comment,      setComment]     = useState(moodDraft?.comment ?? '');

  // Modal state
  const [showModal,    setShowModal]   = useState(false);
  const [lastResult,   setLastResult]  = useState(null);

  const toggleTrigger = (t) =>
    setTriggers((p) => {
      const selected = p.includes(t);
      if (selected && t === 'Other') setOtherTrigger('');
      return selected ? p.filter((x) => x !== t) : [...p, t];
    });

  // ── Vaping session helpers ──────────────────────────────────────────────────
  const [currentSession, setCurrentSession] = useState(
    moodDraft?.currentSession ?? { timeSlotId: null, durationId: null }
  );

  useEffect(() => {
    if (alreadyLogged) return;
    updateMoodDraft && updateMoodDraft({
      mood,
      triggers,
      otherTrigger,
      craving,
      vaped,
      vaperSessions,
      currentSession,
      comment,
    });
  }, [mood, triggers, otherTrigger, craving, vaped, vaperSessions, currentSession, comment, alreadyLogged]);

  const addSession = () => {
    if (!currentSession.timeSlotId || !currentSession.durationId) return;
    setVapeSessions((prev) => [...prev, { ...currentSession }]);
    setCurrentSession({ timeSlotId: null, durationId: null });
  };

  const removeSession = (idx) =>
    setVapeSessions((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!mood)          { alert('Please select your current mood.'); return; }
    if (vaped === null) { alert('Please indicate whether you vaped today.'); return; }

    // Convert sessions to hour numbers for storage
    const vapedHour = vaperSessions.length > 0
      ? TIME_SLOTS.find((s) => s.id === vaperSessions[0].timeSlotId)?.hour ?? null
      : null;

    const totalMinutes = vaperSessions.reduce((sum, s) => {
      const dur = DURATIONS.find((d) => d.id === s.durationId);
      return sum + (dur?.minutes || 0);
    }, 0);

    const customOtherTrigger = otherTrigger.trim();
    if (triggers.includes('Other') && !customOtherTrigger) {
      alert('Please type what the "Other" trigger is.');
      return;
    }

    const loggedTriggers = triggers.map((t) => (
      t === 'Other' ? `Other: ${customOtherTrigger}` : t
    ));

    const result = logMoodEntry({
      mood, triggers: loggedTriggers, craving, vaped,
      puffsToday:    0,                  // deprecated — replaced by time-based
      vapedHour,                          // first session hour (for weekly peak analysis)
      vapedSessions: vaperSessions,       // full session records
      totalVapingMinutes: totalMinutes,   // total estimated minutes vaped today
      comment: comment.trim(),
    });

    if (result?.alreadyLogged) { alert('You have already logged today. Come back tomorrow!'); return; }
    setLastResult(result);
    setShowModal(true);
  };

  const closeAndGoHome = () => {
    setShowModal(false);
    setMood(null); setTriggers([]); setCraving(0); setVaped(null);
    setOtherTrigger('');
    setVapeSessions([]); setCurrentSession({ timeSlotId: null, durationId: null }); setComment('');
    clearMoodDraft && clearMoodDraft();
    navigation.navigate('VapeUserDashboard');
  };

  const chart = getLast7Days(moodLogs);
  const maxC  = Math.max(...chart.map((d) => d.craving), 1);
  const badge = cravingBadge(craving);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.hdr}>
          <Text style={styles.title}>Mood Log</Text>
          <Text style={styles.dayLabel}>Day {streak}</Text>
        </View>

        {alreadyLogged && (
          <View style={styles.alreadyBanner}>
            <Text style={styles.alreadyText}>✓ You've already logged today. See you tomorrow!</Text>
          </View>
        )}

        {/* ── 1. Mood ── */}
        <Text style={styles.sectionLabel}>1. How are you feeling right now?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.moodBtn, mood === m.label && styles.moodBtnSel]}
              onPress={() => !alreadyLogged && setMood(m.label)}
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 2. Triggers ── */}
        <Text style={styles.sectionLabel}>2. What triggered your craving today?</Text>
        <Text style={styles.sectionHint}>Select all that apply</Text>
        <View style={styles.chipRow}>
          {TRIGGERS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, triggers.includes(t) && styles.chipSel]}
              onPress={() => !alreadyLogged && toggleTrigger(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, triggers.includes(t) && styles.chipTextSel]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {triggers.includes('Other') && (
          <TextInput
            style={styles.otherInput}
            value={otherTrigger}
            onChangeText={setOtherTrigger}
            placeholder="Type your other trigger"
            placeholderTextColor={colors.textMuted}
            editable={!alreadyLogged}
            maxLength={60}
          />
        )}

        {/* ── 3. Craving chart ── */}
        <Text style={styles.sectionLabel}>3. Craving history — last 7 days</Text>
        <View style={styles.chartWrap}>
          {chart.map((day, i) => {
            const hPct = day.craving === 0 ? 0 : Math.max(8, (day.craving / maxC) * 100);
            return (
              <View key={i} style={styles.chartBarWrap}>
                <View style={[
                  styles.chartBar,
                  { height: `${hPct}%` },
                  day.isToday && styles.chartToday,
                  day.isHigh && !day.isToday && styles.chartHigh,
                  day.craving === 0 && styles.chartZero,
                ]} />
              </View>
            );
          })}
        </View>
        <View style={styles.chartLabels}>
          {chart.map((d) => (
            <Text key={d.label} style={[styles.chartLabel, d.isToday && { color: colors.lavender }]}>
              {d.label}
            </Text>
          ))}
        </View>

        {/* ── 4. Craving slider ── */}
        <Text style={styles.sectionLabel}>4. Rate your craving intensity right now</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEnd}>None</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0} maximumValue={10} step={1}
            value={craving}
            onValueChange={(v) => !alreadyLogged && setCraving(v)}
            minimumTrackTintColor={colors.lavender}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.lavender}
            disabled={alreadyLogged}
          />
          <Text style={styles.sliderEnd}>Intense</Text>
        </View>
        <View style={styles.cravingInfo}>
          <Text style={styles.cravingVal}>
            Craving: <Text style={{ color: colors.lavender, fontWeight: '700' }}>{craving}</Text>/10
          </Text>
          <View style={[styles.cravingBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.cravingBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        {/* ── 5. Coping tips ── */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.copingTitle}>Today's coping tips</Text>
          {craving >= 7 ? (
            <>
              <Text style={styles.copingItem}>Your craving is high — act now:</Text>
              <Text style={styles.copingItem}>• Call or text your peer supporter</Text>
              <Text style={styles.copingItem}>• Go for a brisk 5-min walk immediately</Text>
              <Text style={styles.copingItem}>• Splash cold water on your face</Text>
            </>
          ) : craving >= 4 ? (
            <>
              <Text style={styles.copingItem}>• Practice box breathing (4-4-4-4 counts)</Text>
              <Text style={styles.copingItem}>• Drink a large glass of water slowly</Text>
              <Text style={styles.copingItem}>• Identify what triggered this craving</Text>
            </>
          ) : (
            <>
              <Text style={styles.copingItem}>• Great job keeping cravings low today!</Text>
              <Text style={styles.copingItem}>• Keep your streak going — log consistently</Text>
              <Text style={styles.copingItem}>• Reward yourself for every vape-free day</Text>
            </>
          )}
        </Card>

        {/* ── 6. Did you vape? ── */}
        <Text style={styles.sectionLabel}>5. Did you vape today?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, vaped === false && styles.toggleNo]}
            onPress={() => !alreadyLogged && setVaped(false)}
          >
            <Text style={[styles.toggleText, vaped === false && styles.toggleNoText]}>No, I didn't vape</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, vaped === true && styles.toggleYes]}
            onPress={() => !alreadyLogged && setVaped(true)}
          >
            <Text style={[styles.toggleText, vaped === true && styles.toggleYesText]}>Yes, I vaped</Text>
          </TouchableOpacity>
        </View>

        {/* ── 6b. Vaping details — shown only when vaped = true ── */}
        {vaped === true && (
          <VapingDetailsSection
            disabled={alreadyLogged}
            goal={currentUser?.goal || null}
            sessions={vaperSessions}
            setSessions={setVapeSessions}
            currentSession={currentSession}
            setCurrentSession={setCurrentSession}
            addSession={addSession}
            removeSession={removeSession}
          />
        )}

        {/* ── 7. Comment ── */}
        <Text style={styles.sectionLabel}>6. Add a note (optional)</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="How are you feeling? Anything on your mind today..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          maxLength={300}
          editable={!alreadyLogged}
        />
        <Text style={styles.charCount}>{comment.length}/300</Text>

        {!alreadyLogged && (
          <PrimaryButton title="Log Today's Entry" onPress={handleSubmit} style={{ marginTop: 8 }} />
        )}
      </ScrollView>

      {/* Log Complete Modal */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {lastResult && !lastResult.vaped ? (
              <>
                <Text style={styles.modalIcon}>✦</Text>
                <Text style={styles.modalTitle}>Entry Recorded!</Text>
                <Text style={styles.modalSub}>+{lastResult?.pointsEarned || 0} points earned</Text>
                {lastResult?.newStreak > 0 && (
                  <Text style={styles.modalStreak}>🔥 {lastResult.newStreak} day streak!</Text>
                )}
                {lastResult?.relapseRisk > 60 && (
                  <Text style={styles.modalWarning}>
                    Your relapse risk is elevated. Reach out to your support network.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>💪</Text>
                <Text style={styles.modalTitle}>Entry Recorded</Text>
                <Text style={styles.modalSub}>Honesty is the first step. Keep going!</Text>
                {lastResult?.relapseRisk > 60 && (
                  <Text style={styles.modalWarning}>
                    High risk detected. Check the Support section.
                  </Text>
                )}
              </>
            )}

            {/* Newly unlocked rewards */}
            {lastResult?.newlyUnlocked?.length > 0 && (
              <View style={styles.newRewardsWrap}>
                <Text style={styles.newRewardsTitle}>
                  🏅 Reward{lastResult.newlyUnlocked.length > 1 ? 's' : ''} Unlocked!
                </Text>
                {lastResult.newlyUnlocked.map((r) => (
                  <View key={r.id} style={styles.newRewardRow}>
                    <Text style={styles.newRewardIcon}>{r.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.newRewardName}>{r.name}</Text>
                      <Text style={styles.newRewardPts}>+{r.pts} bonus points</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <PrimaryButton title="OK" onPress={closeAndGoHome} />
          </View>
        </View>
      </Modal>

      <BottomNav active="Mood" navigation={navigation} unreadCount={unreadCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  dayLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  alreadyBanner: { backgroundColor: 'rgba(126,200,160,0.15)', borderWidth: 1, borderColor: 'rgba(126,200,160,0.4)', borderRadius: radius.md, padding: 12, marginBottom: 16 },
  alreadyText: { color: colors.success, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: 8 },
  sectionHint: { fontSize: 11, color: colors.textMuted, marginBottom: 10, marginTop: -4 },

  // Mood
  moodRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  moodBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.cardSolid, alignItems: 'center' },
  moodBtnSel: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  moodEmoji: { fontSize: 22, marginBottom: 3 },
  moodLabel: { fontSize: 9, color: colors.textMuted },

  // Triggers
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid },
  chipSel: { backgroundColor: colors.surface2, borderColor: colors.lavender },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  chipTextSel: { color: colors.text },
  otherInput: {
    backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11,
    color: colors.text, fontSize: 13, marginTop: -8, marginBottom: 18,
  },

  // Chart
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 70, marginBottom: 4, gap: 4 },
  chartBarWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4, backgroundColor: 'rgba(181,125,218,0.25)' },
  chartZero: { height: 4, backgroundColor: 'rgba(170,160,187,0.15)' },
  chartToday: { backgroundColor: colors.lavender },
  chartHigh: { backgroundColor: 'rgba(224,112,112,0.5)' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chartLabel: { fontSize: 9, color: colors.textMuted, flex: 1, textAlign: 'center' },

  // Slider
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sliderEnd: { fontSize: 11, color: colors.textMuted, width: 36 },
  cravingInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cravingVal: { fontSize: 13, color: colors.textMuted },
  cravingBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  cravingBadgeText: { fontSize: 11, fontWeight: '700' },

  // Coping
  copingTitle: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 8 },
  copingItem: { fontSize: 12, color: colors.bone, marginBottom: 4, lineHeight: 19 },

  // Toggle
  toggleRow: { gap: 8, marginBottom: 12 },
  toggleBtn: { paddingVertical: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: 'transparent' },
  toggleNo: { backgroundColor: 'rgba(126,200,160,0.15)', borderColor: colors.success },
  toggleYes: { backgroundColor: 'rgba(224,112,112,0.15)', borderColor: colors.danger },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  toggleNoText: { color: colors.success },
  toggleYesText: { color: colors.danger },

  // Vaping sessions
  vapedDetails: { backgroundColor: 'rgba(224,112,112,0.07)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(224,112,112,0.25)', padding: 16, marginBottom: 16 },
  vapedTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  vapedHint: { fontSize: 12, color: colors.textMuted, marginBottom: 14, lineHeight: 18 },

  // Logged session rows
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 8 },
  sessionIcon: { fontSize: 16 },
  sessionText: { flex: 1, fontSize: 12, color: colors.bone },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: colors.danger, fontWeight: '700' },

  // Session builder
  sessionBuilder: { backgroundColor: 'rgba(65,71,139,0.25)', borderRadius: radius.md, padding: 14, marginTop: 4 },
  builderLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 10 },

  // Time grid
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { width: '47%', padding: 10, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  timeChipActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  timeChipLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  timeChipLabelActive: { color: colors.lavender },
  timeChipSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  // Duration row
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  durationChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  durationChipActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  durationChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  durationChipTextActive: { color: colors.lavender, fontWeight: '700' },

  // Add session button
  addSessionBtn: { marginTop: 14, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  addSessionBtnDisabled: { opacity: 0.4 },
  addSessionBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },

  // Comment
  commentInput: { backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 13, textAlignVertical: 'top', minHeight: 80, marginBottom: 4 },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginBottom: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.8)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 32, width: '85%', alignItems: 'center' },
  modalIcon: { fontSize: 48, marginBottom: 12, color: colors.lavender },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  modalSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
  modalStreak: { fontSize: 16, fontWeight: '700', color: colors.lavender, marginBottom: 14 },
  modalWarning: { fontSize: 12, color: colors.danger, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  newRewardsWrap: { width: '100%', backgroundColor: 'rgba(181,125,218,0.12)', borderRadius: radius.md, borderWidth: 1, borderColor: colors.lavender + '40', padding: 12, marginBottom: 16 },
  newRewardsTitle: { fontSize: 13, fontWeight: '700', color: colors.lavender, marginBottom: 8, textAlign: 'center' },
  newRewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  newRewardIcon: { fontSize: 22 },
  newRewardName: { fontSize: 13, fontWeight: '700', color: colors.text },
  newRewardPts: { fontSize: 11, color: colors.lavender },
});
