import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Modal, Alert, Image,
} from 'react-native';
import { BottomNav } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function SupportScreen({ navigation }) {
  const {
    currentUser, getConnectedPeer,
    sendMessage, getMessages, getUnreadCount,
    disconnect, notifTick,
  } = useAuth();

  const peer = getConnectedPeer();
  const unread = getUnreadCount();
  const [msgText, setMsgText] = useState('');
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);
  const scrollRef = useRef(null);

  const messages = peer ? getMessages(peer.username) : [];
  const relationship = currentUser?.peerRelationship || 'Peer';

  const handleSend = () => {
    if (!msgText.trim() || !peer) return;
    sendMessage(peer.username, msgText.trim());
    setMsgText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // Fetch messages when peer changes
  useEffect(() => {
    if (peer) {
      getMessages(peer.username);
    }
  }, [peer?.username]);

  const handleDisconnect = () => {
    disconnect();
    setShowDisconnect(false);
    setShowDisconnected(true);
    setTimeout(() => setShowDisconnected(false), 2000);
  };

  // ── NO PEER ───────────────────────────────────────────────────────────────
  if (!peer) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Support</Text>

          <View style={styles.noPeerCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}></Text>
            <Text style={styles.noPeerTitle}>No peer connected yet</Text>
            <Text style={styles.noPeerSub}>
              A peer supporter can connect with you and see your progress to help you
              stay on track. Check your notifications for any pending invitations.
            </Text>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notifBtnText}>Check Notifications</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What is a Peer Supporter?</Text>
            <Text style={styles.infoText}>
              A peer supporter is someone you trust — a friend, family member, or partner —
              who can monitor your progress and reach out when you might need extra support.
            </Text>
          </View>
        </ScrollView>
        <BottomNav active="Support" navigation={navigation} unreadCount={unread} />
      </SafeAreaView>
    );
  }

  // ── PEER CONNECTED ────────────────────────────────────────────────────────
  const peerFullName = peer.firstName
    ? `${peer.firstName} ${peer.lastName}`.trim()
    : peer.username;
  const peerInitial = (peer.firstName || peer.username)[0]?.toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <Text style={styles.title}>Support</Text>

          {/* Peer info card */}
          <View style={styles.peerInfoCard}>
            <View style={styles.peerInfoTop}>
              <View style={styles.peerAvatar}>
                <Text style={styles.peerAvatarText}>{peerInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.peerNameRow}>
                  <Text style={styles.peerName}>{peerFullName}</Text>
                  <View style={styles.relBadge}>
                    <Text style={styles.relBadgeText}>{relationship}</Text>
                  </View>
                </View>
                <Text style={styles.peerUsername}>@{peer.username}</Text>
                <Text style={styles.peerRole}>Peer Supporter</Text>
              </View>
            </View>

            {/* Peer detail rows */}
            {peer.gender ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{peer.gender}</Text>
              </View>
            ) : null}
            {peer.birthday ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Birthday</Text>
                <Text style={styles.detailValue}>{peer.birthday}</Text>
              </View>
            ) : null}

            <View style={styles.sharingRow}>
              <Image source={require('../../assets/icons/locked.png')} style={styles.sharingIcon}/>
              <Text style={styles.sharingText}>
                Your progress is being shared with this supporter
              </Text>
            </View>

            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={() => setShowDisconnect(true)}
            >
              <Text style={styles.disconnectText}>Disconnect from this peer</Text>
            </TouchableOpacity>
          </View>

          {/* Chat section */}
          <Text style={styles.chatLabel}>Messages</Text>

          <View style={styles.chatBox}>
            {messages.length === 0 ? (
              <Text style={styles.noMsgs}>No messages yet. Say hello.</Text>
            ) : (
              messages.map((msg) => {
                const isMe = msg.fromUsername === currentUser.username;
                return (
                  <View
                    key={msg.id}
                    style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
                  >
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                      {msg.timestamp}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Message input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={msgText}
            onChangeText={setMsgText}
            placeholder={`Message ${peer.firstName || peer.username}...`}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !msgText.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!msgText.trim()}
          >
            <Text style={styles.sendIcon}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Disconnect confirm modal */}
        <Modal transparent visible={showDisconnect} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>
                Disconnect from{'\n'}
                <Text style={{ color: colors.lavender }}>{peerFullName}</Text>?
              </Text>
              <Text style={styles.modalSub}>
                They will no longer see your progress or receive notifications about you.
              </Text>
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalNo}
                  onPress={() => setShowDisconnect(false)}
                >
                  <Text style={styles.modalNoText}>No, keep</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalYes} onPress={handleDisconnect}>
                  <Text style={styles.modalYesText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Disconnected success */}
        <Modal transparent visible={showDisconnected} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, { alignItems: 'center' }]}>
              <Text style={styles.modalTitle}>Disconnected</Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      <BottomNav active="Support" navigation={navigation} unreadCount={unread} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingTop: spacing.lg, marginBottom: spacing.lg },

  // No peer
  noPeerCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 28, alignItems: 'center', marginBottom: 16,
  },
  noPeerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  noPeerSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  notifBtn: {
    backgroundColor: colors.frenchBlue, paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: radius.md,
  },
  notifBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
  infoCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 18, alignItems: 'center',
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Peer info card
  peerInfoCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 18, marginBottom: 18,
  },
  peerInfoTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  peerAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.frenchBlue,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border,
  },
  peerAvatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 20 },
  peerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  peerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  relBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  relBadgeText: { fontSize: 11, color: colors.lavender, fontWeight: '700' },
  peerUsername: { fontSize: 12, color: colors.textMuted },
  peerRole: { fontSize: 12, color: colors.lilacAsh, marginTop: 2 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  detailLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '500' },
  sharingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    backgroundColor: 'rgba(126,200,160,0.1)', borderRadius: radius.sm,
    padding: 10, borderWidth: 1, borderColor: 'rgba(126,200,160,0.3)',
  },
  sharingIcon: {
  width: 40,
  height: 40,
  resizeMode: 'contain',
  marginBottom: 10,
},
  sharingText: { fontSize: 12, color: colors.success, fontWeight: '500', flex: 1 },
  disconnectBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.danger + '50', alignItems: 'center',
  },
  disconnectText: { color: colors.danger, fontSize: 13, fontWeight: '600' },

  // Chat
  chatLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.8,
    color: colors.textMuted, textTransform: 'uppercase', marginBottom: 12,
  },
  chatBox: { gap: 6, marginBottom: 12 },
  noMsgs: {
    textAlign: 'center', color: colors.textMuted, fontSize: 14,
    paddingVertical: 24, fontStyle: 'italic',
  },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 2 },
  bubbleMe: {
    alignSelf: 'flex-end', backgroundColor: colors.frenchBlue,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: colors.porcelain },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,246,0.55)', textAlign: 'right' },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: 'rgba(18,8,40,0.9)',
  },
  input: {
    flex: 1, backgroundColor: colors.input, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: colors.text,
    fontSize: 14, borderWidth: 1, borderColor: colors.border, maxHeight: 100,
  },
  sendBtn: {
    width: 58, height: 42, borderRadius: 21, backgroundColor: colors.frenchBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: colors.porcelain, fontSize: 12, fontWeight: '800' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(10,5,25,0.82)',
    alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 28, width: '86%',
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800', color: colors.text,
    marginBottom: 10, lineHeight: 28,
  },
  modalSub: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalNo: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  modalNoText: { color: colors.textMuted, fontWeight: '600' },
  modalYes: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: '#5A1A1A', borderWidth: 1, borderColor: colors.danger, alignItems: 'center',
  },
  modalYesText: { color: colors.porcelain, fontWeight: '700' },
});
