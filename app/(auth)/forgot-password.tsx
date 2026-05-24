import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/constants/colors';
import { apiService } from '../../src/services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    if (!email.trim()) {
      setErrorMsg('Veuillez entrer votre adresse email.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await apiService.forgotPassword(email.trim().toLowerCase());
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim().toLowerCase() } });
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || e.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 40), paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>RETOUR</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="lock-reset" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>MOT DE PASSE OUBLIÉ</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse email. Nous vous enverrons un code OTP pour réinitialiser votre mot de passe.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Error */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ADRESSE EMAIL</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <MaterialCommunityIcons
                name="email-outline" size={18}
                color={emailFocused ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="operateur@faroratra.net"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="send-outline" size={16} color={colors.background} style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>ENVOYER LE CODE OTP</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1,
    borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 40,
  },
  backBtnText: {
    fontFamily: 'Orbitron_700Bold', fontSize: 9,
    color: colors.textSecondary, letterSpacing: 1, marginLeft: 2,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrapper: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.primary + '40', justifyContent: 'center',
    alignItems: 'center', marginBottom: 24,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  title: {
    fontFamily: 'Orbitron_700Bold', fontSize: 20,
    color: colors.textPrimary, letterSpacing: 2, marginBottom: 14,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },
  form: { width: '100%' },
  errorBox: {
    backgroundColor: colors.danger + '18', borderWidth: 1,
    borderColor: colors.danger, borderRadius: 10, padding: 14,
    marginBottom: 20, flexDirection: 'row', alignItems: 'center',
  },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.danger, flex: 1 },
  inputGroup: { marginBottom: 24 },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold', fontSize: 9,
    color: colors.textSecondary, marginBottom: 8, letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, height: 52,
  },
  inputWrapperFocused: { borderColor: colors.primary + '70' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: colors.textPrimary, height: '100%' },
  submitBtn: {
    width: '100%', height: 54, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', borderRadius: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 12, color: colors.background, letterSpacing: 1 },
});
