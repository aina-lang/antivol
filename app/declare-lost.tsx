import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/constants/colors';
import { useMesh } from '../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DeclareLost() {
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { declareDeviceLost, localDevice } = useMesh();
  const router = useRouter();

  const handleDeclare = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await declareDeviceLost(description);
      Alert.alert(
        'Alerte Réseau Lancée',
        'Votre appareil a été déclaré perdu. Toute la communauté MeshFind à Madagascar est en écoute active.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      setErrorMsg(e.message || 'Impossible de lancer la recherche.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header tactique modal */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeText}>FERMER</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>ALERTE ANTI-VOL</Text>
          <Text style={styles.modalSub}>DÉCLARATION DE PERTE TACTIQUE</Text>
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

          {localDevice && (
            <View style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <MaterialCommunityIcons
                  name="cellphone-wireless"
                  size={24}
                  color={colors.danger}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceLabel}>APPAREIL ENREGISTRÉ À CE COMPTE</Text>
                  <Text style={styles.deviceModel}>{localDevice.model.toUpperCase()}</Text>
                  <Text style={styles.deviceId} numberOfLines={1}>
                    ID: {localDevice.deviceId}
                  </Text>
                </View>
              </View>
              <Text style={styles.fieldHint}>
                Ce terminal est le seul et unique appareil lié à votre compte. Sa perte sera signalée sur l'ensemble du réseau MeshFind de Madagascar.
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>INFORMATIONS SUPPLÉMENTAIRES (FACULTATIF)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Ex: Coque noire, volé près du marché Analakely à Tananarive..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.declareBtn, submitting ? styles.btnDisabled : null]}
            onPress={handleDeclare}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.declareBtnText}>PROPAGER L’ALERTE DE RECHERCHE</Text>
            )}
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 36,
    position: 'relative',
  },
  closeBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  closeText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  modalTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
    color: colors.danger,
    letterSpacing: 2,
  },
  modalSub: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
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
  multilineInput: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 14,
  },
  declareBtn: {
    width: '100%',
    height: 54,
    backgroundColor: colors.danger,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  declareBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  deviceModel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  deviceId: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
