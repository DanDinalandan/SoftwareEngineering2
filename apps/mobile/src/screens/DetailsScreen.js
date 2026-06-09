import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const VAPE_TYPES = [
  { id: 'pod',       label: 'Pod System',       },
  { id: 'disposable',label: 'Disposable',        },
  { id: 'mod',       label: 'Box Mod',           },
  { id: 'pen',       label: 'Vape Pen',          },
  { id: 'other',     label: 'Other',             },
];

// Strip non-letter chars (allow space, hyphen, apostrophe) — sanitize name fields
function sanitizeName(val) {
  return val.replace(/[^a-zA-Z\s\-']/g, '');
}


function formatBirthday(raw, prevRaw) {
  // Strip everything that isn't a digit
  const digits = raw.replace(/\D/g, '').slice(0, 8);

  // Slices
  const mm   = digits.slice(0, 2);
  const dd   = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  // Build formatted string
  let out = '';
  if (digits.length <= 2) {
    out = mm;
  } else if (digits.length <= 4) {
    out = `${mm}/${dd}`;
  } else {
    out = `${mm}/${dd}/${yyyy}`;
  }

    const prevDigits = (prevRaw || '').replace(/\D/g, '');
  if (digits.length === 6 && prevDigits.length < 6) {
    const twoDigit = parseInt(digits.slice(4, 6), 10);
    const currentYear = new Date().getFullYear();
    const cutoff = currentYear - 18; 
    const fullYear = twoDigit <= (currentYear - 2000 - 18)
      ? 2000 + twoDigit
      : 1900 + twoDigit;
    out = `${mm}/${dd}/${fullYear}`;
  }

  return out;
}

export default function DetailsScreen({ navigation }) {
  const { currentUser, saveDetails } = useAuth();
  const role = currentUser?.role || '';

  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '',
    suffix: '', birthday: '', age: '', gender: '',
  });
  const [selectedVapeTypes, setSelectedVapeTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [genderOpen, setGenderOpen]   = useState(false);
  const [loading, setLoading]         = useState(false);

  const setField = (field) => (value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calc age whenever birthday reaches MM/DD/YYYY length
      if (field === 'birthday') {
        const bday = value; // use updated value
        if (bday.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(bday)) {
          const [mm, dd, yyyy] = bday.split('/').map(Number);
          if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && yyyy > 1900) {
            const dob   = new Date(yyyy, mm - 1, dd);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            if (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())) age--;
            updated.age = (age >= 0 && age < 120) ? String(age) : '';
          }
        } else if (bday.length < 10) {
          updated.age = ''; // clear age while typing
        }
      }
      return updated;
    });
  };

  const handleBirthday = (raw) => {
    const formatted = formatBirthday(raw, form.birthday);
    setField('birthday')(formatted);
  };

  const toggleVapeType = (id) => {
    setSelectedVapeTypes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    else if (/[^a-zA-Z\s\-']/.test(form.firstName)) e.firstName = 'Name contains invalid characters';

    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    else if (/[^a-zA-Z\s\-']/.test(form.lastName)) e.lastName = 'Name contains invalid characters';

    if (!form.birthday) {
      e.birthday = 'Birthday is required';
    } else if (form.birthday.length !== 10) {
      e.birthday = 'Use MM/DD/YYYY format';
    } else {
      const age = parseInt(form.age, 10);
      if (isNaN(age) || age < 18) e.birthday = 'You must be at least 18 years old.';
      else if (age > 99) e.birthday = 'Age must be 99 or below.';
    }

    if (!form.gender) e.gender = 'Please select a gender';

    if (role === 'Vape User' && selectedVapeTypes.length === 0) {
      e.vapeTypes = 'Please select at least one vape type';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await saveDetails({
        firstName: sanitizeName(form.firstName.trim()),
        lastName:  sanitizeName(form.lastName.trim()),
        middleName: sanitizeName(form.middleName.trim()),
        suffix: form.suffix.trim(),
        birthday: form.birthday,
        age: form.age,
        gender: form.gender,
        vapeTypes: selectedVapeTypes,
      });
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

        {/* Name fields — sanitized */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={form.firstName}
              onChangeText={(v) => setField('firstName')(sanitizeName(v))}
              placeholder="Juan"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            {errors.firstName ? <Text style={styles.errText}>{errors.firstName}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={form.lastName}
              onChangeText={(v) => setField('lastName')(sanitizeName(v))}
              placeholder="dela Cruz"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            {errors.lastName ? <Text style={styles.errText}>{errors.lastName}</Text> : null}
          </View>
        </View>

        <Text style={styles.fieldLabel}>Middle Name</Text>
        <TextInput
          style={[styles.input, { marginBottom: spacing.md }]}
          value={form.middleName}
          onChangeText={(v) => setField('middleName')(sanitizeName(v))}
          placeholder="Santos"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
        />

         <View style={styles.row}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <Text style={styles.fieldLabel}>Birthday (MM/DD/YYYY)</Text>
            <TextInput
              style={[styles.input, errors.birthday && styles.inputError]}
              value={form.birthday}
              onChangeText={handleBirthday}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.birthday ? <Text style={styles.errText}>{errors.birthday}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={[styles.input, { opacity: 0.6 }]}
              value={form.age}
              editable={false}
              placeholder="—"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.ageNotice}>
          <Text style={styles.ageNoticeText}>Must be 18 years old and above to register.</Text>
        </View>

        {/* Gender */}
        <Text style={styles.fieldLabel}>Gender</Text>
        <TouchableOpacity
          style={[styles.picker, errors.gender && styles.inputError]}
          onPress={() => setGenderOpen(!genderOpen)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pickerText, !form.gender && { color: colors.textMuted + '80' }]}>
            {form.gender || 'Select Gender'}
          </Text>
          <Text style={styles.chevron}>{genderOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {errors.gender ? <Text style={styles.errText}>{errors.gender}</Text> : null}
        {genderOpen && (
          <View style={styles.dropdown}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.dropdownItem}
                onPress={() => { setField('gender')(g); setGenderOpen(false); }}
              >
                <Text style={[styles.dropdownText, form.gender === g && { color: colors.lavender, fontWeight: '700' }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Vape types — only for Vape User */}
        {role === 'Vape User' && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.fieldLabel}>What type of vape do you use?</Text>
            <Text style={styles.fieldHint}>Select all that apply</Text>
            <View style={styles.vapeGrid}>
              {VAPE_TYPES.map((vt) => (
                <TouchableOpacity
                  key={vt.id}
                  style={[
                    styles.vapeCard,
                    selectedVapeTypes.includes(vt.id) && styles.vapeCardActive,
                  ]}
                  onPress={() => toggleVapeType(vt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vapeEmoji}>{vt.emoji}</Text>
                  <Text style={[
                    styles.vapeLabel,
                    selectedVapeTypes.includes(vt.id) && styles.vapeLabelActive,
                  ]}>
                    {vt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.vapeTypes ? <Text style={styles.errText}>{errors.vapeTypes}</Text> : null}
          </View>
        )}

        <View style={{ height: spacing.lg }} />
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
  roleTag: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  roleTagText: { fontSize: 12, color: colors.lavender, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, color: colors.lilacAsh, marginBottom: 6, fontWeight: '600', letterSpacing: 0.3 },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginBottom: 10, marginTop: -4 },
  input: {
    backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13,
    color: colors.text, fontSize: 14, marginBottom: spacing.md,
  },
  inputError: { borderColor: colors.danger },
  errText: { color: colors.danger, fontSize: 12, marginTop: -12, marginBottom: spacing.sm },
  ageNotice: {
    backgroundColor: 'rgba(181,125,218,0.1)', borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: spacing.md,
  },
  ageNoticeText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  picker: {
    backgroundColor: colors.input, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  pickerText: { color: colors.text, fontSize: 14 },
  chevron: { color: colors.lilacAsh, fontSize: 11 },
  dropdown: {
    backgroundColor: colors.cardSolid, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, marginBottom: spacing.sm, overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  dropdownText: { color: colors.text, fontSize: 14 },
  // Vape types
  vapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vapeCard: {
    width: '30%', padding: 12, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', gap: 4,
  },
  vapeCardActive: { borderColor: colors.lavender, backgroundColor: colors.surface2 },
  vapeEmoji: { fontSize: 22 },
  vapeLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },
  vapeLabelActive: { color: colors.lavender, fontWeight: '700' },
});
