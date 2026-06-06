import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { InputField, PrimaryButton, SecondaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function SignUpScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.trim().length < 3) e.username = 'At least 3 characters';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = register({
        email: form.email,
        username: form.username,
        password: form.password,
      });
      if (!result.success) {
        setErrors({ general: result.error });
        return;
      }
      if (!form.email.trim()) {
      e.email = 'Gmail username is required';
  }
      // Go to selection screen — user now exists in memory
      navigation.navigate('Selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join thousands on the path to freedom</Text>

        <InputField label="Email" value={form.email} onChangeText={set('email')} placeholder="you@email.com" keyboardType="email-address" error={errors.email} />
        <InputField label="Username" value={form.username} onChangeText={set('username')} placeholder="username" error={errors.username} />
        <InputField label="Password" value={form.password} onChangeText={set('password')} placeholder="Min 8 characters" secureTextEntry error={errors.password} />
        <InputField label="Confirm Password" value={form.confirmPassword} onChangeText={set('confirmPassword')} placeholder="Repeat password" secureTextEntry error={errors.confirmPassword} />
        <Text style={styles.emailSuffix}>@gmail.com</Text>
        {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}
        <View style={{ height: spacing.sm }} />
        <PrimaryButton title="Create Account" onPress={handleSignUp} loading={loading} />
        <SecondaryButton title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl + spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl },
  generalError: { color: colors.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },
});
