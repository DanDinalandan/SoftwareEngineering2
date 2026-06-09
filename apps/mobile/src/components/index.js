import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

// ─── Primary Button ─────────────────────────────────────────────────────────
export function PrimaryButton({ title, onPress, loading = false, style }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.porcelain} />
      ) : (
        <Text style={styles.primaryBtnText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Secondary Button ────────────────────────────────────────────────────────
export function SecondaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryBtn, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── Selection Button ────────────────────────────────────────────────────────
export function SelectionButton({ title, subtitle, emoji, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.selectionBtn, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {emoji ? <Text style={styles.selEmoji}>{emoji}</Text> : null}
      <Text style={styles.selectionBtnText}>{title}</Text>
      {subtitle ? <Text style={styles.selSubtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Danger Button ───────────────────────────────────────────────────────────
export function DangerButton({ title, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.dangerBtn, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.primaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────
export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  editable = true,
  autoCapitalize = 'none',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputContainer, error ? styles.inputError : null, !editable && styles.inputDisabledContainer]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || ''}
          placeholderTextColor={colors.lilacAsh + '80'}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Logo Box ────────────────────────────────────────────────────────────────
export function LogoBox({ size = 110 }) {
  return (
    <View style={[styles.logoBox, { width: size, height: size, borderRadius: radius.md }]}>
      <Text style={styles.logoStar}>✦</Text>
    </View>
  );
}

// ─── Bottom Nav ──────────────────────────────────────────────────────────────
export function BottomNav({ active, navigation, unreadCount = 0 }) {
  const tabs = [
  {
    key: 'Dashboard',
    icon: require('../../assets/icons/home.png'),
    label: 'Home',
    screen: 'VapeUserDashboard',
  },
  {
    key: 'Mood',
    icon: require('../../assets/icons/mood.png'),
    label: 'Mood',
    screen: 'Mood',
  },
  {
    key: 'Notifications',
    icon: require('../../assets/icons/alerts.png'),
    label: 'Alerts',
    screen: 'Notifications',
  },
  {
    key: 'Rewards',
    icon: require('../../assets/icons/rewards.png'),
    label: 'Rewards',
    screen: 'Rewards',
  },
  {
    key: 'Support',
    icon: require('../../assets/icons/support.png'),
    label: 'Support',
    screen: 'Support',
  },
];
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.navItem, active === tab.key && styles.navItemActive]}
          onPress={() => navigation.navigate(tab.screen || tab.key)}
          activeOpacity={0.7}
        >
{tab.key === 'Notifications' && unreadCount > 0 ? (
  <View>
    <Image
      source={tab.icon}
      style={styles.navIcon}
      resizeMode="contain"
    />
    <View style={styles.navBadge}>
      <Text style={styles.navBadgeText}>{unreadCount}</Text>
    </View>
  </View>
) : (
  <Image
    source={tab.icon}
    style={styles.navIcon}
    resizeMode="contain"
  />
)}
          <Text style={[styles.navLabel, active === tab.key && styles.navLabelActive]}>
            {tab.label}
          </Text>
          {active === tab.key && <View style={styles.navDot} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.frenchBlue,
    // Gradient approximated with solid; use LinearGradient in production
    shadowColor: colors.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: colors.porcelain,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: colors.bone,
    fontSize: 15,
    fontWeight: '500',
  },
  selectionBtn: {
    backgroundColor: colors.cardSolid,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selEmoji: { fontSize: 32, marginBottom: 6 },
  selectionBtnText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  selSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  dangerBtn: {
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: '#5A1A1A',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  inputWrapper: { marginBottom: spacing.md },
  inputLabel: {
    fontSize: 12,
    color: colors.lilacAsh,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputContainer: {
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDisabledContainer: { opacity: 0.5 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 14,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  eyeBtn: { paddingHorizontal: 12 },
  eyeText: { fontSize: 16 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
  },
  logoBox: {
    backgroundColor: colors.cardSolid,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoStar: { fontSize: 40, color: colors.lavender },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.navBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 24,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  navItemActive: { backgroundColor: colors.surface2 },
  navIcon: {
  width: 28,
  height: 28, },
  navLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  navLabelActive: { color: colors.lavender },
  navDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: colors.lavender,
    marginTop: 1,
  },
  navBadge: {
    position: 'absolute', top: -3, right: -6,
    backgroundColor: colors.danger, borderRadius: 8,
    minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  navBadgeText: { color: colors.porcelain, fontSize: 8, fontWeight: '800' },
});
