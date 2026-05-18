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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VerifyOtp() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { verifyEmail, isLoading } = useMesh();
  const router = useRouter();

  const codeRef = useRef<TextInput>(null);

  // Prefill email if coming from register screen
  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
  }, [params.email]);

  const handleVerify = async () => {
    if (!email || !code) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }
    if (code.length !== 6) {
      setErrorMsg('Le code OTP doit comporter 6 chiffres.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await verifyEmail(email, code);
      setSuccessMsg('Email validé avec succès ! Redirection vers la connexion...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Validation échouée. Code OTP invalide ou expiré.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>MESH//FIND</Text>
        <Text style={styles.subTitle}>VALIDATION DU CANAL SÉCURISÉ</Text>
      </View>

      <View style={styles.form}>
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

        {successMsg && (
          <View style={styles.successBox}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={16}
              color={colors.success || '#00E676'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>EMAIL ADRESSE</Text>
          <TextInput
            style={styles.input}
            placeholder="operateur@meshfind.net"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => codeRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>CODE DE VALIDATION OTP (6 CHIFFRES)</Text>
          <TextInput
            ref={codeRef}
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            value={code}
            onChangeText={setCode}
            returnKeyType="done"
            onSubmitEditing={handleVerify}
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isLoading ? styles.buttonDisabled : null]}
          onPress={handleVerify}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.verifyButtonText}>ACTIVER LE TERMINAL</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.backLinkText}>
            Retourner à <Text style={{ color: colors.primary }}>LA CONNEXION</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 26,
    color: colors.primary,
    letterSpacing: 4,
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 6,
    padding: 12,
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
    backgroundColor: (colors.success || '#00E676') + '20',
    borderWidth: 1,
    borderColor: colors.success || '#00E676',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.success || '#00E676',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  verifyButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
  },
  backLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
