import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme';
import PeerBottomNav from './PeerBottomNav';

function getRiskInfo(score) {
  if (score <= 30) return { label: 'Low', color: colors.success };
  if (score <= 60) return { label: 'Moderate', color: colors.warning };
  return { label: 'High', color: colors.danger };
}

export default function PeerDashboardScreen({ navigation }) {
  const { currentUser, getConnectedVapeUser, getPendingRequestsForMe, respondToRequest, getUnreadCount } = useAuth();
  const connected = getConnectedVapeUser();
  const pendingRequests = getPendingRequestsForMe();
  const unread = getUnreadCount();
  const firstName = currentUser?.firstName || currentUser?.username || 'Supporter';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetSub}>Welcome back,</Text>
            <Text style={styles.greetName}>{firstName}!</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('PeerProfile')}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Pending connection requests */}
        {pendingRequests.map((req) => {
          const requester = req.fromUsername;
          return (
            <View key={req.id} style={styles.requestCard}>
              <Text style={styles.requestTitle}>Connection Request</Text>
              <Text style={styles.requestSub}><Text style={{ color: colors.lavender, fontWeight: '700' }}>{requester}</Text> wants to connect with you as their peer supporter.</Text>
              <View style={styles.requestBtns}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => respondToRequest(req.id, false)}>
                  <Text style={styles.rejectBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => respondToRequest(req.id, true)}>
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Connected vape user card */}
        {connected ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Connected User</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PeerMessaging')}>
                <Text style={styles.msgLink}>Message</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.connectedCard}>
              <View style={styles.connectedAvatar}>
                <Text style={styles.connectedAvatarText}>{(connected.firstName || connected.username)[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.connectedName}>{connected.firstName ? `${connected.firstName} ${connected.lastName}` : connected.username}</Text>
                <Text style={styles.connectedUsername}>@{connected.username}</Text>
              </View>
            </View>

            {/* Progress overview */}
            <Text style={styles.sectionTitle}>Their Progress</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressCard}>
                <Text style={styles.progressNum}>{connected.streak || 0}</Text>
                <Text style={styles.progressLbl}>Day Streak</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressNum}>{connected.totalPoints || 0}</Text>
                <Text style={styles.progressLbl}>Points</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressNum}>{connected.moodLogs?.length || 0}</Text>
                <Text style={styles.progressLbl}>Logs</Text>
              </View>
            </View>

            {/* Relapse risk */}
            {connected.moodLogs?.length > 0 && (() => {
              const risk = getRiskInfo(connected.lastRelapseRisk || 0);
              return (
                <View style={styles.riskCard}>
                  <View style={styles.riskHeader}>
                    <Text style={styles.riskTitle}>RELAPSE RISK</Text>
                    <View style={[styles.riskBadge, { backgroundColor: risk.color + '20' }]}>
                      <Text style={[styles.riskBadgeText, { color: risk.color }]}>{risk.label}</Text>
                    </View>
                  </View>
                  <View style={styles.riskBarWrap}>
                    <View style={[styles.riskThumb, { left: `${Math.min(95, connected.lastRelapseRisk || 0)}%` }]} />
                  </View>
                  <View style={styles.riskLabels}>
                    <Text style={styles.riskLabel}>Safe</Text>
                    <Text style={styles.riskLabel}>Moderate</Text>
                    <Text style={styles.riskLabel}>High</Text>
                  </View>
                </View>
              );
            })()}

            {/* Recent logs */}
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            {(connected.moodLogs || []).length === 0 ? (
              <View style={styles.emptyCard}><Text style={styles.emptyText}>No entries yet. Encourage them to log!</Text></View>
            ) : (
              [...(connected.moodLogs || [])].reverse().slice(0, 5).map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={[styles.moodDot, { backgroundColor: { Great: colors.success, Good: '#9FD08A', Okay: colors.warning, Bad: '#E09A70', Awful: colors.danger }[log.mood] || colors.textMuted }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logMood}>{log.mood} • Craving {log.craving}/10</Text>
                    <Text style={styles.logDate}>{log.date}</Text>
                  </View>
                  {log.vaped && <View style={styles.vapedBadge}><Text style={styles.vapedBadgeText}>Vaped</Text></View>}
                </View>
              ))
            )}

            {/* Disconnect */}
            <TouchableOpacity style={styles.disconnectBtn} onPress={() => navigation.navigate('PeerProfile')}>
              <Text style={styles.disconnectText}>Manage Connection</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* No connection — prompt to add peer */
          <View style={styles.noConnectionCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}></Text>
            <Text style={styles.noConnectionTitle}>No user connected yet</Text>
            <Text style={styles.noConnectionSub}>Connect with a Vape User to see their progress and support them on their journey.</Text>
            <TouchableOpacity style={styles.connectBtn} onPress={() => navigation.navigate('PeerProfile')}>
              <Text style={styles.connectBtnText}>Find & Connect</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <PeerBottomNav active="Dashboard" navigation={navigation} unread={unread} />
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
  requestCard: { backgroundColor: 'rgba(181,125,218,0.15)', borderWidth: 1.5, borderColor: colors.lavender, borderRadius: radius.lg, padding: 16, marginBottom: 14 },
  requestTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
  requestSub: { fontSize: 13, color: colors.textMuted, marginBottom: 14, lineHeight: 19 },
  requestBtns: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  rejectBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  acceptBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  acceptBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 },
  msgLink: { fontSize: 13, color: colors.lavender, fontWeight: '600' },
  connectedCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 16 },
  connectedAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.frenchBlue, alignItems: 'center', justifyContent: 'center' },
  connectedAvatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 18 },
  connectedName: { fontSize: 15, fontWeight: '700', color: colors.text },
  connectedUsername: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  progressCard: { flex: 1, backgroundColor: colors.cardSolid, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center' },
  progressNum: { fontSize: 22, fontWeight: '800', color: colors.lavender },
  progressLbl: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  riskCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 16 },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  riskTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  riskBadgeText: { fontSize: 12, fontWeight: '700' },
  riskBarWrap: { height: 8, borderRadius: 4, backgroundColor: '#333', marginVertical: 6, overflow: 'visible', position: 'relative' },
  riskThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.porcelain, top: -3, transform: [{ translateX: -7 }] },
  riskLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  riskLabel: { fontSize: 10, color: colors.textMuted },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  moodDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  logMood: { fontSize: 13, fontWeight: '600', color: colors.text },
  logDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  vapedBadge: { backgroundColor: 'rgba(224,112,112,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  vapedBadgeText: { fontSize: 11, color: colors.danger, fontWeight: '600' },
  disconnectBtn: { marginTop: 8, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 8 },
  disconnectText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  noConnectionCard: { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 28, alignItems: 'center', marginTop: 16 },
  noConnectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  noConnectionSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  connectBtn: { backgroundColor: colors.frenchBlue, paddingVertical: 13, paddingHorizontal: 28, borderRadius: radius.md },
  connectBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
  emptyCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  emptyText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
});
