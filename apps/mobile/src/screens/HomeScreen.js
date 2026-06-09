import React from 'react';
import { View, Text, StyleSheet, Image, } from 'react-native';
import { LogoBox, PrimaryButton, SecondaryButton } from '../components';
import { colors, spacing } from '../theme';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';


export default function HomeScreen({ navigation }) {

const [fontsLoaded] = useFonts({
  PressStart2P: PressStart2P_400Regular,
});

if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }} />
      <Image
  source={require('../../assets/icons/logo.png')}
  style={styles.logo}
/>
      <Text style={styles.title}>Unvapeify</Text>
      <Text style={styles.subtitle}>Your Vape-free journey starts here</Text>
      <View style={{ flex: 1 }} />
      <View style={styles.buttons}>
        <PrimaryButton title="Sign Up" onPress={() => navigation.navigate('SignUp')} />
        <SecondaryButton title="Login" onPress={() => navigation.navigate('Login')} />
        <Text style={styles.privacy}>Your data stays private. Always.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { fontSize: 56, marginBottom: 12 },
  title: {
  fontSize: 34,
  fontFamily: 'PressStart2P',
  color: colors.text,
},
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: 0 },
  buttons: { width: '100%', paddingBottom: 48 },
  privacy: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 8 },
  logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: -5, },
});
