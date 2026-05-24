import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/constants/colors';
import { apiService } from '../../src/services/api';

// ── OTP Input (6 boxes) ────────────────────────────────────────────────
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
}

function OtpInput({ value, onChange }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(6, ' ').split('');

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.otpContainer}>
      {digits.map((d, i) => (
        <View
          key={i}
          style={[
            styles.otpBox,
            value.length === i && styles.otpBoxActive,
            d.trim() !== '' && styles.otpBoxFilled,
          ]}>
          <Text style={styles.otpDigit}>{d.trim()}</Text>
        </View>
      ))}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.otpHiddenInput}
        caretHidden
      />
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────
export default function ResetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMsg('Veuillez entrer le code à 6 chiffres.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    // Just validate locally for now — the actual reset will check the OTP too
    setTimeout(() => {
      setLoading(false);
      setStep('password');
    }, 600);
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await apiService.resetPassword({ email: email as string, code: otp, password });
      setSuccessMsg('Mot de passe réinitialisé avec succès !');
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || e.message || 'Code OTP invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMsg(null);
    try {
      await apiService.forgotPassword(email as string);
      setSuccessMsg('Un nouveau code a été envoyé à votre email.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg('Impossible de renvoyer le code.');
    } finally {
      setResending(false);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 'otp' ? router.back() : setStep('otp')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>RETOUR</Text>
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotDone]} />
          <View style={[styles.stepLine, step === 'password' && styles.stepLineDone]} />
          <View style={[styles.stepDot, step === 'password' && styles.stepDotDone]} />
        </View>

        {step === 'otp' ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="shield-key-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.title}>VÉRIFICATION OTP</Text>
              <Text style={styles.subtitle}>
                Un code à 6 chiffres a été envoyé à{'\n'}
                <Text style={{ color: colors.primary, fontFamily: 'SpaceMono_400Regular' }}>{email}</Text>
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {successMsg && (
              <View style={styles.successBox}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            <OtpInput value={otp} onChange={setOtp} />

            <TouchableOpacity
              style={[styles.submitBtn, (loading || otp.length < 6) && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.submitBtnText}>VALIDER LE CODE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending}>
              {resending ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={styles.resendText}>
                  Pas reçu ? <Text style={{ color: colors.primary }}>Renvoyer le code</Text>
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={[styles.iconWrapper, { borderColor: colors.success + '50' }]}>
                <MaterialCommunityIcons name="lock-open-check-outline" size={36} color={colors.success} />
              </View>
              <Text style={styles.title}>NOUVEAU MOT DE PASSE</Text>
              <Text style={styles.subtitle}>Choisissez un nouveau mot de passe sécurisé pour votre compte.</Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {successMsg && (
              <View style={styles.successBox}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOUVEAU MOT DE PASSE</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRMER LE MOT DE PASSE</Text>
              <View style={[styles.inputWrapper, confirmPassword.length > 0 && password !== confirmPassword && styles.inputWrapperError]}>
                <MaterialCommunityIcons name="lock-check-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.success }, loading && styles.btnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.background} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>RÉINITIALISER LE MOT DE PASSE</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}
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
    borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 28,
  },
  backBtnText: {
    fontFamily: 'Orbitron_700Bold', fontSize: 9,
    color: colors.textSecondary, letterSpacing: 1, marginLeft: 2,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.border, borderWidth: 2, borderColor: colors.border,
  },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLine: { flex: 0, width: 60, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
  stepLineDone: { backgroundColor: colors.primary },
  header: { alignItems: 'center', marginBottom: 32 },
  iconWrapper: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.primary + '40', justifyContent: 'center',
    alignItems: 'center', marginBottom: 20,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  title: {
    fontFamily: 'Orbitron_700Bold', fontSize: 18,
    color: colors.textPrimary, letterSpacing: 2, marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },
  errorBox: {
    backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger,
    borderRadius: 10, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center',
  },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.danger, flex: 1 },
  successBox: {
    backgroundColor: colors.success + '12', borderWidth: 1, borderColor: colors.success,
    borderRadius: 10, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center',
  },
  successText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.success, flex: 1 },
  otpContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    marginBottom: 32, position: 'relative',
  },
  otpBox: {
    width: 46, height: 58, borderRadius: 10, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  otpBoxActive: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  otpBoxFilled: { borderColor: colors.primary + '70', backgroundColor: colors.surface },
  otpDigit: { fontFamily: 'SpaceMono_400Regular', fontSize: 22, color: colors.textPrimary },
  otpHiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold', fontSize: 9,
    color: colors.textSecondary, marginBottom: 8, letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, height: 52,
  },
  inputWrapperError: { borderColor: colors.danger + '60' },
  inputIcon: { marginRight: 10 },
  input: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: colors.textPrimary, height: '100%' },
  eyeBtn: { padding: 4, marginLeft: 4 },
  submitBtn: {
    width: '100%', height: 54, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', borderRadius: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.45 },
  submitBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: colors.background, letterSpacing: 1 },
  resendBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 8 },
  resendText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary },
});
