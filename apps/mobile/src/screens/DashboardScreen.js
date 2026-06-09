import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image,
} from 'react-native';
import { Card, BottomNav } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

// Relapse risk label + color based on score 0-100
function getRiskInfo(score) {
  if (score <= 30) return { label: 'Low', color: colors.success, pct: score };
  if (score <= 60) return { label: 'Moderate', color: colors.warning, pct: score };
  return { label: 'High', color: colors.danger, pct: score };
}

export default function DashboardScreen({ navigation }) {
  const { currentUser, getUnreadCount } = useAuth();
  const unreadCount = getUnreadCount();

  if (!currentUser) {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    return null;
  }

  const { firstName, role, streak = 0, totalPoints = 0, moodLogs = [], lastRelapseRisk = 0 } = currentUser;
  const initial = firstName ? firstName[0].toUpperCase() : '?';
  const isPeer = role === 'Peer';

  // Get top triggers from all logs
  const triggerCount = {};
  moodLogs.forEach((log) => {
    (log.triggers || []).forEach((t) => { triggerCount[t] = (triggerCount[t] || 0) + 1; });
  });
  const topTriggers = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);

  const risk = getRiskInfo(lastRelapseRisk);
  const thumbPct = `${Math.min(95, Math.max(5, risk.pct))}%`;
  const triggerIcons = {
  top: require('../../assets/icons/top-trigger.png'),
  second: require('../../assets/icons/second-trigger.png'),
};

  // ── PEER DASHBOARD ──────────────────────────────────────────────────────
  if (isPeer) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetSub}>Welcome,</Text>
              <Text style={styles.greetName}>{firstName}!</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{initial}</Text>
            </TouchableOpacity>
          </View>

          {/* Peer role card */}
          <View style={[styles.streakCard, { borderColor: 'rgba(181,125,218,0.5)' }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}></Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.lavender, marginBottom: 4 }}>Peer Supporter</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>
              Thank you for being someone's support. Your presence matters more than you know.
            </Text>
          </View>

          {/* Peer tools */}
          <Text style={styles.statLabel}>PEER TOOLS</Text>
          <TouchableOpacity style={styles.peerCard} onPress={() => navigation.navigate('Support')}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}></Text>
            <Text style={styles.peerCardTitle}>Chat with Users</Text>
            <Text style={styles.peerCardSub}>Connect and support someone on their journey</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.peerCard} onPress={() => navigation.navigate('Support')}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}></Text>
            <Text style={styles.peerCardTitle}>Peer Resources</Text>
            <Text style={styles.peerCardSub}>Learn how to effectively support others</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.peerCard} onPress={() => navigation.navigate('Support')}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}></Text>
            <Text style={styles.peerCardTitle}>Community</Text>
            <Text style={styles.peerCardSub}>Engage with the Unvapeify community</Text>
          </TouchableOpacity>

          <Card style={{ marginTop: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginBottom: 6 }}></Text>
            <Text style={{ fontSize: 13, color: colors.bone, fontStyle: 'italic', textAlign: 'center' }}>
              "Being a peer supporter is one of the most powerful things you can do."
            </Text>
          </Card>
        </ScrollView>
        <BottomNav active="Dashboard" navigation={navigation} unreadCount={unreadCount} />
      </SafeAreaView>
    );
  }

  // ── VAPE USER DASHBOARD ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetSub}>Are you feeling good today,</Text>
            <Text style={styles.greetName}>{firstName}?</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Card — tap to open calendar */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Calendar')}>
        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View>
              <Text style={styles.streakSubLabel}>VAPE-FREE STREAK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 }}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakUnit}>days smoke-free</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.streakPts}>{totalPoints}</Text>
              <Text style={styles.streakPtsLabel}>points</Text>
            </View>
          </View>
          <Text style={styles.streakQuote}>"Cravings are temporary. Freedom is forever."</Text>
          <Text style={{ fontSize: 10, color: colors.lavender, textAlign: 'right', marginTop: 6 }}>Tap to view calendar ›</Text>
        </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.statLabel}>TOTAL POINTS</Text>
            <Text style={styles.statNumber}>{totalPoints}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (totalPoints / 300) * 100)}%` }]} />
            </View>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={styles.statLabel}>DAYS LOGGED</Text>
            <Text style={[styles.statNumber, { color: colors.lavender }]}>{moodLogs.length}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (moodLogs.length / 30) * 100)}%`, backgroundColor: colors.lavender }]} />
            </View>
          </View>
        </View>

        {/* Relapse Risk — only meaningful after first log */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.statLabel}>RELAPSE RISK SCORE</Text>
            {moodLogs.length === 0 ? (
              <View style={styles.badgeNeutral}>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>No data yet</Text>
              </View>
            ) : (
              <View style={[styles.badgeNeutral, { backgroundColor: risk.color + '20', borderColor: risk.color + '50' }]}>
                <Text style={{ color: risk.color, fontSize: 12, fontWeight: '700' }}>{risk.label}</Text>
              </View>
            )}
          </View>
          <View style={styles.riskBar}>
            {moodLogs.length > 0 && (
              <View style={[styles.riskThumb, { left: thumbPct }]} />
            )}
          </View>
          <View style={styles.riskLabels}>
            <Text style={styles.riskLabel}>Safe</Text>
            <Text style={styles.riskLabel}>Moderate</Text>
            <Text style={styles.riskLabel}>High</Text>
          </View>
          {moodLogs.length === 0 && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' }}>
              Log your first entry to see your risk score.
            </Text>
          )}
        </Card>

        {/* Top Triggers — only after logs */}
        <Text style={styles.statLabel}>TOP TRIGGERS</Text>
        {moodLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No triggers logged yet. Log your first mood entry to track triggers.</Text>
          </View>
        ) : topTriggers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No triggers selected in your logs yet.</Text>
          </View>
        ) : (
          <View style={styles.triggerRow}>
            {topTriggers.map((t, i) => (
              <View key={t} style={styles.triggerCard}>
                <Image source={i === 0 ? triggerIcons.top : triggerIcons.second}
                style={styles.triggerIcon} />
                <Text style={styles.triggerName}>{t}</Text>
                <View style={i === 0 ? styles.badgeHigh : styles.badgeMod}>
                  <Text style={{ color: i === 0 ? colors.danger : colors.warning, fontSize: 11, fontWeight: '600' }}>
                    {i === 0 ? 'Top trigger' : '2nd trigger'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logBtn} onPress={() => navigation.navigate('Mood')}>
          <Text style={styles.logBtnText}>Log Today's Entry</Text>
        </TouchableOpacity>

      </ScrollView>
      <BottomNav active="Dashboard" navigation={navigation} unreadCount={unreadCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg },
  greetSub: { fontSize: 13, color: colors.textMuted },
  greetName: { fontSize: 22, fontWeight: '800', color: colors.text },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.frenchBlue, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  avatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 16 },
  streakCard: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: 'rgba(181,125,218,0.35)', borderRadius: radius.xl, padding: 22, marginBottom: 14 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  streakSubLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  streakNumber: { fontSize: 52, fontWeight: '800', color: colors.lavender, lineHeight: 58 },
  streakUnit: { fontSize: 16, color: colors.textMuted, paddingBottom: 8 },
  streakPts: { fontSize: 20, fontWeight: '800', color: colors.lavender },
  streakPtsLabel: { fontSize: 11, color: colors.textMuted },
  streakQuote: { fontSize: 12, color: colors.textDim, marginTop: 10, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', marginBottom: 14 },
  statCard: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  statNumber: { fontSize: 26, fontWeight: '800', color: colors.text },
  progressTrack: { height: 6, backgroundColor: 'rgba(170,160,187,0.2)', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.frenchBlue },
  riskBar: { height: 8, borderRadius: 4, overflow: 'visible', position: 'relative', marginVertical: 8, backgroundColor: 'transparent',
    borderWidth: 0,
    // gradient-like via separate views
  },
  riskBarBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 4 },
  riskThumb: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.porcelain, top: -4, transform: [{ translateX: -8 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  riskLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  riskLabel: { fontSize: 10, color: colors.textMuted },
  badgeNeutral: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(170,160,187,0.15)', borderWidth: 1, borderColor: 'rgba(170,160,187,0.3)' },
  triggerRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  triggerCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  triggerIcon: { width: 32, height: 32, resizeMode: 'contain', marginBottom: 6, },
  triggerName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  badgeHigh: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(224,112,112,0.15)' },
  badgeMod: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(240,192,112,0.15)' },
  emptyCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, marginBottom: 14 },
  emptyText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  logBtn: { backgroundColor: colors.frenchBlue, paddingVertical: 15, borderRadius: radius.md, alignItems: 'center', shadowColor: colors.lavender, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  logBtnText: { color: colors.porcelain, fontSize: 15, fontWeight: '700' },
  peerCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  peerCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  peerCardSub: { fontSize: 13, color: colors.textMuted },
});
