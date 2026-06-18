import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components';
import { colors, spacing, radius } from '../theme';

const icons = {
  birthday: require('../../assets/icons/birthday.png'),
  phone: require('../../assets/icons/phone.png'),
  goal: require('../../assets/icons/goal.png'),
  security: require('../../assets/icons/locked.png'),
  settings: require('../../assets/icons/settings.png'),
  about: require('../../assets/icons/about.png'),
  report: require('../../assets/icons/report.png'),
};

function getStreakColor(streak) {
  if (streak >= 30) return colors.progressExcellent;
  if (streak >= 14) return colors.progressGood;
  if (streak >= 7)  return colors.progressFair;
  if (streak >= 3)  return colors.progressPoor;
  return colors.progressCritical;
}

function getRiskColor(risk) {
  if (risk <= 20) return colors.progressExcellent;
  if (risk <= 40) return colors.progressGood;
  if (risk <= 60) return colors.progressFair;
  if (risk <= 80) return colors.progressPoor;
  return colors.progressCritical;
}

function getRiskLabel(risk) {
  if (risk <= 20) return 'Excellent';
  if (risk <= 40) return 'Good';
  if (risk <= 60) return 'Fair';
  if (risk <= 80) return 'At Risk';
  return 'Critical';
}

export default function ProfileScreen({ navigation }) {
  const { currentUser, logout, getUnreadCount } = useAuth();
  const unreadCount = getUnreadCount();

  if (!currentUser) return null;

  const {
    firstName, lastName, role, streak = 0, totalPoints = 0,
    moodLogs = [], lastRelapseRisk = 0, goal, birthday, gender, phone, daysLogged,
  } = currentUser;

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const vapeFreeCount = moodLogs.filter((l) => !l.vaped).length;
  const vapedCount    = moodLogs.filter((l) => l.vaped).length;
  const totalLogged   = daysLogged ?? moodLogs.length;
  const savedLogs     = moodLogs.length;
  const vapeFreeRate  = totalLogged > 0 ? Math.round((vapeFreeCount / totalLogged) * 100) : 0;
  const avgCraving    = totalLogged > 0
    ? (moodLogs.reduce((s, l) => s + (l.craving || 0), 0) / totalLogged).toFixed(1)
    : '—';

  const moodCounts = moodLogs.reduce((acc, l) => {
    acc[l.mood] = (acc[l.mood] || 0) + 1; return acc;
  }, {});
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const streakColor  = getStreakColor(streak);
  const riskColor    = getRiskColor(lastRelapseRisk);
  const riskLabel    = getRiskLabel(lastRelapseRisk);
  const progressLabel = vapeFreeRate >= 80 ? 'Strong overall progress'
    : vapeFreeRate >= 60 ? 'Good overall progress'
    : vapeFreeRate >= 40 ? 'Mixed overall progress'
    : totalLogged > 0 ? 'Early progress'
    : 'No check-ins yet';
  const progressSummary = totalLogged > 0
    ? `${vapeFreeCount} of ${savedLogs || totalLogged} recent check-ins were vape-free.`
    : 'Start logging to build your progress history.';
  const riskSummary = lastRelapseRisk > 0
    ? 'Based on your latest check-in.'
    : 'Log today to see your current risk.';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Avatar + name */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName || 'No name set'}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{role}</Text>
          </View>
          <View style={styles.heroDetails}>
            {gender ? <Text style={styles.heroDetail}>{gender}</Text> : null}
            {birthday ? (
              <View style={styles.heroDetailRow}>
                <Image source={icons.birthday} style={styles.smallIcon} />
                <Text style={styles.heroDetail}>{birthday}</Text>
              </View>
            ) : null}
            {phone ? (
              <View style={styles.heroDetailRow}>
                <Image source={icons.phone} style={styles.smallIcon} />
                <Text style={styles.heroDetail}>{phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Active goal */}
        {goal && (
          <View style={[styles.goalCard, { borderColor: goal.color + '70' }]}>
            <Text style={styles.goalCardLabel}>Active Goal</Text>
            <Text style={[styles.goalCardName, { color: goal.color }]}>{goal.label}</Text>
            <Text style={styles.goalCardLimit}>
              {goal.dailyPuffLimit === 0 ? 'Zero puffs per day' : `${goal.dailyPuffLimit} puffs/day`}
            </Text>
          </View>
        )}

        {/* Progress snapshot */}
        <Text style={styles.sectionLabel}>Progress Snapshot</Text>
        <Text style={styles.sectionIntro}>
          Your all-time recovery progress from every check-in. For this week's patterns and advice, open Weekly Report.
        </Text>

        {/* Streak + risk row */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: streakColor + '60' }]}>
            <Text style={[styles.statBigNum, { color: streakColor }]}>{streak}</Text>
            <Text style={styles.statBigLabel}>Current Streak</Text>
            <View style={[styles.statusBadge, { backgroundColor: streakColor + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: streakColor }]}>
                {streak >= 30 ? 'Excellent' : streak >= 14 ? 'Great' : streak >= 7 ? 'Good' : streak >= 1 ? 'Building' : 'Start now'}
              </Text>
            </View>
            <Text style={styles.statHelp}>Consecutive vape-free days.</Text>
          </View>
          <View style={[styles.statCard, { borderColor: riskColor + '60' }]}>
            <Text style={[styles.statBigNum, { color: riskColor }]}>
              {lastRelapseRisk > 0 ? `${lastRelapseRisk}%` : '—'}
            </Text>
            <Text style={styles.statBigLabel}>Current Risk</Text>
            {lastRelapseRisk > 0 && (
              <View style={[styles.statusBadge, { backgroundColor: riskColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: riskColor }]}>{riskLabel}</Text>
              </View>
            )}
            <Text style={styles.statHelp}>{riskSummary}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{progressLabel}</Text>
          <Text style={styles.progressText}>{progressSummary}</Text>
        </View>

        {/* Detailed stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.miniStat}>
            <Text style={styles.miniNum}>{totalPoints}</Text>
            <Text style={styles.miniLabel}>Points Earned</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniNum, { color: colors.progressExcellent }]}>{vapeFreeCount}</Text>
            <Text style={styles.miniLabel}>Clean Days</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniNum, { color: vapedCount > 0 ? colors.progressCritical : colors.text }]}>
              {vapedCount}
            </Text>
            <Text style={styles.miniLabel}>Vape Days</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniNum}>{totalLogged}</Text>
            <Text style={styles.miniLabel}>Check-ins</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[
              styles.miniNum,
              {
                color: vapeFreeRate >= 80 ? colors.progressExcellent
                  : vapeFreeRate >= 60 ? colors.progressGood
                  : vapeFreeRate >= 40 ? colors.progressFair
                  : colors.progressCritical,
              },
            ]}>
              {vapeFreeRate > 0 ? `${vapeFreeRate}%` : '—'}
            </Text>
            <Text style={styles.miniLabel}>Clean-Day Rate</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniNum}>{avgCraving}</Text>
            <Text style={styles.miniLabel}>Usual Craving</Text>
          </View>
        </View>

        {/* Vape-free rate bar */}
        {totalLogged > 0 && (
          <View style={styles.rateBarCard}>
            <View style={styles.rateBarHeader}>
              <Text style={styles.rateBarLabel}>Overall Clean-Day Rate</Text>
              <Text style={[
                styles.rateBarPct,
                { color: vapeFreeRate >= 60 ? colors.progressGood : colors.progressCritical },
              ]}>
                {vapeFreeRate}%
              </Text>
            </View>
            <View style={styles.rateBarTrack}>
              <View style={[styles.rateBarFill, {
                width: `${vapeFreeRate}%`,
                backgroundColor: vapeFreeRate >= 80 ? colors.progressExcellent
                  : vapeFreeRate >= 60 ? colors.progressGood
                  : vapeFreeRate >= 40 ? colors.progressFair
                  : colors.progressCritical,
              }]} />
            </View>
            <Text style={styles.rateBarNote}>
              This compares every vape-free check-in with every check-in you have saved.
            </Text>
            <Text style={styles.topMoodText}>
              Mood you log most: <Text style={{ color: colors.lavender, fontWeight: '700' }}>{topMood}</Text>
            </Text>
          </View>
        )}

        {/* Menu items */}
        <Text style={styles.sectionLabel}>Account</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('WeeklyReport')}
          >
            <Image source={icons.report} style={styles.menuIconImg} />
            <Text style={styles.menuText}>Weekly Report</Text>
            <Text style={[styles.menuMeta, { color: colors.lavender }]}>View insights</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Goals')}
          >
            <Image source={icons.goal} style={styles.menuIconImg} />
            <Text style={styles.menuText}>My Goal</Text>
            {goal && (
              <Text style={[styles.menuMeta, { color: goal.color }]}>{goal.label}</Text>
            )}
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Security')}
          >
            <Image source={icons.security} style={styles.menuIconImg} />
            <Text style={styles.menuText}>Account Security</Text>
            {currentUser?.twoFAEnabled && (
              <Text style={[styles.menuMeta, { color: colors.success }]}>2FA On</Text>
            )}
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Settings', 'Coming soon!')}
          >
            <Image source={icons.settings} style={styles.menuIconImg} />
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('About', 'Coming soon!')}
          >
            <Image source={icons.about} style={styles.menuIconImg} />
            <Text style={styles.menuText}>About Us</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="Profile" navigation={navigation} unreadCount={unreadCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.md, gap: 10 },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 28, color: colors.lilacAsh },
  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.text },

  smallIcon: {
  width: 16,
  height: 16,
  resizeMode: 'contain',
  marginRight: 4,
},

heroDetailRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
},

menuIconImg: {
  width: 22,
  height: 22,
  resizeMode: 'contain',
},
  // Hero
  heroCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, padding: 24, alignItems: 'center', marginBottom: 14,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.frenchBlue,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: colors.lavender + '60',
  },
  avatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 32 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 2 },
  username: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  rolePill: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.full,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  rolePillText: { fontSize: 12, color: colors.lavender, fontWeight: '700' },
  heroDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  heroDetail: { fontSize: 12, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  // Goal card
  goalCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5,
    padding: 14, marginBottom: 14,
  },
  goalCardLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  goalCardName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  goalCardLimit: { fontSize: 13, color: colors.textMuted },

  // Stats
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted,
    textTransform: 'uppercase', marginBottom: 10, marginTop: 8,
  },
  sectionIntro: {
    fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: -4, marginBottom: 12,
  },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1.5, padding: 16, alignItems: 'center',
  },
  statBigNum: { fontSize: 32, fontWeight: '800', lineHeight: 36 },
  statBigLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statHelp: { fontSize: 10, color: colors.textMuted, lineHeight: 14, marginTop: 8, textAlign: 'center' },

  progressCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 14, marginBottom: 10,
  },
  progressTitle: { fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 4 },
  progressText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10,
  },
  miniStat: {
    width: '31%', backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center',
  },
  miniNum: { fontSize: 18, fontWeight: '800', color: colors.text },
  miniLabel: { fontSize: 10, color: colors.textMuted, marginTop: 3, textAlign: 'center', lineHeight: 14 },
  miniHelp: { fontSize: 9, color: colors.lilacAsh, marginTop: 2, textAlign: 'center', lineHeight: 12 },

  rateBarCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: 16, marginBottom: 14,
  },
  rateBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rateBarLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  rateBarPct: { fontSize: 14, fontWeight: '800' },
  rateBarTrack: { height: 8, backgroundColor: 'rgba(170,160,187,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  rateBarFill: { height: '100%', borderRadius: 4 },
  rateBarNote: { fontSize: 11, color: colors.textMuted, lineHeight: 16, marginBottom: 8 },
  topMoodText: { fontSize: 12, color: colors.textMuted },

  menuCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden', marginBottom: 14,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuIcon: { fontSize: 18 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
  menuMeta: { fontSize: 12, fontWeight: '600' },
  menuArrow: { fontSize: 18, color: colors.textMuted },
  menuDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },

  logoutBtn: {
    paddingVertical: 14, borderRadius: radius.md, backgroundColor: '#5A1A1A',
    borderWidth: 1, borderColor: colors.danger, alignItems: 'center', marginBottom: 16,
  },
  logoutText: { color: colors.porcelain, fontWeight: '700', fontSize: 15 },
});
