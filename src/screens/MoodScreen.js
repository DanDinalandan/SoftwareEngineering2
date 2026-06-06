import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Card, BottomNav, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

const MOODS = [
  { emoji: '😢', label: 'Awful' },
  { emoji: '😕', label: 'Bad' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
];
const TRIGGERS = ['Stress', 'Boredom', 'Social', 'Sadness', 'After meals', 'Other'];

// Get last 7 days labels + craving data from logs
function getLast7Days(moodLogs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const log = moodLogs.find((l) => l.date === dateStr);
    days.push({ label, craving: log ? log.craving : 0, isToday: i === 0 });
  }
  return days;
}

export default function MoodScreen({ navigation }) {
  const { currentUser, getUnreadCount, logMoodEntry } = useAuth();
  const unreadCount = getUnreadCount ? getUnreadCount() : 0;
  const moodLogs = currentUser?.moodLogs || [];
  const streak = currentUser?.streak || 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyLoggedToday = moodLogs.some((l) => l.date === todayStr);

  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [cravingIntensity, setCravingIntensity] = useState(0);
  const [vaped, setVaped] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const toggleTrigger = (t) =>
    setSelectedTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const handleSubmit = () => {
    if (!selectedMood) { alert('Please select how you are feeling.'); return; }
    if (vaped === null) { alert('Please indicate if you vaped today.'); return; }

    const result = logMoodEntry({
      mood: selectedMood,
      triggers: selectedTriggers,
      craving: cravingIntensity,
      vaped,
    });

    if (result?.alreadyLogged) {
      alert('You have already logged today. Come back tomorrow!');
      return;
    }

    setLastResult(result);
    setShowModal(true);
  };

  const closeAndGoHome = () => {
    setShowModal(false);
    navigation.navigate('VapeUserDashboard');
  };

  const chartDays = getLast7Days(moodLogs);
  const maxCraving = Math.max(...chartDays.map((d) => d.craving), 1);

  // Craving risk label
  const cravingLabel =
    cravingIntensity <= 3 ? { text: 'Low', color: colors.success } :
    cravingIntensity <= 6 ? { text: 'Moderate', color: colors.warning } :
    { text: 'High', color: colors.danger };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mood Log</Text>
          <Text style={styles.dayLabel}>Day {streak}</Text>
        </View>

        {alreadyLoggedToday && (
          <View style={styles.alreadyLogged}>
            <Text style={styles.alreadyLoggedText}>✓ You've already logged today. Come back tomorrow!</Text>
          </View>
        )}

        {/* Mood */}
        <Text style={styles.sectionLabel}>HOW ARE YOU FEELING?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.moodBtn, selectedMood === m.label && styles.moodBtnSelected]}
              onPress={() => !alreadyLoggedToday && setSelectedMood(m.label)}
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Triggers */}
        <Text style={styles.sectionLabel}>WHAT TRIGGERED YOU TODAY?</Text>
        <View style={styles.chipRow}>
          {TRIGGERS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, selectedTriggers.includes(t) && styles.chipSelected]}
              onPress={() => !alreadyLoggedToday && toggleTrigger(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedTriggers.includes(t) && styles.chipTextSel]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Craving Chart — real data from logs */}
        <Text style={styles.sectionLabel}>CRAVING INTENSITY — LAST 7 DAYS</Text>
        <View style={styles.chartWrap}>
          {chartDays.map((day, i) => {
            const heightPct = day.craving === 0 ? 0 : Math.max(8, (day.craving / maxCraving) * 100);
            const isHigh = day.craving >= 7;
            return (
              <View key={i} style={styles.chartBarWrap}>
                <View
                  style={[
                    styles.chartBar,
                    { height: `${heightPct}%` },
                    day.isToday && styles.chartToday,
                    isHigh && !day.isToday && styles.chartHigh,
                    day.craving === 0 && styles.chartEmpty,
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.chartLabels}>
          {chartDays.map((d) => (
            <Text key={d.label} style={[styles.chartLabel, d.isToday && { color: colors.lavender }]}>{d.label}</Text>
          ))}
        </View>

        {/* Coping Tips */}
        <Card style={{ marginTop: 14 }}>
          <Text style={styles.copingTitle}>✨ Today's coping suggestions</Text>
          <Text style={styles.copingItem}>• Call a friend or someone you trust</Text>
          <Text style={styles.copingItem}>• Go for a 10-minute walk outside</Text>
          <Text style={styles.copingItem}>• Drink a glass of water slowly</Text>
          <Text style={styles.copingItem}>• Take 5 deep breaths</Text>
        </Card>

        {/* Craving Slider — no level up button, just shows risk label */}
        <Text style={styles.sectionLabel}>TODAY'S CRAVING INTENSITY</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>None</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={cravingIntensity}
            onValueChange={(v) => !alreadyLoggedToday && setCravingIntensity(v)}
            minimumTrackTintColor={colors.lavender}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.lavender}
            disabled={alreadyLoggedToday}
          />
          <Text style={styles.sliderLabel}>Intense</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Text style={styles.cravingVal}>
            Intensity: <Text style={{ color: colors.lavender, fontWeight: '700' }}>{cravingIntensity}</Text>/10
          </Text>
          <View style={[styles.cravingBadge, { backgroundColor: cravingLabel.color + '20' }]}>
            <Text style={[styles.cravingBadgeText, { color: cravingLabel.color }]}>{cravingLabel.text}</Text>
          </View>
        </View>

        {/* Vaped toggle */}
        <Text style={styles.sectionLabel}>DID YOU VAPE TODAY?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, vaped === false && styles.toggleActive]}
            onPress={() => !alreadyLoggedToday && setVaped(false)}
          >
            <Text style={[styles.toggleText, vaped === false && styles.toggleTextActive]}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, vaped === true && styles.toggleDanger]}
            onPress={() => !alreadyLoggedToday && setVaped(true)}
          >
            <Text style={[styles.toggleText, vaped === true && styles.toggleTextActive]}>Yes</Text>
          </TouchableOpacity>
        </View>

        {!alreadyLoggedToday && (
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
                <Text style={styles.modalTitle}>Recorded!</Text>
                <Text style={styles.modalSub}>
                  +{lastResult?.pointsEarned || 0} points earned
                </Text>
                {lastResult?.newStreak > 0 && (
                  <Text style={{ color: colors.lavender, fontSize: 15, fontWeight: '700', marginBottom: 16 }}>
                    🔥 {lastResult.newStreak} day streak!
                  </Text>
                )}
                {lastResult?.relapseRisk > 60 && (
                  <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    ⚠️ Your relapse risk is high. Please reach out to your support network.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>💪</Text>
                <Text style={styles.modalTitle}>Logged</Text>
                <Text style={styles.modalSub}>Keep going. Every honest entry helps.</Text>
                {lastResult?.relapseRisk > 60 && (
                  <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    ⚠️ High risk detected. Consider checking the Support section.
                  </Text>
                )}
              </>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  dayLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  alreadyLogged: { backgroundColor: 'rgba(126,200,160,0.15)', borderWidth: 1, borderColor: 'rgba(126,200,160,0.4)', borderRadius: radius.md, padding: 12, marginBottom: 16 },
  alreadyLoggedText: { color: colors.success, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  moodRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  moodBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.cardSolid, alignItems: 'center' },
  moodBtnSelected: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  moodEmoji: { fontSize: 22, marginBottom: 3 },
  moodLabel: { fontSize: 10, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid },
  chipSelected: { backgroundColor: colors.surface2, borderColor: colors.lavender },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  chipTextSel: { color: colors.text },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 70, marginBottom: 4, gap: 4 },
  chartBarWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4, backgroundColor: 'rgba(181,125,218,0.25)' },
  chartEmpty: { height: 4, backgroundColor: 'rgba(170,160,187,0.15)' },
  chartToday: { backgroundColor: colors.lavender },
  chartHigh: { backgroundColor: 'rgba(224,112,112,0.5)' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  chartLabel: { fontSize: 9, color: colors.textMuted, flex: 1, textAlign: 'center' },
  copingTitle: { fontSize: 12, color: colors.textMuted, marginBottom: 8, fontWeight: '600' },
  copingItem: { fontSize: 13, color: colors.bone, marginBottom: 4, lineHeight: 20 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sliderLabel: { fontSize: 12, color: colors.textMuted, width: 36 },
  cravingVal: { fontSize: 12, color: colors.textMuted },
  cravingBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  cravingBadgeText: { fontSize: 11, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: 'transparent' },
  toggleActive: { backgroundColor: colors.surface2, borderColor: colors.lavender },
  toggleDanger: { backgroundColor: 'rgba(224,112,112,0.15)', borderColor: colors.danger },
  toggleText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  toggleTextActive: { color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.8)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 32, width: '85%', alignItems: 'center' },
  modalIcon: { fontSize: 48, marginBottom: 12, color: colors.lavender },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
});
