import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Card, BottomNav, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

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

// Chart: last 7 days craving from real logs
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
  v <= 3 ? { text: 'Low',      color: colors.success }
: v <= 6 ? { text: 'Moderate', color: colors.warning }
:          { text: 'High',     color: colors.danger  };

export default function MoodScreen({ navigation }) {
  const { currentUser, logMoodEntry, getUnreadCount } = useAuth();
  const unreadCount = getUnreadCount();
  const moodLogs    = currentUser?.moodLogs || [];
  const streak      = currentUser?.streak   || 0;
  const todayStr    = new Date().toISOString().split('T')[0];
  const alreadyLogged = moodLogs.some((l) => l.date === todayStr);

  const [mood,             setMood]            = useState(null);
  const [triggers,         setTriggers]        = useState([]);
  const [craving,          setCraving]         = useState(0);
  const [vaped,            setVaped]           = useState(null);
  const [puffsToday,       setPuffsToday]      = useState('');   // hourly record
  const [vapedHour,        setVapedHour]       = useState('');   // hour of first puff
  const [comment,          setComment]         = useState('');   // free-text comment
  const [showModal,        setShowModal]       = useState(false);
  const [lastResult,       setLastResult]      = useState(null);

  const toggleTrigger = (t) =>
    setTriggers((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const handleSubmit = () => {
    if (!mood)         { alert('Please select your current mood.'); return; }
    if (vaped === null){ alert('Please indicate whether you vaped today.'); return; }

    const result = await logMoodEntry({
      mood, triggers, craving, vaped,
      puffsToday: vaped ? (parseInt(puffsToday, 10) || 0) : 0,
      vapedHour:  vaped ? (parseInt(vapedHour,  10) || null) : null,
      comment: comment.trim(),
    });
    if (result?.alreadyLogged) { alert('You have already logged today. Come back tomorrow!'); return; }

    setLastResult(result);
    setShowModal(true);
  };

  const closeAndGoHome = () => {
    setShowModal(false);
    setMood(null); setTriggers([]); setCraving(0); setVaped(null);
    setPuffsToday(''); setVapedHour(''); setComment('');
    navigation.navigate('VapeUserDashboard');
  };

  const chart  = getLast7Days(moodLogs);
  const maxC   = Math.max(...chart.map((d) => d.craving), 1);
  const badge  = cravingBadge(craving);

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

        {/* ── SECTION 1: Mood ── */}
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

        {/* ── SECTION 2: Triggers ── */}
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

        {/* ── SECTION 3: Craving chart ── */}
        <Text style={styles.sectionLabel}>3. Craving history — last 7 days</Text>
        <View style={styles.chartWrap}>
          {chart.map((day, i) => {
            const hPct = day.craving === 0 ? 0 : Math.max(8, (day.craving / maxC) * 100);
            return (
              <View key={i} style={styles.chartBarWrap}>
                <View style={[
                  styles.chartBar,
                  { height: `${hPct}%` },
                  day.isToday  && styles.chartToday,
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

        {/* ── SECTION 4: Today's craving slider ── */}
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

        {/* ── SECTION 5: Coping tips (contextual) ── */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.copingTitle}>Today's coping tips</Text>
          {craving >= 7 ? (
            <>
              <Text style={styles.copingItem}>  Your craving is high — act now:</Text>
              <Text style={styles.copingItem}>• Call or text your peer supporter</Text>
              <Text style={styles.copingItem}>• Go for a brisk 5-min walk immediately</Text>
              <Text style={styles.copingItem}>• Hold ice cubes or splash cold water on face</Text>
            </>
          ) : craving >= 4 ? (
            <>
              <Text style={styles.copingItem}>• Practice box breathing (4 counts in/hold/out/hold)</Text>
              <Text style={styles.copingItem}>• Drink a large glass of water slowly</Text>
              <Text style={styles.copingItem}>• Identify what triggered this craving</Text>
            </>
          ) : (
            <>
              <Text style={styles.copingItem}>• Great job keeping cravings low today</Text>
              <Text style={styles.copingItem}>• Keep your streak going — log consistently</Text>
              <Text style={styles.copingItem}>• Reward yourself for every vape-free day</Text>
            </>
          )}
        </Card>

        {/* ── SECTION 6: Did you vape? ── */}
        <Text style={styles.sectionLabel}>5. Did you vape today?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, vaped === false && styles.toggleNo]}
            onPress={() => !alreadyLogged && setVaped(false)}
          >
            <Text style={[styles.toggleText, vaped === false && styles.toggleNoText]}>
              No, I didn't vape
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, vaped === true && styles.toggleYes]}
            onPress={() => !alreadyLogged && setVaped(true)}
          >
            <Text style={[styles.toggleText, vaped === true && styles.toggleYesText]}>
              Yes, I vaped
            </Text>
          </TouchableOpacity>
        </View>

        {/* Puff count + hour — only shown if vaped */}
        {vaped === true && (
          <View style={styles.vapedDetails}>
            <Text style={styles.vapedDetailsLabel}>
              Help us understand your usage better:
            </Text>
            <View style={styles.vapedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Total puffs today</Text>
                <TextInput
                  style={styles.smallInput}
                  value={puffsToday}
                  onChangeText={(v) => setPuffsToday(v.replace(/\D/g, ''))}
                  placeholder="e.g. 12"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>First puff at (hour, 0–23)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={vapedHour}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ''), 10);
                    setVapedHour(!isNaN(n) && n >= 0 && n <= 23 ? String(n) : v === '' ? '' : vapedHour);
                  }}
                  placeholder="e.g. 14 (2pm)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── SECTION 7: Comment ── */}
        <Text style={styles.sectionLabel}>6. Add a note (optional)</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="How are you feeling? Any thoughts on today..."
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
                  <Text style={styles.modalStreak}>{lastResult.newStreak} day streak!</Text>
                )}
                {lastResult?.relapseRisk > 60 && (
                  <Text style={styles.modalWarning}>
                    ⚠️ Your relapse risk is elevated. Reach out to your support network.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Entry Recorded</Text>
                <Text style={styles.modalSub}>Honesty is the first step. Keep going!</Text>
                {lastResult?.relapseRisk > 60 && (
                  <Text style={styles.modalWarning}>
                    ⚠️ High risk detected. Check the Support section.
                  </Text>
                )}
              </>
            )}

            {/* Newly unlocked rewards */}
            {lastResult?.newlyUnlocked?.length > 0 && (
              <View style={styles.newRewardsWrap}>
                <Text style={styles.newRewardsTitle}>🏅 Reward{lastResult.newlyUnlocked.length > 1 ? 's' : ''} Unlocked!</Text>
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
  alreadyBanner: {
    backgroundColor: 'rgba(126,200,160,0.15)', borderWidth: 1,
    borderColor: 'rgba(126,200,160,0.4)', borderRadius: radius.md, padding: 12, marginBottom: 16,
  },
  alreadyText: { color: colors.success, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: 8,
  },
  sectionHint: { fontSize: 11, color: colors.textMuted, marginBottom: 10, marginTop: -4 },
  // Mood
  moodRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  moodBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.cardSolid,
    alignItems: 'center',
  },
  moodBtnSel: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  moodEmoji: { fontSize: 22, marginBottom: 3 },
  moodLabel: { fontSize: 9, color: colors.textMuted },
  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  chipSel: { backgroundColor: colors.surface2, borderColor: colors.lavender },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  chipTextSel: { color: colors.text },
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
  // Vape toggle
  toggleRow: { gap: 8, marginBottom: 12 },
  toggleBtn: {
    paddingVertical: 13, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', backgroundColor: 'transparent',
  },
  toggleNo:  { backgroundColor: 'rgba(126,200,160,0.15)', borderColor: colors.success },
  toggleYes: { backgroundColor: 'rgba(224,112,112,0.15)', borderColor: colors.danger },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  toggleNoText:  { color: colors.success },
  toggleYesText: { color: colors.danger },
  // Vape details
  vapedDetails: {
    backgroundColor: 'rgba(224,112,112,0.08)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(224,112,112,0.3)', padding: 14, marginBottom: 16,
  },
  vapedDetailsLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 10, fontStyle: 'italic' },
  vapedRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 11, color: colors.lilacAsh, marginBottom: 5, fontWeight: '600' },
  smallInput: {
    backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10,
    color: colors.text, fontSize: 14,
  },
  // Comment
  commentInput: {
    backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.text, fontSize: 13, textAlignVertical: 'top',
    minHeight: 80, marginBottom: 4,
  },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginBottom: 8 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.8)', alignItems: 'center', justifyContent: 'center' },
  modal: {
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 32, width: '85%', alignItems: 'center',
  },
  modalIcon: { fontSize: 48, marginBottom: 12, color: colors.lavender },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  modalSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
  modalStreak: { fontSize: 16, fontWeight: '700', color: colors.lavender, marginBottom: 14 },
  modalWarning: { fontSize: 12, color: colors.danger, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  newRewardsWrap: {
    width: '100%', backgroundColor: 'rgba(181,125,218,0.12)', borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.lavender + '40', padding: 12, marginBottom: 16,
  },
  newRewardsTitle: { fontSize: 13, fontWeight: '700', color: colors.lavender, marginBottom: 8, textAlign: 'center' },
  newRewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  newRewardIcon: { fontSize: 22 },
  newRewardName: { fontSize: 13, fontWeight: '700', color: colors.text },
  newRewardPts: { fontSize: 11, color: colors.lavender },
});
