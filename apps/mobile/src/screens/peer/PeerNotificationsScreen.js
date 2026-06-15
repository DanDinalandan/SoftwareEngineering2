import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme';
import PeerBottomNav from './PeerBottomNav';

const typeIcon = { high_risk: require('../../../assets/icons/warning.png'), vaped: require('../../../assets/icons/broken-heart.png'), connection_request: require('../../../assets/icons/alerts.png'), connection_accepted: require('../../../assets/icons/accepted.png'), connection_removed: require('../../../assets/icons/rejected.png') };

export default function PeerNotificationsScreen({ navigation }) {
  const { getNotifications, markAllRead, getUnreadCount, respondToRequest } = useAuth();
  const notifications = getNotifications();
  const unread = getUnreadCount();

  useEffect(() => { markAllRead(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unread} new</Text></View>}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Image source={typeIcon[n.type] || require('../../../assets/icons/alerts.png')} style={styles.notifIcon} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>You'll be notified when your connected user logs an entry.</Text>
          </View>
        ) : notifications.map((n) => (
          <View key={n.id} style={[styles.notifCard, !n.read && styles.notifUnread]}>
            <Image source={require('../../../assets/icons/alerts.png')} style={styles.notifIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.notifMsg}>{n.message}</Text>
              <Text style={styles.notifTime}>{n.timestamp}</Text>
              {n.type === 'connection_request' && n.requestId && (
                <View style={styles.reqBtns}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => respondToRequest(n.requestId, false)}>
                    <Text style={styles.rejectText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => respondToRequest(n.requestId, true)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <PeerBottomNav active="Notifications" navigation={navigation} unread={unread} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  unreadBadge: { backgroundColor: colors.lavender + '30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  unreadText: { fontSize: 12, color: colors.lavender, fontWeight: '700' },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  notifCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10, alignItems: 'flex-start' },
  notifUnread: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  notifIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  notifMsg: { fontSize: 13, color: colors.text, lineHeight: 19, marginBottom: 4 },
  notifTime: { fontSize: 11, color: colors.textMuted },
  reqBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rejectBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  rejectText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  acceptBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  acceptText: { color: colors.porcelain, fontSize: 13, fontWeight: '700' },
});
