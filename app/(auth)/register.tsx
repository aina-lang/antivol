import React, { useState, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const { register, isLoading } = useMesh();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    setErrorMsg(null);
    try {
      await register(name, email, password);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email },
      });
    } catch (e: any) {
      setErrorMsg(e.message || "Échec de l'inscription.");
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
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>CONNEXION</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>MESH//FIND</Text>
          <Text style={styles.subTitle}>CRÉER UN ACCÈS RENSEIGNEMENT</Text>
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

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOM D'OPÉRATEUR</Text>
            <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color={nameFocused ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Jean Dupont"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADRESSE</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={emailFocused ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="operateur@meshfind.net"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MOT DE PASSE (MINIMUM 6 CARACTÈRES)</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color={passwordFocused ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRMER LE MOT DE PASSE</Text>
            <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={18}
                color={confirmFocused ? colors.primary : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                ref={confirmPasswordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.registerButtonText}>GÉNÉRER L'ACCÈS RÉSEAU</Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>
              Déjà inscrit ?{' '}
              <Text style={{ color: colors.primary, fontFamily: 'Orbitron_700Bold' }}>
                SE CONNECTER
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
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
    marginBottom: 32,
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
    marginBottom: 36,
  },
  brandTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 28,
    color: colors.primary,
    letterSpacing: 4,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 10,
    letterSpacing: 1,
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
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 8,
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
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  registerButton: {
    width: '100%',
    height: 54,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.background,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
