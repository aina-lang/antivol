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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { useMesh } from '../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DeclareLost() {
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const { declareDeviceLost, declareDeviceSecured, localDevice, devices } = useMesh();
  const router = useRouter();

  const myDevice = devices.find((d) => d.deviceId === localDevice?.deviceId);
  const isCurrentlyLost = myDevice ? myDevice.isLost : false;

  const handleDeclareOrCancel = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (isCurrentlyLost) {
        await declareDeviceSecured();
        Alert.alert(
          'Recherche Annulée',
          "Votre appareil a été déclaré comme retrouvé. Il est désormais sécurisé.",
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        await declareDeviceLost(description);
        Alert.alert(
          'Alerte Réseau Lancée',
          "Votre appareil a été déclaré perdu. Toute la communauté Faroratra à Madagascar est en écoute active.",
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Impossible de modifier le statut de l'appareil.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Navigation header */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>RETOUR</Text>
          </TouchableOpacity>
        </View>

        {/* Page header */}
        <View style={styles.header}>
          <View style={styles.headerAccentRow}>
            <View
              style={[
                styles.headerAccentBar,
                { backgroundColor: isCurrentlyLost ? colors.danger : colors.primary },
              ]}
            />
            <Text
              style={[
                styles.modalTitle,
                { color: isCurrentlyLost ? colors.danger : colors.primary },
              ]}>
              {isCurrentlyLost ? 'RECHERCHE ACTIVE' : 'ALERTE ANTI-VOL'}
            </Text>
          </View>
          <Text style={styles.modalSub}>
            {isCurrentlyLost
              ? 'LE RÉSEAU LOCALISE VOTRE APPAREIL'
              : 'DÉCLARATION DE PERTE TACTIQUE'}
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

          {/* Device card */}
          {localDevice && (
            <View
              style={[
                styles.deviceCard,
                isCurrentlyLost && {
                  borderColor: colors.danger,
                  backgroundColor: colors.danger + '0A',
                  shadowColor: colors.danger,
                  shadowOpacity: 0.18,
                  shadowRadius: 12,
                  elevation: 6,
                },
              ]}>
              <View style={styles.deviceHeader}>
                <View
                  style={[
                    styles.deviceIconWrapper,
                    {
                      backgroundColor: (isCurrentlyLost ? colors.danger : colors.success) + '18',
                    },
                  ]}>
                  <MaterialCommunityIcons
                    name={isCurrentlyLost ? 'alert-octagon' : 'cellphone-wireless'}
                    size={24}
                    color={isCurrentlyLost ? colors.danger : colors.success}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.deviceLabel}>
                    {isCurrentlyLost
                      ? 'APPAREIL DÉCLARÉ VOLÉ / PERDU'
                      : 'APPAREIL ENREGISTRÉ À CE COMPTE'}
                  </Text>
                  <Text style={styles.deviceModel}>{localDevice.model.toUpperCase()}</Text>
                  <Text style={styles.deviceId} numberOfLines={1}>
                    ID: {localDevice.deviceId}
                  </Text>
                </View>
                {isCurrentlyLost && (
                  <View style={styles.lostBadge}>
                    <Text style={styles.lostBadgeText}>RECHERCHÉ</Text>
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              <Text style={styles.fieldHint}>
                {isCurrentlyLost
                  ? "Cet appareil émet des signaux d'urgence et est activement recherché par le réseau de veille communautaire Faroratra à Madagascar."
                  : "Ce terminal est le seul et unique appareil lié à votre compte. Sa perte sera signalée sur l'ensemble du réseau Faroratra de Madagascar."}
              </Text>
            </View>
          )}

          {/* Description field (only when declaring lost) */}
          {!isCurrentlyLost && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>INFORMATIONS SUPPLÉMENTAIRES (FACULTATIF)</Text>
              <TextInput
                style={styles.multilineInput}
                placeholder="Ex: Coque noire, volé près du marché Analakely à Tananarive..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Info notice */}
          <View
            style={[
              styles.infoNotice,
              {
                borderColor: (isCurrentlyLost ? colors.success : colors.warning) + '40',
                backgroundColor: (isCurrentlyLost ? colors.success : colors.warning) + '08',
              },
            ]}>
            <MaterialCommunityIcons
              name={isCurrentlyLost ? 'information-outline' : 'broadcast'}
              size={15}
              color={isCurrentlyLost ? colors.success : colors.warning}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={[styles.infoText, { color: isCurrentlyLost ? colors.success : colors.warning }]}>
              {isCurrentlyLost
                ? "Confirmer cette action retirera votre appareil de la liste de recherche active."
                : "Une fois déclaré, tous les appareils Faroratra actifs commenceront immédiatement la veille Bluetooth de votre modèle."}
            </Text>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[
              styles.declareBtn,
              isCurrentlyLost && styles.cancelBtn,
              submitting && styles.btnDisabled,
            ]}
            onPress={handleDeclareOrCancel}
            disabled={submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <View style={styles.btnContent}>
                <MaterialCommunityIcons
                  name={isCurrentlyLost ? 'shield-check' : 'alert-decagram'}
                  size={18}
                  color={colors.textPrimary}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.declareBtnText}>
                  {isCurrentlyLost
                    ? "ANNULER L'ALERTE — APPAREIL RETROUVÉ"
                    : "PROPAGER L'ALERTE DE RECHERCHE"}
                </Text>
              </View>
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
  navRow: {
    marginBottom: 28,
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
    marginBottom: 32,
  },
  headerAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerAccentBar: {
    width: 4,
    height: 26,
    borderRadius: 3,
    marginRight: 12,
  },
  modalTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
    letterSpacing: 2,
  },
  modalSub: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 16,
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
  deviceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  deviceModel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  deviceId: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  lostBadge: {
    backgroundColor: colors.danger,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'center',
    marginLeft: 8,
  },
  lostBadgeText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  multilineInput: {
    width: '100%',
    height: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  declareBtn: {
    width: '100%',
    height: 58,
    backgroundColor: colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cancelBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  declareBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
});
