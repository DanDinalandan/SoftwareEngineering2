import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme';
import PeerBottomNav from './PeerBottomNav';

export default function PeerProfileScreen({ navigation }) {
  const { currentUser, getConnectedVapeUser, sendConnectionRequest, disconnect, logout, getUnreadCount } = useAuth();
  const connected = getConnectedVapeUser();
  const unread = getUnreadCount();

  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null); // { success, error }
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);

  const firstName = currentUser?.firstName || currentUser?.username || 'Peer';
  const lastName = currentUser?.lastName || '';
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'P';

  const handleSearch = () => {
    if (!searchUsername.trim()) return;
    const result = sendConnectionRequest(searchUsername.trim());
    setSearchResult(result);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDisconnect(false);
    setShowDisconnected(true);
    setTimeout(() => setShowDisconnected(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{firstName} {lastName}</Text>
        <Text style={styles.role}>Peer Supporter</Text>

        {/* Connected user section */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>CONNECTION</Text>
          {connected ? (
            <>
              <View style={styles.connRow}>
                <View style={styles.connAvatar}><Text style={styles.connAvatarText}>{(connected.firstName || connected.username)[0]?.toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connName}>{connected.firstName ? `${connected.firstName} ${connected.lastName}` : connected.username}</Text>
                  <Text style={styles.connUsername}>@{connected.username} • Vape User</Text>
                </View>
                <View style={styles.connectedBadge}><Text style={styles.connectedBadgeText}>Connected</Text></View>
              </View>
              <TouchableOpacity style={styles.disconnectBtn} onPress={() => setShowDisconnect(true)}>
                <Text style={styles.disconnectText}>Disconnect from this user</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.noConnText}>You are not connected to any Vape User yet.</Text>
              <Text style={styles.searchLabel}>Enter their username to send a request:</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={searchUsername}
                  onChangeText={(t) => { setSearchUsername(t); setSearchResult(null); }}
                  placeholder="@username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSearch}>
                  <Text style={styles.sendBtnText}>Send</Text>
                </TouchableOpacity>
              </View>
              {searchResult && (
                <Text style={[styles.searchFeedback, { color: searchResult.success ? colors.success : colors.danger }]}>
                  {searchResult.success ? '✓ Request sent!' : `✕ ${searchResult.error}`}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Menu */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          {[{ label:'Settings' }, { label:'About Us' }].map(m => (
            <TouchableOpacity key={m.label} style={styles.menuItem} onPress={() => Alert.alert(m.label, 'Coming soon!')}>
              <Text style={styles.menuIcon}>{m.icon}</Text>
              <Text style={styles.menuText}>{m.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Disconnect confirm */}
      <Modal transparent visible={showDisconnect} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Do you want to disconnect{'\n'}from this peer?</Text>
            <Text style={styles.modalSub}>They will no longer see your progress or receive notifications.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalNo} onPress={() => setShowDisconnect(false)}>
                <Text style={styles.modalNoText}>No</Text>
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
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Disconnected{'\n'}Successfully</Text>
          </View>
        </View>
      </Modal>

      <PeerBottomNav active="Profile" navigation={navigation} unread={unread} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingTop: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.frenchBlue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12, borderWidth: 2, borderColor: colors.border },
  avatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 28 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  role: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },
  sectionBox: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 14 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  connAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.frenchBlue, alignItems: 'center', justifyContent: 'center' },
  connAvatarText: { color: colors.porcelain, fontWeight: '800', fontSize: 16 },
  connName: { fontSize: 14, fontWeight: '700', color: colors.text },
  connUsername: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  connectedBadge: { backgroundColor: 'rgba(126,200,160,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(126,200,160,0.4)' },
  connectedBadgeText: { fontSize: 11, color: colors.success, fontWeight: '700' },
  disconnectBtn: { paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.danger + '60', alignItems: 'center' },
  disconnectText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  noConnText: { fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 19 },
  searchLabel: { fontSize: 12, color: colors.lilacAsh, marginBottom: 8, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11, color: colors.text, fontSize: 14 },
  sendBtn: { paddingHorizontal: 18, paddingVertical: 11, backgroundColor: colors.frenchBlue, borderRadius: radius.sm },
  sendBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
  searchFeedback: { fontSize: 13, marginTop: 8, fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon: { fontSize: 18 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
  menuArrow: { fontSize: 18, color: colors.textMuted },
  logoutBtn: { paddingVertical: 14, borderRadius: radius.md, backgroundColor: '#5A1A1A', borderWidth: 1, borderColor: colors.danger, alignItems: 'center', marginBottom: 16 },
  logoutText: { color: colors.porcelain, fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.8)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 28, width: '82%', alignItems: 'center', gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 26 },
  modalSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  modalNo: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modalNoText: { color: colors.textMuted, fontWeight: '600' },
  modalYes: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: '#5A1A1A', borderWidth: 1, borderColor: colors.danger, alignItems: 'center' },
  modalYesText: { color: colors.porcelain, fontWeight: '700' },
});
