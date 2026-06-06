import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { InputField, PrimaryButton, SecondaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!selectedRole) e.role = 'Please select your role';
    if (!identifier.trim()) e.identifier = 'Email or username is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = login({ identifier, password });
      if (!result.success) { setErrors({ general: result.error }); return; }
      const user = result.user;

      if (user.role !== selectedRole) {
        setErrors({ general: `This account is registered as a ${user.role}, not ${selectedRole}.` });
        return;
      }

      // If profile is already complete → go straight to Dashboard, no re-entering details
      if (user.profileComplete) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else if (user.role) {
        navigation.navigate('Details');
      } else {
        navigation.navigate('Selection');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1 }} />
        <Text style={styles.star}>✦</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Continue your journey</Text>

        <Text style={styles.roleLabel}>I am logging in as a...</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, selectedRole === 'Vape User' && styles.roleBtnActive]}
            onPress={() => setSelectedRole('Vape User')}
            activeOpacity={0.8}
          >
        
            <Text style={[styles.roleBtnText, selectedRole === 'Vape User' && styles.roleBtnTextActive]}>
              Vape User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, selectedRole === 'Peer' && styles.roleBtnActive]}
            onPress={() => setSelectedRole('Peer')}
            activeOpacity={0.8}
          >
            
            <Text style={[styles.roleBtnText, selectedRole === 'Peer' && styles.roleBtnTextActive]}>
              Peer Supporter
            </Text>
          </TouchableOpacity>
        </View>
        {errors.role ? <Text style={styles.generalError}>{errors.role}</Text> : null}

        <View style={{ height: spacing.md }} />
        <InputField
          label="Email or Username"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="email or username"
          error={errors.identifier}
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
        />
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
  container: {
    flexGrow: 1, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl, minHeight: '100%',
  },
  star: { fontSize: 48, textAlign: 'center', marginBottom: 12, color: colors.lavender },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: spacing.xl },
  roleLabel: { fontSize: 12, color: colors.lilacAsh, fontWeight: '600', marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleBtn: {
    flex: 1, padding: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.cardSolid, alignItems: 'center', gap: 4,
  },
  roleBtnActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  roleEmoji: { fontSize: 24 },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  roleBtnTextActive: { color: colors.lavender },
  generalError: { color: colors.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },
});
