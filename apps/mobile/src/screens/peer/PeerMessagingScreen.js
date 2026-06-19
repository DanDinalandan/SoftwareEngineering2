import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme';
import PeerBottomNav from './PeerBottomNav';

export default function PeerMessagingScreen({ navigation }) {
  const { currentUser, getConnectedVapeUser, sendMessage, getMessages, getUnreadCount, notifTick } = useAuth();
  const connected = getConnectedVapeUser();
  const unread = getUnreadCount();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  const messages = connected ? getMessages(connected.username) : [];

  const handleSend = () => {
    if (!text.trim() || !connected) return;
    sendMessage(connected.username, text);
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (!connected) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No connection yet</Text>
          <Text style={styles.emptyText}>Connect with a Vape User first to start messaging.</Text>
        </View>
        <PeerBottomNav active="Messaging" navigation={navigation} unread={unread} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{(connected.firstName || connected.username)[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.chatName}>{connected.firstName ? `${connected.firstName} ${connected.lastName}` : connected.username}</Text>
          <Text style={styles.chatSub}>@{connected.username} • Vape User</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <Text style={styles.noMessages}>No messages yet. Say hello.</Text>
          ) : messages.map((msg) => {
            const isMe = msg.fromUsername === currentUser.username;
            return (
              <View key={msg.id} style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
                <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{msg.timestamp}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim()}>
            <Text style={styles.sendIcon}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <PeerBottomNav active="Messaging" navigation={navigation} unread={unread} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(20,10,45,0.8)' },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.frenchBlue, alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 16 },
  chatName: { fontSize: 15, fontWeight: '700', color: colors.text },
  chatSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  messageList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: 16, gap: 8 },
  noMessages: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 40, fontStyle: 'italic' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 2 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.frenchBlue, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: colors.porcelain },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,246,0.6)', textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(20,10,45,0.8)' },
  input: { flex: 1, backgroundColor: colors.input, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border, maxHeight: 100 },
  sendBtn: { width: 58, height: 42, borderRadius: 21, backgroundColor: colors.frenchBlue, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: colors.porcelain, fontSize: 12, fontWeight: '800' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
