import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OTP_LENGTH = 6;

export default function VerifyOtp() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const { verifyEmail, isLoading } = useMesh();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Refs for each OTP box
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
  }, [params.email]);

  const getCode = () => digits.join('');

  const handleVerify = async () => {
    const code = getCode();
    if (!email) {
      setErrorMsg("Veuillez saisir votre adresse email.");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setErrorMsg("Veuillez saisir les 6 chiffres du code OTP.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await verifyEmail(email, code);
      setSuccessMsg("Email validé avec succès ! Redirection vers la connexion...");
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (e: any) {
      setErrorMsg(e.message || "Validation échouée. Code OTP invalide ou expiré.");
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    // Handle paste of a full 6-digit code
    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
      const filled = [...pasted.split(''), ...Array(OTP_LENGTH).fill('')].slice(0, OTP_LENGTH);
      setDigits(filled);
      const lastIdx = Math.min(pasted.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIdx]?.focus();
      if (pasted.length === OTP_LENGTH) {
        // Dismiss keyboard and auto-submit
        inputRefs.current[OTP_LENGTH - 1]?.blur();
      }
      return;
    }
    const digit = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Auto-submit when all filled
  useEffect(() => {
    if (digits.every((d) => d !== '') && !isLoading) {
      handleVerify();
    }
  }, [digits]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="light" />

      {/* Fixed back button — toujours visible en haut */}
      <View style={[styles.fixedHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>CONNEXION</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>FARORATRA</Text>
          <Text style={styles.subTitle}>VALIDATION DU CANAL SÉCURISÉ</Text>
        </View>

        {/* Icon illustration */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconBg}>
            <MaterialCommunityIcons name="shield-key-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.iconCaption}>
            Un code à 6 chiffres a été envoyé à votre adresse email.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Error */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={colors.danger}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Success */}
          {successMsg && (
            <View style={styles.successBox}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={16}
                color={colors.success}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* Email field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADRESSE</Text>
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
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
                returnKeyType="next"
                onSubmitEditing={() => inputRefs.current[0]?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* OTP boxes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CODE OTP — 6 CHIFFRES</Text>
            <View style={styles.otpRow}>
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpBox,
                    focusedIndex === index && styles.otpBoxFocused,
                    digit !== '' && styles.otpBoxFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  textAlign="center"
                  selectionColor={colors.primary}
                />
              ))}
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.verifyButtonText}>ACTIVER LE TERMINAL</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.backLinkText}>
              Retourner à{' '}
              <Text style={{ color: colors.primary, fontFamily: 'Orbitron_700Bold' }}>
                LA CONNEXION
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fixedHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  backText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginLeft: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 26,
    color: colors.primary,
    letterSpacing: 4,
  },
  subTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  iconCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: colors.danger + '18',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  successBox: {
    backgroundColor: colors.success + '18',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.success,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary + '70',
    backgroundColor: colors.surface,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
    height: '100%',
  },
  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 58,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 22,
    color: colors.textPrimary,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  otpBoxFilled: {
    borderColor: colors.primary + '60',
  },
  verifyButton: {
    width: '100%',
    height: 54,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.background,
    letterSpacing: 1,
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  backLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
