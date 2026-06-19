import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image,
} from 'react-native';
import { BottomNav } from '../components';
import { useAuth } from '../context/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { colors, spacing, radius } from '../theme';

const rewardIcons = {
  'first-step': require('../../assets/icons/first-step.png'),
  '3-day': require('../../assets/icons/3-day.png'),
  'one-week': require('../../assets/icons/one-week.png'),
  'two-weeks': require('../../assets/icons/two-weeks.png'),
  'one-month': require('../../assets/icons/one-month.png'),
  'hundred-days': require('../../assets/icons/hundred-days.png'),
  calendar: require('../../assets/icons/calendar.png'),
  goal: require('../../assets/icons/goal.png'),
  support: require('../../assets/icons/support.png'),
};

const FILTERS = ['All', 'Unlocked', 'Locked'];
const statusIcons = {
  unlocked: require('../../assets/icons/accepted.png'),
  locked: require('../../assets/icons/locked.png'),
};
export default function RewardsScreen({ navigation }) {
  const { currentUser, getUnreadCount, getRewardDefs, fetchRewards } = useAuth();
  const unreadCount = getUnreadCount();
  const totalPoints = currentUser?.totalPoints || 0;
  const streak = currentUser?.streak || 0;
  const rewards = getRewardDefs();
  const [activeFilter, setActiveFilter] = useState('All');
  const { refreshControl } = usePullToRefresh(fetchRewards);

  useEffect(() => {
    fetchRewards();
  }, []);

  const filtered = rewards.filter((r) => {
    if (activeFilter === 'Unlocked') return r.unlocked;
    if (activeFilter === 'Locked') return !r.unlocked;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Rewards</Text>
        </View>

        <View style={styles.pointsRow}>
          <View>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsBig}>{totalPoints} pts</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.pointsLabel}>Streak</Text>
            <Text style={[styles.pointsBig, { color: colors.lavender }]}>{streak} days</Text>
          </View>
        </View>

        <View style={styles.pillRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, activeFilter === f && styles.pillActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, activeFilter === f && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.map((r) => {
          const unlocked = r.unlocked;
          const progress = r.progressPercent ?? 0;
          return (
            <View key={r.name} style={styles.rewardCard}>
              <Image source={rewardIcons[r.icon] || rewardIcons.goal} style={styles.rewardIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardName}>{r.name}</Text>
                <Text style={styles.rewardDesc}>{r.desc}</Text>
                <Text style={styles.rewardPts}>{r.progress || 0}/{r.target || 1} progress - {r.pts} pts reward</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
              <Image source={unlocked ? statusIcons.unlocked : statusIcons.locked} style={styles.rewardStatusIcon}/>
            </View>
          );
        })}
      </ScrollView>
      <BottomNav active="Rewards" navigation={navigation} unreadCount={unreadCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  headerRow: { paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  pointsLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2, fontWeight: '600' },
  pointsBig: { fontSize: 22, fontWeight: '800', color: colors.text },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid },
  pillActive: { backgroundColor: colors.lavender, borderColor: colors.lavender },
  pillText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  pillTextActive: { color: colors.porcelain },
  rewardCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 10 },
  rewardIcon: { width: 48, height: 48, resizeMode: 'contain', },
  rewardName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  rewardDesc: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  rewardPts: { fontSize: 11, color: colors.lilacAsh, marginBottom: 6 },
  progressTrack: { height: 5, backgroundColor: 'rgba(170,160,187,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.lavender },
  rewardStatusIcon: { width: 20, height: 20, resizeMode: 'contain', },
  unlocked: { color: colors.success },
  locked: { color: colors.textMuted },
});
