import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Modal, Switch, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { colors, spacing, radius } from '../../theme';

export default function SecurityScreen({ navigation }) {
  const { currentUser, updatePhone, update2FA, verify2FA, resetProgress, deleteAccount } = useAuth();
  const { refreshControl } = usePullToRefresh();

  const [twoFAEnabled, setTwoFAEnabled] = useState(currentUser?.twoFAEnabled || false);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // 2FA verification flow states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [sentCode, setSentCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggle2FA = async (val) => {
    if (!currentUser?.phone && !phone) {
      setPhoneError('Add a phone number first to enable 2FA.');
      return;
    }
    if (val) {
      const result = await update2FA(true, phone);
      if (!result?.success) {
        setPhoneError(result?.error || 'Could not send OTP.');
        return;
      }
      setSentCode(result.devOtp || '');
      setEnteredCode('');
      setCodeError('');
      setShow2FAModal(true);
    } else {
      setTwoFAEnabled(false);
      update2FA && update2FA(false);
    }
  };

  const handleVerifyCode = async () => {
    const result = await verify2FA(enteredCode);
    if (!result?.success) {
      setCodeError(result?.error || 'Incorrect code. Please try again.');
      return;
    }
    setTwoFAEnabled(true);
    setShow2FAModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleSavePhone = () => {
    const cleaned = tempPhone.replace(/\s/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
      setPhoneError('Enter a valid phone number (e.g. +639171234567)');
      return;
    }
    setPhone(cleaned);
    setPhoneError('');
    setEditingPhone(false);
    updatePhone && updatePhone(cleaned);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset progress?',
      'This clears your streak, points, mood logs, rewards, and active goal. Your account and peer connection will stay active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const result = resetProgress && resetProgress();
            if (result?.success) {
              Alert.alert('Progress reset', 'Your recovery progress has been cleared.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes this account, progress, messages, notifications, and peer connection from this demo store.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const result = deleteAccount && deleteAccount();
            if (result?.success) {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Account Security</Text>
        </View>

        {/* Phone number section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Phone Number</Text>
          <Text style={styles.sectionDesc}>
            Used for two-factor authentication and account recovery.
          </Text>
          {editingPhone ? (
            <>
              <TextInput
                style={styles.phoneInput}
                value={tempPhone}
                onChangeText={setTempPhone}
                placeholder="+639171234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                autoFocus
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              <View style={styles.phoneBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setEditingPhone(false); setPhoneError(''); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSavePhone}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneValue}>
                {phone || 'No phone number added'}
              </Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => { setTempPhone(phone); setEditingPhone(true); setPhoneError(''); }}
              >
                <Text style={styles.editBtnText}>{phone ? 'Change' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2FA toggle section */}
        <View style={styles.sectionCard}>
          <View style={styles.twoFARow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
              <Text style={styles.sectionDesc}>
                Every login will require a 6-digit code sent to your phone.
              </Text>
            </View>
            <Switch
              value={twoFAEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: colors.border, true: colors.lavender }}
              thumbColor={twoFAEnabled ? colors.porcelain : colors.lilacAsh}
            />
          </View>
          {twoFAEnabled && (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledText}>2FA is active on your account</Text>
            </View>
          )}
          {!phone && (
            <Text style={styles.warningText}>
              Add a phone number above to enable 2FA.
            </Text>
          )}
        </View>

        <View style={[styles.sectionCard, styles.dangerCard]}>
          <Text style={styles.dangerTitle}>Account controls</Text>
          <Text style={styles.sectionDesc}>
            Reset your recovery data for a fresh start, or delete the account entirely.
          </Text>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetProgress}>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Reset progress</Text>
              <Text style={styles.controlDesc}>Clear logs, streak, points, rewards, and goal.</Text>
            </View>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Delete account</Text>
              <Text style={styles.controlDesc}>Remove this account and disconnect supporters.</Text>
            </View>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP verification modal */}
      <Modal transparent visible={show2FAModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Verify your phone</Text>
            <Text style={styles.modalDesc}>
              A 6-digit code has been sent to{'\n'}
              <Text style={{ color: colors.lavender, fontWeight: '700' }}>
                {phone}
              </Text>
            </Text>
            {/* DEV HINT — remove in production */}
            <View style={styles.devHint}>
              <Text style={styles.devHintText}>
                Demo OTP: {sentCode || 'sent by SMS'}
              </Text>
            </View>
            <TextInput
              style={styles.otpInput}
              value={enteredCode}
              onChangeText={(t) => { setEnteredCode(t); setCodeError(''); }}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
            />
            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShow2FAModal(false); setEnteredCode(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode}>
                <Text style={styles.verifyBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => {
                handleToggle2FA(true);
              }}
            >
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { alignItems: 'center' }]}>
            <Text style={styles.modalTitle}>Number Enabled!</Text>
            <Text style={styles.modalDesc}>Your account is now more secure.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: 10 },
  backArrow: { fontSize: 28, color: colors.lilacAsh },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sectionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: 18, marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.sm,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  editBtnText: { fontSize: 13, color: colors.lavender, fontWeight: '600' },
  phoneInput: {
    backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11,
    color: colors.text, fontSize: 15, marginBottom: 8,
  },
  phoneBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontWeight: '700' },
  saveBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  saveBtnText: { color: colors.porcelain, fontWeight: '700' },
  twoFARow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  enabledBadge: {
    marginTop: 12, backgroundColor: 'rgba(126,200,160,0.15)', borderRadius: radius.sm,
    borderWidth: 1, borderColor: 'rgba(126,200,160,0.35)', padding: 8,
  },
  enabledText: { fontSize: 13, color: colors.success, fontWeight: '600', textAlign: 'center' },
  warningText: { fontSize: 12, color: colors.warning, marginTop: 10 },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  dangerCard: { borderColor: 'rgba(224,112,112,0.45)', backgroundColor: 'rgba(224,112,112,0.08)' },
  dangerTitle: { fontSize: 15, fontWeight: '800', color: colors.danger, marginBottom: 4 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cardSolid, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 12, marginBottom: 10,
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(224,112,112,0.12)', borderRadius: radius.md, borderWidth: 1,
    borderColor: 'rgba(224,112,112,0.45)', padding: 12,
  },
  controlTitle: { fontSize: 14, color: colors.text, fontWeight: '700', marginBottom: 2 },
  controlDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  resetBtnText: { fontSize: 13, color: colors.warning, fontWeight: '800' },
  deleteBtnText: { fontSize: 13, color: colors.danger, fontWeight: '800' },
  infoBox: {
    backgroundColor: 'rgba(181,125,218,0.1)', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.82)', alignItems: 'center', justifyContent: 'center' },
  modal: {
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, padding: 28, width: '88%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 16, textAlign: 'center' },
  devHint: {
    backgroundColor: 'rgba(240,192,112,0.15)', borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.warning + '40', padding: 8, marginBottom: 12,
  },
  devHintText: { fontSize: 13, color: colors.text, textAlign: 'center', fontWeight: '800' },
  otpInput: {
    backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.lavender, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.text, fontSize: 28, fontWeight: '800',
    textAlign: 'center', letterSpacing: 12, marginBottom: 8,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  verifyBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.frenchBlue, alignItems: 'center' },
  verifyBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 15 },
  resendText: { fontSize: 13, color: colors.lavender, fontWeight: '600' },
});
