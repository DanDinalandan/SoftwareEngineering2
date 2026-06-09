import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SelectionButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function SelectionScreen({ navigation }) {
  const { setRole } = useAuth();

  const handleSelect = async (role) => {
    await setRole(role);
    navigation.navigate('Details');
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }} />
      <Text style={styles.title}>I am a...</Text>
      <Text style={styles.subtitle}>Select your role to personalize your experience</Text>
      <View style={{ height: spacing.xl }} />
      <SelectionButton title="Vape User" subtitle="I want to quit or reduce vaping" onPress={() => handleSelect('Vape User')} />
      <SelectionButton title="Peer Supporter" subtitle="I support someone on their journey" onPress={() => handleSelect('Peer')} />
      <View style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted },
});
