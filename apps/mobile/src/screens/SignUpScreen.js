import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

function generateSuggestions(base) {
  if (!base || base.length < 2) return [];
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  if (clean.length < 2) return [];
  const year = new Date().getFullYear();
  const raw = [
    clean,
    `${clean}_ph`,
    `${clean}${year}`,
    `vapefree_${clean}`,
  ];

  const seen = new Set();
  return raw.filter((s) => {
    const valid = s.length >= 3 && s.length <= 20 && !seen.has(s);
    seen.add(s);
    return valid;
  }).slice(0, 4);
}

// Password strength — 5 criteria
function checkStrength(pw) {
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed };
}

const STRENGTH_LABELS = ['',  'Very Weak', 'Weak',    'Fair',    'Strong',        'Very Strong'];
const STRENGTH_COLORS = ['', '#E07070',   '#E07070', '#F0C070', '#9FD08A', '#7EC8A0'];

// Only allow gmail-username-safe characters (letters, digits, dots, hyphens, plus, underscore)
function sanitizeGmailUser(val) {
  return val.replace(/[@\s]/g, '').replace(/[^a-zA-Z0-9._%+\-]/g, '');
}

// Only lowercase letters, digits, underscore for username
function sanitizeUsername(val) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignUpScreen({ navigation }) {
  const { register } = useAuth();

  const [gmailUser,        setGmailUser]        = useState('');
  const [username,         setUsername]         = useState('');
  const [phone,            setPhone]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');

  const [suggestions,      setSuggestions]      = useState([]);
  const [strength,         setStrength]         = useState(null);
  const [showRules,        setShowRules]        = useState(false);
  const [errors,           setErrors]           = useState({});
  const [loading,          setLoading]          = useState(false);

  // Track suggestion click to avoid regenerating on every render
  const suggestionPicked = useRef(false);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleGmailChange = (val) => {
    const clean = sanitizeGmailUser(val);
    setGmailUser(clean);
    // Regenerate suggestions from gmail prefix
    setSuggestions(generateSuggestions(clean));
    suggestionPicked.current = false;
    setErrors((e) => ({ ...e, gmailUser: undefined }));
  };

  const handleUsernameChange = (val) => {
    const clean = sanitizeUsername(val);
    setUsername(clean);
    suggestionPicked.current = false;
    setErrors((e) => ({ ...e, username: undefined }));
  };

  const applySuggestion = (s) => {
    setUsername(s);
    suggestionPicked.current = true;
    setErrors((e) => ({ ...e, username: undefined }));
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    setStrength(val.length > 0 ? checkStrength(val) : null);
    setShowRules(val.length > 0);
    setErrors((e) => ({ ...e, password: undefined }));
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    // Gmail username
    if (!gmailUser.trim()) {
      e.gmailUser = 'Gmail username is required';
    } else if (!/^[a-zA-Z0-9._%+\-]+$/.test(gmailUser)) {
      e.gmailUser = 'Invalid Gmail username — only letters, numbers, dots, and hyphens';
    }

    // Username
    if (!username.trim()) {
      e.username = 'Username is required';
    } else if (username.length < 3) {
      e.username = 'At least 3 characters';
    } else if (username.length > 20) {
      e.username = 'Max 20 characters';
    }

    // Phone
    if (!phone.trim()) {
      e.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
      e.phone = 'Enter a valid phone number (e.g. +639171234567)';
    }

    // Password — all 5 criteria must pass
    if (!password) {
      e.password = 'Password is required';
    } else {
      const s = checkStrength(password);
      if (!s.checks.length)   e.password = 'At least 8 characters required';
      else if (!s.checks.upper)   e.password = 'Add at least one uppercase letter (A–Z)';
      else if (!s.checks.lower)   e.password = 'Add at least one lowercase letter (a–z)';
      else if (!s.checks.number)  e.password = 'Add at least one number (0–9)';
      else if (!s.checks.special) e.password = 'Add at least one special character (!@#$%...)';
    }

    // Confirm password
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const fullEmail = `${gmailUser.trim()}@gmail.com`;
      const result = await register({ email: fullEmail, username, phone, password, role: '' });
      if (!result.success) { setErrors({ general: result.error }); return; }
      navigation.navigate('Selection');
    } catch (err) {
      setErrors({ general: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join thousands on the path to freedom</Text>

        {/* ── Email (fixed @gmail.com) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={[styles.emailRow, errors.gmailUser && styles.errBorder]}>
            <TextInput
              style={styles.emailInput}
              value={gmailUser}
              onChangeText={handleGmailChange}
              placeholder="yourname"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
            <View style={styles.suffixBox}>
              <Text style={styles.suffixText}>@gmail.com</Text>
            </View>
          </View>
          {errors.gmailUser
            ? <Text style={styles.errMsg}>{errors.gmailUser}</Text>
            : <Text style={styles.fieldHint}>Type your Gmail username</Text>
          }
        </View>

        {/* ── Username + suggestions ── */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Username</Text>
            <Text style={styles.charCount}>{username.length}/20</Text>
          </View>
          <View style={[styles.inputBox, errors.username && styles.errBorder]}>
            <TextInput
              style={styles.inputText}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="choose a username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="next"
            />
          </View>
          {errors.username
            ? <Text style={styles.errMsg}>{errors.username}</Text>
            : null
          }

          {/* Suggestions — show when gmail username has been typed */}
          {suggestions.length > 0 && (
            <View style={styles.suggestBox}>
              <Text style={styles.suggestTitle}>Suggestions:</Text>
              <View style={styles.suggestRow}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.suggestChip,
                      username === s && styles.suggestChipActive,
                    ]}
                    onPress={() => applySuggestion(s)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.suggestText,
                      username === s && styles.suggestTextActive,
                    ]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Phone ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={[styles.inputBox, errors.phone && styles.errBorder]}>
            <TextInput
              style={styles.inputText}
              value={phone}
              onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: undefined })); }}
              placeholder="+639171234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>
          {errors.phone ? <Text style={styles.errMsg}>{errors.phone}</Text> : null}
        </View>

        {/* ── Password + strength ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputBox, errors.password && styles.errBorder]}>
            <TextInput
              style={styles.inputText}
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Input a strong password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          {/* Strength bar */}
          {strength && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                {[1,2,3,4,5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthSeg,
                      {
                        backgroundColor: i <= strength.passed
                          ? STRENGTH_COLORS[strength.passed]
                          : 'rgba(170,160,187,0.2)',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength.passed] }]}>
                {STRENGTH_LABELS[strength.passed]}
              </Text>
            </View>
          )}

          {/* Checklist */}
          {showRules && strength && (
            <View style={styles.rulesBox}>
              {[
                { k: 'length',  l: 'At least 8 characters' },
                { k: 'upper',   l: 'One uppercase letter (A–Z)' },
                { k: 'lower',   l: 'One lowercase letter (a–z)' },
                { k: 'number',  l: 'One number (0–9)' },
                { k: 'special', l: 'One special character (!@#$...)' },
              ].map(({ k, l }) => (
                <Text
                  key={k}
                  style={[
                    styles.ruleItem,
                    { color: strength.checks[k] ? colors.success : colors.textMuted },
                  ]}
                >
                  {strength.checks[k] ? 'Met' : 'Needs'}  {l}
                </Text>
              ))}
            </View>
          )}

          {errors.password ? <Text style={styles.errMsg}>{errors.password}</Text> : null}
        </View>

        {/* ── Confirm Password ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <View style={[styles.inputBox, errors.confirmPassword && styles.errBorder]}>
            <TextInput
              style={styles.inputText}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: undefined })); }}
              placeholder="Repeat your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
          </View>
          {/* Live match indicator */}
          {confirmPassword.length > 0 && (
            <Text style={[
              styles.matchHint,
              { color: password === confirmPassword ? colors.success : colors.danger },
            ]}>
              {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
            </Text>
          )}
          {errors.confirmPassword ? <Text style={styles.errMsg}>{errors.confirmPassword}</Text> : null}
        </View>

        {errors.general
          ? <Text style={styles.generalError}>{errors.general}</Text>
          : null}

        <View style={{ height: spacing.sm }} />
        <PrimaryButton title="Create Account" onPress={handleSignUp} loading={loading} />
        <SecondaryButton
          title="Already have an account? Login"
          onPress={() => navigation.navigate('Login')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl },

  // Field wrapper
  fieldGroup: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  fieldLabel: { fontSize: 12, color: colors.lilacAsh, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginTop: 5 },
  charCount: { fontSize: 10, color: colors.textMuted },

  // Email row (split input + suffix)
  emailRow: {
    flexDirection: 'row',
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emailInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 14,
  },
  suffixBox: {
    backgroundColor: 'rgba(65,71,139,0.6)',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  suffixText: { color: colors.lavender, fontSize: 13, fontWeight: '600' },

  // Generic input box
  inputBox: {
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputText: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 14,
  },

  errBorder: { borderColor: colors.danger },
  errMsg: { color: colors.danger, fontSize: 12, marginTop: 5 },
  generalError: { color: colors.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },

  // Suggestions
  suggestBox: { marginTop: 10 },
  suggestTitle: { fontSize: 11, color: colors.textMuted, marginBottom: 6, fontWeight: '500' },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  suggestChipActive: {
    borderColor: colors.lavender,
    backgroundColor: colors.surface2,
  },
  suggestText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  suggestTextActive: { color: colors.lavender, fontWeight: '700' },

  // Password strength
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthBar: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', width: 76, textAlign: 'right' },
  rulesBox: {
    marginTop: 8,
    backgroundColor: 'rgba(65,71,139,0.18)',
    borderRadius: radius.sm,
    padding: 10,
    gap: 4,
  },
  ruleItem: { fontSize: 11, lineHeight: 19 },

  // Password match
  matchHint: { fontSize: 12, marginTop: 5, fontWeight: '600' },
});
