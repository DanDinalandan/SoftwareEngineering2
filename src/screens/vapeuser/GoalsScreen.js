import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, TextInput, Alert, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from '../../components';
import { colors, spacing, radius } from '../../theme';

const icons = {
  noGoalCard: require('../../../assets/icons/goal.png'),
};

// Preset difficulty tiers
const PRESETS = [
  {
    id: 'light',
    label: 'Light',
    color: colors.easy,
    description: 'Best for first-timers. Gradual reduction.',
    dailyPuffLimit: 20,
    weeklyGoal: 'Reduce by 10%',
    tips: ['Track every puff', 'Delay your first puff by 30 min', 'Drink water instead of vaping'],
  },
  {
    id: 'moderate',
    label: 'Moderate',
    color: colors.medium,
    description: 'For users ready to cut down significantly.',
    dailyPuffLimit: 10,
    weeklyGoal: 'Reduce by 25%',
    tips: ['Set hourly limits', 'Identify your top triggers', 'Replace with breathing exercises'],
  },
  {
    id: 'hard',
    label: 'Hard',
    color: colors.hard,
    description: 'Aggressive reduction. For strong willpower.',
    dailyPuffLimit: 5,
    weeklyGoal: 'Reduce by 50%',
    tips: ['Keep your vape out of reach', 'Text your peer when craving hits', 'Use the 5-4-3-2-1 technique'],
  },
  {
    id: 'extreme',
    label: 'Quit Cold Turkey',
    color: colors.extreme,
    description: 'Zero tolerance. Complete cessation.',
    dailyPuffLimit: 0,
    weeklyGoal: '0 puffs per day',
    tips: ['Remove all vaping devices', 'Tell your support network today', 'Join the community forum'],
  },
  {
    id: 'custom',
    label: 'Custom',
    color: colors.frenchBlue,
    description: 'Set your own daily puff limit.',
    dailyPuffLimit: null,
    weeklyGoal: 'Your own pace',
    tips: ['Be realistic but ambitious', 'Review and adjust weekly'],
  },
];

function getDifficultyColor(puffLimit) {
  if (puffLimit === 0) return colors.extreme;
  if (puffLimit <= 5) return colors.hard;
  if (puffLimit <= 10) return colors.medium;
  return colors.easy;
}

export default function GoalsScreen({ navigation }) {
  const { currentUser, setGoal, getUnreadCount } = useAuth();
  const unreadCount = getUnreadCount();
  const activeGoal = currentUser?.goal || null;

  const [showDetail, setShowDetail] = useState(null); // preset object
  const [customPuffs, setCustomPuffs] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // preset to confirm

  const handleSelectPreset = (preset) => {
    if (preset.id === 'custom') {
      setShowCustomInput(true);
      setShowDetail(null);
    } else {
      setShowDetail(null);
      setShowConfirm(preset);
    }
  };

  const handleSetCustom = () => {
    const n = parseInt(customPuffs, 10);
    if (isNaN(n) || n < 0 || n > 200) {
      Alert.alert('Invalid', 'Enter a number between 0 and 200.');
      return;
    }
    const customPreset = {
      ...PRESETS.find((p) => p.id === 'custom'),
      dailyPuffLimit: n,
      weeklyGoal: `${n} puffs/day`,
    };
    setShowCustomInput(false);
    setShowConfirm(customPreset);
  };

  const handleConfirm = (preset) => {
    setGoal({
      presetId: preset.id,
      label: preset.label,
      dailyPuffLimit: preset.dailyPuffLimit,
      weeklyGoal: preset.weeklyGoal,
      tips: preset.tips,
      color: preset.color,
      setAt: new Date().toLocaleDateString(),
    });
    setShowConfirm(null);
  };

  const puffProgress = activeGoal
    ? (() => {
        const todayLog = currentUser?.moodLogs?.find(
          (l) => l.date === new Date().toISOString().split('T')[0]
        );
        const puffsToday = todayLog?.puffsToday ?? null;
        return puffsToday;
      })()
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Goal</Text>

        {/* Active goal banner */}
        {activeGoal ? (
          <View style={[styles.activeGoalCard, { borderColor: activeGoal.color + '80' }]}>
            <View style={styles.activeGoalTop}>
              <View style={[styles.activeGoalBadge, { backgroundColor: activeGoal.color + '20' }]}>
                <Text style={[styles.activeGoalBadgeText, { color: activeGoal.color }]}>
                  Active Goal
                </Text>
              </View>
              <Text style={styles.activeGoalSince}>Since {activeGoal.setAt}</Text>
            </View>
            <Text style={styles.activeGoalLabel}>{activeGoal.label}</Text>
            <Text style={styles.activeGoalLimit}>
              {activeGoal.dailyPuffLimit === 0
                ? 'Zero puffs per day'
                : `${activeGoal.dailyPuffLimit} puffs per day max`}
            </Text>
            <Text style={styles.activeGoalWeekly}>{activeGoal.weeklyGoal}</Text>

            {/* Daily puff progress bar */}
            {activeGoal.dailyPuffLimit > 0 && (
              <View style={styles.puffProgressWrap}>
                <View style={styles.puffProgressTrack}>
                  <View
                    style={[
                      styles.puffProgressFill,
                      {
                        width: `${Math.min(100, ((puffProgress ?? 0) / activeGoal.dailyPuffLimit) * 100)}%`,
                        backgroundColor: getDifficultyColor(activeGoal.dailyPuffLimit),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.puffProgressLabel}>
                  {puffProgress ?? 0} / {activeGoal.dailyPuffLimit} puffs today
                </Text>
              </View>
            )}

            {/* Tips */}
            <View style={styles.tipsWrap}>
              <Text style={styles.tipsTitle}>Tips for your goal</Text>
              {activeGoal.tips?.map((tip, i) => (
                <Text key={i} style={styles.tipItem}>• {tip}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.changeGoalBtn}
              onPress={() => setShowDetail(null)}
            >
              <Text style={styles.changeGoalText}>Change goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noGoalCard}>
            <Image source={icons.noGoalCard} style={styles.menuIconImg} />
            <Text style={styles.noGoalTitle}>No goal set yet</Text>
            <Text style={styles.noGoalSub}>
              Setting a daily puff limit helps structure your journey to quitting.
            </Text>
          </View>
        )}

        {/* Preset list */}
        <Text style={styles.sectionLabel}>
          {activeGoal ? 'Change goal' : 'Choose your difficulty'}
        </Text>

        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetCard,
              activeGoal?.presetId === preset.id && styles.presetCardActive,
              { borderLeftColor: preset.color, borderLeftWidth: 4 },
            ]}
            onPress={() => setShowDetail(preset)}
            activeOpacity={0.8}
          >
            <View style={styles.presetTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.presetTitleRow}>
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: preset.color + '25' }]}>
                    <Text style={[styles.diffBadgeText, { color: preset.color }]}>
                      {preset.dailyPuffLimit === null
                        ? 'Custom'
                        : preset.dailyPuffLimit === 0
                        ? '0 puffs/day'
                        : `only ${preset.dailyPuffLimit} puffs/day`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.presetDesc}>{preset.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Preset detail modal */}
      <Modal transparent visible={!!showDetail} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {showDetail && (
              <>
                <Text style={styles.modalEmoji}>{showDetail.emoji}</Text>
                <Text style={styles.modalTitle}>{showDetail.label}</Text>
                <Text style={styles.modalDesc}>{showDetail.description}</Text>
                <View style={[styles.limitBox, { borderColor: showDetail.color + '60' }]}>
                  <Text style={[styles.limitNum, { color: showDetail.color }]}>
                    {showDetail.dailyPuffLimit === null ? '?' : showDetail.dailyPuffLimit}
                  </Text>
                  <Text style={styles.limitLabel}>puffs per day</Text>
                </View>
                <Text style={styles.weeklyGoalText}>{showDetail.weeklyGoal}</Text>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDetail(null)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.selectBtn, { backgroundColor: showDetail.color }]}
                    onPress={() => handleSelectPreset(showDetail)}
                  >
                    <Text style={styles.selectBtnText}>Select</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom input modal */}
      <Modal transparent visible={showCustomInput} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Set Custom Limit</Text>
            <Text style={styles.modalDesc}>
              How many puffs per day is your goal? (0 = quit cold turkey)
            </Text>
            <TextInput
              style={styles.customInput}
              value={customPuffs}
              onChangeText={setCustomPuffs}
              placeholder="for example: 8"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCustomInput(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectBtn} onPress={handleSetCustom}>
                <Text style={styles.selectBtnText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Final confirm modal */}
      <Modal transparent visible={!!showConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {showConfirm && (
              <>
                <Text style={styles.modalTitle}>Set this goal?</Text>
                <Text style={styles.modalDesc}>
                  <Text style={{ color: showConfirm.color, fontWeight: '700' }}>
                    {showConfirm.label}:{' '}
                  </Text>
                  {showConfirm.dailyPuffLimit === 0
                    ? 'Zero puffs per day'
                    : `${showConfirm.dailyPuffLimit} puffs per day max`}
                </Text>
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowConfirm(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => handleConfirm(showConfirm)}
                  >
                    <Text style={styles.selectBtnText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomNav active="Goals" navigation={navigation} unreadCount={unreadCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingTop: spacing.lg, marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted,
    textTransform: 'uppercase', marginBottom: 12, marginTop: 8,
  },
  noGoalCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, padding: 28, alignItems: 'center', marginBottom: 20,
  },
  noGoalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  noGoalSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  activeGoalCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1.5,
    borderColor: colors.border, padding: 20, marginBottom: 20,
  },
menuIconImg: {
  width: 100,
  height: 100,
  resizeMode: 'contain',
  marginBottom: 12,
},
  activeGoalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  activeGoalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeGoalBadgeText: { fontSize: 11, fontWeight: '700' },
  activeGoalSince: { fontSize: 11, color: colors.textMuted },
  activeGoalLabel: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  activeGoalLimit: { fontSize: 14, color: colors.lavender, fontWeight: '600', marginBottom: 2 },
  activeGoalWeekly: { fontSize: 12, color: colors.textMuted, marginBottom: 14 },
  puffProgressWrap: { marginBottom: 14 },
  puffProgressTrack: { height: 8, backgroundColor: 'rgba(170,160,187,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  puffProgressFill: { height: '100%', borderRadius: 4 },
  puffProgressLabel: { fontSize: 11, color: colors.textMuted },
  tipsWrap: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, marginBottom: 14 },
  tipsTitle: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 },
  tipItem: { fontSize: 12, color: colors.textMuted, lineHeight: 20 },
  changeGoalBtn: {
    paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center',
  },
  changeGoalText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  presetCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: 16, marginBottom: 10, overflow: 'hidden',
  },
  presetCardActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  presetTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  presetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  presetLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  diffBadgeText: { fontSize: 10, fontWeight: '700' },
  presetDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.82)', alignItems: 'center', justifyContent: 'center' },
  modal: {
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 28, width: '88%',
  },
  modalEmoji: { fontSize: 40, marginBottom: 10, textAlign: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  limitBox: { alignItems: 'center', padding: 16, borderRadius: radius.md, borderWidth: 1, marginBottom: 12 },
  limitNum: { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  limitLabel: { fontSize: 12, color: colors.textMuted },
  weeklyGoalText: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textMuted, fontWeight: '600' },
  selectBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  selectBtnText: { color: colors.porcelain, fontWeight: '700' },
  customInput: {
    backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 12,
    color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center',
  },
});
