import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
  PanResponder,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/colors';
import { useMesh } from '../src/store/meshStore';
import { foregroundLocationService } from '../src/background/foregroundService';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// ── Accent-bar section header ──────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sectionHeaderStyles.row}>
      <View style={sectionHeaderStyles.bar} />
      <Text style={sectionHeaderStyles.text}>{label}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bar: {
    width: 3,
    height: 11,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    marginRight: 8,
  },
  text: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
});


// ── Main Screen ────────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter();
  const {
    user,
    devices,
    logout,
    loadMyDevices,
    declareDeviceLost,
    localDevice,
    updateProfile,
    registerCurrentDevice,
  } = useMesh();

  const [editName, setEditName] = useState(user?.name || '');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSyncingDevice, setIsSyncingDevice] = useState(false);

  // Avatar ring animation
  const avatarRingScale = useSharedValue(1);
  const avatarRingOpacity = useSharedValue(0.5);

  useEffect(() => {
    avatarRingScale.value = withRepeat(withTiming(1.35, { duration: 1800 }), -1, true);
    avatarRingOpacity.value = withRepeat(withTiming(0.1, { duration: 1800 }), -1, true);
  }, [avatarRingScale, avatarRingOpacity]);

  const avatarRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarRingScale.value }],
    opacity: avatarRingOpacity.value,
  }));

  useEffect(() => {
    loadMyDevices();
  }, [loadMyDevices]);

  useEffect(() => {
    if (user?.name) setEditName(user.name);
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous fermer la session de ce terminal ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre nom.');
      return;
    }
    setIsSubmittingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        password: editPassword ? editPassword : undefined,
      });
      setEditPassword('');
      Alert.alert('Succès', 'Votre profil opérateur a été mis à jour.');
    } catch (error: any) {
      Alert.alert('Échec de la mise à jour', error.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleSyncDevice = async () => {
    if (!localDevice) return;
    setIsSyncingDevice(true);
    try {
      await registerCurrentDevice(true);
      Alert.alert(
        'APPAREIL REMPLACÉ ET SÉCURISÉ',
        `Ce téléphone (${localDevice.model}) est maintenant votre appareil protégé. L'ancien appareil a été retiré du système.`,
        [{ text: 'CONFIRMER', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert("Échec de l'association", error.message || 'Une erreur est survenue.');
    } finally {
      setIsSyncingDevice(false);
    }
  };

  const isVictim = devices.some((d: any) => d.isLost === true);


  const activeDevice = devices[0];
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Profile header */}
      <View style={[styles.profileSection, { paddingTop: Math.max(insets.top, 15) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>RETOUR</Text>
        </TouchableOpacity>
        
        <View style={styles.profileHeaderRow}>
          {/* Animated avatar */}
          <View style={styles.avatarWrapper}>
            <Reanimated.View style={[styles.avatarRing, avatarRingStyle]} />
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="shield-account" size={32} color={colors.primary} />
            </View>
          </View>

          <View style={styles.profileInfoText}>
            <Text style={styles.profileTitle}>OPÉRATEUR SÉCURITÉ</Text>
            <Text style={styles.profileName}>{user?.name || 'Inconnu'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'pas-de-mail@faroratra.net'}</Text>
          </View>
        </View>

        {activeDevice && (
          <View style={styles.headerDeviceCard}>
            <View style={styles.headerDeviceTextContainer}>
              <Text style={styles.headerDeviceLabel}>APPAREIL PROTÉGÉ</Text>
              <Text style={styles.headerDeviceModel}>{activeDevice.model.toUpperCase()}</Text>
              <Text style={styles.headerDeviceId} numberOfLines={1}>
                ID: {activeDevice.deviceId || activeDevice.id}
              </Text>
            </View>
            <View
              style={[
                styles.headerStatusBadge,
                { backgroundColor: activeDevice.isLost ? colors.danger : colors.success },
              ]}>
              <MaterialCommunityIcons
                name={activeDevice.isLost ? 'alert-decagram' : 'shield-check'}
                size={14}
                color={colors.textPrimary}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.headerStatusText}>
                {activeDevice.isLost ? 'RECHERCHÉ' : 'SÉCURISÉ'}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}>

        {/* Device sync warning */}
        {localDevice && (!activeDevice || activeDevice.deviceId !== localDevice.deviceId) && (
          <View style={styles.section}>
            <SectionHeader label="SYNCHRONISATION DE L'APPAREIL" />
            <View style={[styles.settingCard, { borderColor: colors.warning, borderWidth: 1.5 }]}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="cellphone-link" size={20} color={colors.warning} />
                <Text style={[styles.systemSettingTitle, { color: colors.warning }]}>
                  NOUVEL APPAREIL DÉTECTÉ
                </Text>
              </View>
              <Text style={styles.settingText}>
                Vous êtes connecté depuis un téléphone différent de celui enregistré dans votre
                profil. Pour protéger cet appareil ({localDevice.model}), associez-le à votre
                compte.
              </Text>
              <TouchableOpacity
                style={[
                  styles.settingBtn,
                  { backgroundColor: colors.warning + '20', borderColor: colors.warning },
                ]}
                onPress={handleSyncDevice}
                disabled={isSyncingDevice}>
                <MaterialCommunityIcons
                  name="shield-sync"
                  size={14}
                  color={colors.warning}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.settingBtnText, { color: colors.warning }]}>
                  {isSyncingDevice ? 'ASSOCIATION EN COURS...' : 'SÉCURISER CE TÉLÉPHONE'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {localDevice && activeDevice && activeDevice.deviceId === localDevice.deviceId && (
          <View style={styles.section}>
            <SectionHeader label="APPAREIL SYNCHRONISÉ" />
            <View style={[styles.settingCard, { borderColor: colors.success + '40' }]}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="cellphone-check" size={20} color={colors.success} />
                <Text style={[styles.systemSettingTitle, { color: colors.success }]}>
                  PROTECTION MATÉRIELLE ACTIVE
                </Text>
              </View>
              <Text style={styles.settingText}>
                Votre téléphone physique actuel ({localDevice.model}) est parfaitement synchronisé
                et sécurisé par notre protocole mesh.
              </Text>
            </View>
          </View>
        )}

        {/* Profile update */}
        <View style={styles.section}>
          <SectionHeader label="MODIFIER MES INFORMATIONS" />
          <View style={styles.settingCard}>
            <Text style={styles.inputLabel}>NOM DE L'OPÉRATEUR</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Votre nom complet"
              placeholderTextColor={colors.textSecondary + '80'}
            />
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>
              NOUVEAU MOT DE PASSE (OPTIONNEL)
            </Text>
            <TextInput
              style={styles.textInput}
              value={editPassword}
              onChangeText={setEditPassword}
              placeholder="Saisissez un nouveau mot de passe"
              placeholderTextColor={colors.textSecondary + '80'}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.settingBtn, { marginTop: 16 }]}
              onPress={handleUpdateProfile}
              disabled={isSubmittingProfile}>
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={14}
                color={colors.textPrimary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.settingBtnText}>
                {isSubmittingProfile ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Background service */}
        <View style={styles.section}>
          <SectionHeader label="VEILLE EN TÂCHE DE FOND" />
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MaterialCommunityIcons name="battery-off-outline" size={20} color={colors.primary} />
              <Text style={styles.systemSettingTitle}>OPTIMISATION DE LA BATTERIE</Text>
            </View>
            <Text style={styles.settingText}>
              Pour que le service de détection antivol reste actif 24h/24, veuillez désactiver
              l'optimisation de batterie pour cette application.
            </Text>
            <TouchableOpacity
              style={styles.settingBtn}
              onPress={() => {
                Alert.alert(
                  'Configuration système',
                  "Nous allons ouvrir vos paramètres d'application. Allez dans 'Batterie' et sélectionnez 'Non restreint'.",
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Configurer', onPress: () => Linking.openSettings() },
                  ]
                );
              }}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={14}
                color={colors.textPrimary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.settingBtnText}>DÉSACTIVER L'OPTIMISATION</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* About */}
        <View style={styles.section}>
          <SectionHeader label="INFORMATIONS" />
          <TouchableOpacity
            style={[styles.settingBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/about')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.settingBtnText}>À PROPOS DE FARORATRA</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name="logout-variant"
            size={15}
            color={colors.danger}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>DÉCONNEXION DU TERMINAL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 40 },
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
    marginBottom: 20,
  },
  backBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginLeft: 2,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '18',
    zIndex: 10,
  },
  profileHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarWrapper: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoText: { flex: 1 },
  profileTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  profileName: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerDeviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 5,
  },
  headerDeviceTextContainer: { flex: 1, marginRight: 10 },
  headerDeviceLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerDeviceModel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  headerDeviceId: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  headerStatusText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  section: { marginBottom: 28 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 20,
  },
  settingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  systemSettingTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  settingBtn: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  alertLog: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertLogTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.primary,
  },
  alertLogTime: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
  },
  alertLogBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.danger + '12',
    borderWidth: 1,
    borderColor: colors.danger + '25',
    marginBottom: 14,
  },
  clearAllText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.danger,
    letterSpacing: 1,
  },

  logoutButton: {
    width: '100%',
    height: 60,
    borderWidth: 1,
    borderColor: colors.danger + '60',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: colors.danger + '08',
  },
  logoutText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: colors.danger,
    letterSpacing: 1,
  },
});
