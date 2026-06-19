import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from '../../components';
import { colors, spacing, radius } from '../../theme';

const RELATIONSHIPS = ['Friend', 'Family', 'Partner', 'Colleague', 'Other'];

const typeIcon = {
  connection_request: require('../../../assets/icons/alerts.png'),
  connection_accepted: require('../../../assets/icons/accepted.png'),
  connection_rejected: require('../../../assets/icons/rejected.png'),
  connection_removed: require('../../../assets/icons/rejected.png'),
  provider_connection_request: require('../../../assets/icons/alerts.png'),
  provider_connection_accepted: require('../../../assets/icons/accepted.png'),
  provider_connection_rejected: require('../../../assets/icons/rejected.png'),
  provider_connection_removed: require('../../../assets/icons/rejected.png'),
  provider_message: require('../../../assets/icons/report.png'),
  high_risk: require('../../../assets/icons/warning.png'),
  vaped: require('../../../assets/icons/broken-heart.png'),
};

export default function VapeUserNotificationsScreen({ navigation }) {
  const { currentUser, getNotifications, fetchNotifications, markAllRead, getUnreadCount, respondToRequest, respondToProviderRequest } = useAuth();
  const notifications = getNotifications();
  const unread = getUnreadCount();

  // State for accept flow
  const [pendingAccept, setPendingAccept] = useState(null); // { requestId, fromDisplayName }
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [showConfirmShare, setShowConfirmShare] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [respondedNotificationId, setRespondedNotificationId] = useState(null);
  // Tracks whether the initial/focus fetch is still in flight, separate from
  // the per-action `loading` above, so we can tell "still loading" apart
  // from "genuinely no notifications" in the render below.
  const [screenLoading, setScreenLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      // Guard: if currentUser hasn't hydrated yet (e.g. app opened cold
      // from a tapped push notification, or session restore is still in
      // flight), fetchNotifications() would silently no-op. Bail out here
      // instead of flipping screenLoading to false on an empty result —
      // the AuthContext-level effect (keyed on currentUser?.id) and the
      // 5s poll will pick it up once the user is ready, and this listener
      // will also re-run since currentUser?.id is in the deps below.
      if (!currentUser?.id) return;
      setScreenLoading(true);
      await fetchNotifications?.();
      if (mounted) setScreenLoading(false);
    };

    loadNotifications();
    const unsubscribeFocus = navigation.addListener('focus', loadNotifications);
    // Mark notifications read on the way OUT, not the way in — marking
    // them read immediately on focus risked the backend excluding them
    // from the very next fetch (poll tick or re-focus) before the user
    // ever actually saw them.
    const unsubscribeBlur = navigation.addListener('blur', () => {
      markAllRead?.();
    });

    return () => {
      mounted = false;
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, currentUser?.id]);

  const startAccept = (notif) => {
    setPendingAccept({ requestId: notif.requestId, fromDisplayName: notif.fromDisplayName || notif.fromUsername });
    setSelectedRelationship(null);
    setShowConfirmShare(false);
  };

  const handleRelationshipChosen = (rel) => {
    setSelectedRelationship(rel);
    setShowConfirmShare(true);
  };

  const handleConfirmShare = async () => {
    if (!pendingAccept || !selectedRelationship) return;
    setLoading(true);
    setError(null);
    try {
      await respondToRequest(pendingAccept.requestId, true, selectedRelationship);
      setRespondedNotificationId(pendingAccept.requestId);
      setShowConfirmShare(false);
      setPendingAccept(null);
      setSelectedRelationship(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err) {
      setError('Failed to accept request. Please try again.');
      console.error('Accept error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      await respondToRequest(requestId, false);
      setRespondedNotificationId(requestId);
    } catch (err) {
      setError('Failed to decline request. Please try again.');
      console.error('Decline error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderResponse = async (requestId, accept) => {
    setLoading(true);
    setError(null);
    try {
      await respondToProviderRequest(requestId, accept);
      setRespondedNotificationId(requestId);
      if (accept) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
      }
    } catch (err) {
      setError('Failed to respond to provider request. Please try again.');
      console.error('Provider response error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread} new</Text>
            </View>
          )}
        </View>

        {screenLoading && notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Loading notifications…</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              You'll be notified when a peer supporter or provider wants to connect.
            </Text>
          </View>
        ) : (
          <>
            {notifications.map((n) => {
              // Hide notification if it was just responded to
              if (respondedNotificationId === n.requestId || respondedNotificationId === n.providerRequestId) return null;
              return (
                <View
                  key={n.id}
                  style={[styles.notifCard, !n.read && styles.notifUnread]}
                >
                  <Image source={typeIcon[n.type] || require('../../../assets/icons/alerts.png')} style={styles.notifIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                    <Text style={styles.notifTime}>{n.timestamp}</Text>

                    {/* Accept/Decline buttons only for pending connection requests */}
                    {n.type === 'connection_request' && n.requestId && (
                      <View style={styles.reqBtns}>
                        <TouchableOpacity
                          style={[styles.declineBtn, loading && { opacity: 0.6 }]}
                          disabled={loading}
                          onPress={() => handleDecline(n.requestId)}
                        >
                          <Text style={styles.declineBtnText}>{loading ? '...' : 'Decline'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.acceptBtn, loading && { opacity: 0.6 }]}
                          disabled={loading}
                          onPress={() => startAccept(n)}
                        >
                          <Text style={styles.acceptBtnText}>{loading ? '...' : 'Accept'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {n.type === 'provider_connection_request' && n.providerRequestId && (
                      <View style={styles.reqBtns}>
                        <TouchableOpacity
                          style={[styles.declineBtn, loading && { opacity: 0.6 }]}
                          disabled={loading}
                          onPress={() => handleProviderResponse(n.providerRequestId, false)}
                        >
                          <Text style={styles.declineBtnText}>{loading ? '...' : 'Decline'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.acceptBtn, loading && { opacity: 0.6 }]}
                          disabled={loading}
                          onPress={() => handleProviderResponse(n.providerRequestId, true)}
                        >
                          <Text style={styles.acceptBtnText}>{loading ? '...' : 'Accept'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {error && (
              <View style={[styles.notifCard, { backgroundColor: '#ff6b6b20', borderColor: '#ff6b6b' }]}>
                <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>{error}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Step 1: Choose relationship type */}
      <Modal transparent visible={!!pendingAccept && !showConfirmShare} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Who is{'\n'}
              <Text style={{ color: colors.lavender }}>
                {pendingAccept?.fromDisplayName}
              </Text>{'\n'}to you?
            </Text>
            <Text style={styles.modalSub}>
              This helps personalise your experience.
            </Text>
            <View style={styles.relGrid}>
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relBtn,
                    selectedRelationship === rel && styles.relBtnActive,
                  ]}
                  onPress={() => handleRelationshipChosen(rel)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.relBtnText,
                    selectedRelationship === rel && styles.relBtnTextActive,
                  ]}>
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setPendingAccept(null)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Step 2: Confirm sharing progress */}
      <Modal transparent visible={showConfirmShare} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Share your progress?</Text>
            <Text style={styles.modalSub}>
              By accepting, your{' '}
              <Text style={{ color: colors.lavender, fontWeight: '700' }}>
                {selectedRelationship}
              </Text>{' '}
              <Text style={{ color: colors.lavender, fontWeight: '700' }}>
                {pendingAccept?.fromDisplayName}
              </Text>{' '}
              will be able to see your mood logs, streak, craving levels, and receive
              alerts if your relapse risk is high.
            </Text>
            <Text style={[styles.modalSub, { marginTop: 8, fontStyle: 'italic' }]}>
              Are you sure you want to continue?
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => { setShowConfirmShare(false); setPendingAccept(null); }}
              >
                <Text style={styles.declineBtnText}>No, cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleConfirmShare}>
                <Text style={styles.acceptBtnText}>Yes, share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { alignItems: 'center' }]}>
            <Text style={styles.modalTitle}>Connected!</Text>
            <Text style={styles.modalSub}>
              Your supporter can now see your progress and support you.
            </Text>
          </View>
        </View>
      </Modal>

      <BottomNav active="Notifications" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: spacing.lg, marginBottom: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  unreadBadge: {
    backgroundColor: colors.lavender + '30', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  unreadText: { fontSize: 12, color: colors.lavender, fontWeight: '700' },
  emptyCard: {
    alignItems: 'center', padding: 40, backgroundColor: colors.card,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  notifCard: {
    flexDirection: 'row', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10, alignItems: 'flex-start',
  },
  notifUnread: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  notifIcon: {
  width: 32,
  height: 32,
  resizeMode: 'contain',
},
  notifMsg: { fontSize: 13, color: colors.text, lineHeight: 19, marginBottom: 4 },
  notifTime: { fontSize: 11, color: colors.textMuted },
  reqBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  confirmBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  declineBtn: {
    flex: 1, paddingVertical: 11, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  declineBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  acceptBtn: {
    flex: 1, paddingVertical: 11, borderRadius: radius.md,
    backgroundColor: colors.frenchBlue, alignItems: 'center',
  },
  acceptBtnText: { color: colors.porcelain, fontSize: 14, fontWeight: '700' },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(10,5,25,0.82)',
    alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 28, width: '88%',
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800', color: colors.text,
    marginBottom: 10, lineHeight: 28,
  },
  modalSub: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 20 },
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  relBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  relBtnActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  relBtnText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  relBtnTextActive: { color: colors.lavender },
  cancelBtn: {
    paddingVertical: 12, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center',
  },
  cancelBtnText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});