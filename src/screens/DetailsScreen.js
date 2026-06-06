import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { InputField, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

const GENDERS = ['Male', 'Female', 'Prefer not to say'];

export default function DetailsScreen({ navigation }) {
  const { currentUser, saveDetails } = useAuth();
  const role = currentUser?.role || '';

  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '',
    suffix: '', birthday: '', age: '', gender: '',
  });

  const set = (field) => (value) => {
  if (field === 'birthday') {
    value = formatBirthday(value);
  }

  setForm((prev) => {
    const updated = { ...prev, [field]: value };

    if (field === 'birthday' && value.length === 10) {
      const [mm, dd, yyyy] = value.split('/').map(Number);

      if (mm && dd && yyyy) {
        const dob = new Date(yyyy, mm - 1, dd);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();

        if (
          today <
          new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        ) {
          age--;
        }

        if (age >= 0 && age < 120) {
          updated.age = String(age);
        }
      }
    }

    return updated;
  });
};

  const [errors, setErrors] = useState({});
  const [genderOpen, setGenderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatBirthday = (text) => {
  const cleaned = text.replace(/\D/g, '');

  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  } else {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }
};

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.birthday) {
      e.birthday = 'Birthday is required';
    } else if (form.birthday.length !== 10) {
      e.birthday = 'Use MM/DD/YYYY format';
    } else {
      const age = parseInt(form.age, 10);
      if (isNaN(age) || age < 18) {
        e.birthday = 'You must be at least 18 years old to sign up.';
      } else if (age > 99) {
        e.birthday = 'Age must be 99 or below.';
      }
    }
    if (!form.gender) e.gender = 'Please select a gender';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      saveDetails({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
        suffix: form.suffix.trim(),
        birthday: form.birthday,
        age: form.age,
        gender: form.gender,
      });
      // Navigate to Dashboard — reset stack so back doesn't go to details
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Your Details</Text>
        </View>

        {role ? (
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{role}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <InputField label="First Name" value={form.firstName} onChangeText={set('firstName')} placeholder="Juan" autoCapitalize="words" error={errors.firstName} />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Last Name" value={form.lastName} onChangeText={set('lastName')} placeholder="dela Cruz" autoCapitalize="words" error={errors.lastName} />
          </View>
        </View>

        <InputField label="Middle Name" value={form.middleName} onChangeText={set('middleName')} placeholder="Santos" autoCapitalize="words" />

        <View style={styles.row}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <InputField label="Birthday (MM/DD/YYYY)" value={form.birthday} onChangeText={set('birthday')} placeholder="MM/DD/YYYY" keyboardType="number-pad" error={errors.birthday} />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Age" value={form.age} onChangeText={() => {}} editable={false} placeholder="—" />
          </View>
        </View>

        {/* Gender Picker */}
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.inputLabel}>Gender</Text>
          <TouchableOpacity
            style={[styles.genderPicker, errors.gender ? styles.genderError : null]}
            onPress={() => setGenderOpen(!genderOpen)}
            activeOpacity={0.8}
          >
            <Text style={[styles.genderText, !form.gender && { color: colors.lilacAsh + '80' }]}>
              {form.gender || 'Select Gender'}
            </Text>
            <Text style={styles.chevron}>{genderOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
          {genderOpen && (
            <View style={styles.dropdown}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.dropdownItem}
                  onPress={() => { set('gender')(g); setGenderOpen(false); }}
                >
                  <Text style={styles.dropdownText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {errors.general ? <Text style={{ color: colors.danger, marginBottom: 8 }}>{errors.general}</Text> : null}

        <PrimaryButton title="Continue ✦" onPress={handleConfirm} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 10 },
  backArrow: { fontSize: 30, color: colors.lilacAsh, lineHeight: 36, marginRight: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  roleTagText: { fontSize: 12, color: colors.lavender, fontWeight: '600' },
  row: { flexDirection: 'row' },
  inputLabel: { fontSize: 12, color: colors.lilacAsh, marginBottom: 6, fontWeight: '600' },
  genderPicker: { backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  genderError: { borderColor: colors.danger },
  genderText: { color: colors.text, fontSize: 14 },
  chevron: { color: colors.lilacAsh, fontSize: 11 },
  dropdown: { backgroundColor: colors.cardSolid, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  dropdownText: { color: colors.text, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
});
