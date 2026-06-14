import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SelectionButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function SelectionScreen({ navigation }) {
  const { setRole } = useAuth();
  const [error, setError] = useState('');
  const [loadingRole, setLoadingRole] = useState(null);

  const handleSelect = async (role) => {
    setError('');
    setLoadingRole(role);
    const result = await setRole(role);
    setLoadingRole(null);
    if (!result?.success) {
      setError(result?.error || 'Unable to save your role. Please try again.');
      return;
    }
    navigation.navigate('Details');
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }} />
      <Text style={styles.title}>I am a...</Text>
      <Text style={styles.subtitle}>Select your role to personalize your experience</Text>
      <View style={{ height: spacing.xl }} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SelectionButton title={loadingRole === 'Vape User' ? 'Saving...' : 'Vape User'} subtitle="I want to quit or reduce vaping" onPress={() => handleSelect('Vape User')} />
      <SelectionButton title={loadingRole === 'Peer' ? 'Saving...' : 'Peer Supporter'} subtitle="I support someone on their journey" onPress={() => handleSelect('Peer')} />
      <View style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
});
