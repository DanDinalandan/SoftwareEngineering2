import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

// Strip injection chars and anything not valid in an email local-part or username
function sanitizeIdentifier(val) {
  // Allow letters, digits, dots, hyphens, underscores, plus — reject everything else
  return val
    .replace(/[<>"'`;(){}[\]\\]/g, '')   // strip obvious injection chars
    .replace(/\s/g, '')                        // no spaces in identifiers
    .trimStart();
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);

  const handleIdentifierChange = (val) => {
    // Sanitize: strip injection chars, trim spaces
    setIdentifier(sanitizeIdentifier(val).trimStart());
  };

  const validate = () => {
    const e = {};
    if (!selectedRole) e.role = 'Please select your role';
    if (!identifier.trim()) e.identifier = 'Email or username is required';
    else if (identifier.trim().length < 3) e.identifier = 'Too short';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login({ identifier: identifier.trim(), password, role: selectedRole });
      if (!result.success) { setErrors({ general: result.error }); return; }
      const user = result.user;
      if (user.role && user.role !== selectedRole) {
        setErrors({ general: `This account is registered as "${user.role}", not "${selectedRole}".` });
        return;
      }
      if (user.profileComplete) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else if (user.role) {
        navigation.navigate('Details');
      } else {
        navigation.navigate('Selection');
      }
    } catch (err) {
      setErrors({ general: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1 }} />
        <Text style={styles.star}>UNVAPEIFY</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Continue your journey</Text>

        {/* Role picker */}
        <Text style={styles.roleLabel}>I am logging in as a...</Text>
        <View style={styles.roleRow}>
          {['Vape User', 'Peer'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, selectedRole === r && styles.roleBtnActive]}
              onPress={() => setSelectedRole(r)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>{r === 'Vape User' ? 'VU' : 'PS'}</Text>
              <Text style={[styles.roleBtnText, selectedRole === r && styles.roleBtnTextActive]}>
                {r === 'Vape User' ? 'Vape User' : 'Peer Supporter'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.role ? <Text style={styles.errorMsg}>{errors.role}</Text> : null}

        <View style={{ height: spacing.md }} />

        {/* Email / username — sanitized */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email or Username</Text>
          <TextInput
            style={[styles.textInput, errors.identifier && styles.inputError]}
            value={identifier}
            onChangeText={handleIdentifierChange}
            placeholder="email or username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
          {errors.identifier ? <Text style={styles.errorMsg}>{errors.identifier}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={[styles.textInput, errors.password && styles.inputError]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          {errors.password ? <Text style={styles.errorMsg}>{errors.password}</Text> : null}
        </View>

        {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

        <View style={{ height: spacing.md }} />
        <PrimaryButton title="Login" onPress={handleLogin} loading={loading} />
        <SecondaryButton
          title="Don't have an account? Sign Up"
          onPress={() => navigation.navigate('SignUp')}
        />
        <View style={{ flex: 1 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, minHeight: '100%' },
  star: { fontSize: 48, textAlign: 'center', marginBottom: 12, color: colors.lavender },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: spacing.xl },
  roleLabel: { fontSize: 12, color: colors.lilacAsh, fontWeight: '600', marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleBtn: {
    flex: 1, padding: 14, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.cardSolid, alignItems: 'center', gap: 4,
  },
  roleBtnActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  roleEmoji: { fontSize: 24 },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  roleBtnTextActive: { color: colors.lavender },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: 12, color: colors.lilacAsh, marginBottom: 6, fontWeight: '600', letterSpacing: 0.3 },
  textInput: {
    backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13,
    color: colors.text, fontSize: 14,
  },
  inputError: { borderColor: colors.danger },
  errorMsg: { color: colors.danger, fontSize: 12, marginTop: 4 },
  generalError: { color: colors.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },
});
