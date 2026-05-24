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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useMesh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setErrorMsg(e.message || 'Identifiants invalides.');
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
            paddingTop: Math.max(insets.top, 40),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Brand header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>MESH//FIND</Text>
          <Text style={styles.subTitle}>ENTREZ VOS IDENTIFIANTS TACTIQUES</Text>
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
            <Text style={styles.inputLabel}>MOT DE PASSE</Text>
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

          {/* Submit */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.loginButtonText}>ACCÉDER AU TERMINAL</Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLinkText}>
              Pas encore de compte ?{' '}
              <Text style={{ color: colors.primary, fontFamily: 'Orbitron_700Bold' }}>
                CRÉER UN ACCÈS
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    marginBottom: 24,
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
    marginBottom: 20,
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
  loginButton: {
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
  loginButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.background,
    letterSpacing: 1,
  },
  registerLink: {
    marginTop: 28,
    alignItems: 'center',
  },
  registerLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
