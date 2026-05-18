import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, isLoading } = useMesh();
  const router = useRouter();

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
      // Le garde de navigation du RootLayout redirigera vers /(tabs)
    } catch (e: any) {
      setErrorMsg(e.message || "Échec de l'inscription.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>MESH//FIND</Text>
        <Text style={styles.subTitle}>CRÉER UN ACCÈS RENSEIGNEMENT</Text>
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

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>NOM D’OPÉRATEUR</Text>
          <TextInput
            style={styles.input}
            placeholder="Jean Dupont"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        </View>

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
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>MOT DE PASSE (MINIMUM 6 CARACTÈRES)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>CONFIRMER LE MOT DE PASSE</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.registerButton, isLoading ? styles.buttonDisabled : null]}
          onPress={handleRegister}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.registerButtonText}>GÉNÉRER L’ACCÈS RÉSEAU</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLinkText}>
            Déjà inscrit ? <Text style={{ color: colors.primary }}>SE CONNECTER</Text>
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
    marginBottom: 36,
    marginTop: 40,
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
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  registerButton: {
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
  registerButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.background,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
