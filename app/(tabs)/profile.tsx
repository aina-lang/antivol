import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, Alert, Linking, Animated, PanResponder, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { foregroundLocationService } from '../../src/background/foregroundService';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  confirmTitle: string;
  confirmMessage: string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onDelete,
  confirmTitle,
  confirmMessage,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isRevealed = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx;
        if (isRevealed.current) {
          newX -= 80;
        }
        if (newX > 0) newX = 0;
        if (newX < -120) newX = -120;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = -40;
        let finalX = 0;
        let dx = gestureState.dx;
        if (isRevealed.current) {
          dx -= 80;
        }
        if (dx < threshold) {
          finalX = -80;
          isRevealed.current = true;
        } else {
          finalX = 0;
          isRevealed.current = false;
        }
        Animated.spring(translateX, {
          toValue: finalX,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const handleDeletePress = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      isRevealed.current = false;
    });

    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={swipeStyles.container}>
      <View style={swipeStyles.backRow}>
        <TouchableOpacity
          style={swipeStyles.deleteButton}
          onPress={handleDeletePress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[swipeStyles.frontRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const swipeStyles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  backRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.danger,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.danger,
  },
  frontRow: {
    backgroundColor: colors.background,
    borderRadius: 8,
  },
});

export default function Profile() {
  const router = useRouter();
  const {
    user,
    devices,
    alerts,
    logout,
    loadMyDevices,
    declareDeviceLost,
    setFocusCoords,
    lostDeviceDetections,
    deleteAlert,
    clearAllAlerts,
    deleteDetection,
    clearAllDetections,
    localDevice,
    updateProfile,
    registerCurrentDevice,
  } = useMesh();

  const [editName, setEditName] = useState(user?.name || '');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSyncingDevice, setIsSyncingDevice] = useState(false);

  // Charger les appareils de l'utilisateur au montage
  useEffect(() => {
    loadMyDevices();
  }, [loadMyDevices]);

  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
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
      Alert.alert('Succès', 'Votre profil opérateur a été mis à jour avec succès !');
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
      await registerCurrentDevice();
      Alert.alert(
        '🔒 APPAREIL SÉCURISÉ',
        `Cet appareil physique (${localDevice.model}) est à présent enregistré et protégé par votre compte de sécurité.`,
        [{ text: 'EXCELLENT', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert("Échec de l'association", error.message || 'Une erreur est survenue.');
    } finally {
      setIsSyncingDevice(false);
    }
  };

  const isVictim = devices.some((d) => d.isLost === true);

  const handleAlertPress = (al: any) => {
    if (al.lat && al.lng) {
      setFocusCoords({ lat: al.lat, lng: al.lng });
      router.push('/map');
    } else {
      Alert.alert(al.title, al.body);
    }
  };

  const handleDetectionPress = (det: any) => {
    if (det.latitude && det.longitude) {
      setFocusCoords({ lat: parseFloat(det.latitude), lng: parseFloat(det.longitude) });
      router.push('/map');
    }
  };
  const handleClearAll = () => {
    Alert.alert(
      'Vider le journal de sécurité',
      'Voulez-vous vraiment effacer tous les éléments de ce journal ? Cette action est définitive et irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout Effacer',
          style: 'destructive',
          onPress: () => {
            if (isVictim) {
              clearAllDetections();
            } else {
              clearAllAlerts();
            }
          },
        },
      ]
    );
  };

  const activeDevice = devices[0];

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Profil de l'Opérateur Fixe */}
      <View style={[styles.profileSection, { paddingTop: Math.max(insets.top, 15) }]}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="shield-account" size={32} color={colors.primary} />
          </View>
          <View style={styles.profileInfoText}>
            <Text style={styles.profileTitle}>OPÉRATEUR SÉCURITÉ</Text>
            <Text style={styles.profileName}>{user?.name || 'Inconnu'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'pas-de-mail@meshfind.net'}</Text>
          </View>
        </View>

        {/* Détails de l'appareil et son Badge en haut */}
        {activeDevice && (
          <View style={styles.headerDeviceCard}>
            <View style={styles.headerDeviceTextContainer}>
              <Text style={styles.headerDeviceLabel}>APPAREIL PROTÉGÉ</Text>
              <Text style={styles.headerDeviceModel}>{activeDevice.model.toUpperCase()}</Text>
              <Text style={styles.headerDeviceId} numberOfLines={1}>ID: {activeDevice.deviceId || activeDevice.id}</Text>
            </View>
            <View
              style={[
                styles.headerStatusBadge,
                { backgroundColor: activeDevice.isLost ? colors.danger : colors.success }
              ]}
            >
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

      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Détecter si le téléphone physique actuel est différent de celui enregistré sur le serveur */}
        {localDevice && (!activeDevice || activeDevice.deviceId !== localDevice.deviceId) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>🔔 SYNCHRONISATION DE L'APPAREIL</Text>
            <View style={[styles.settingCard, { borderColor: colors.warning, borderWidth: 1.5 }]}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="cellphone-link" size={20} color={colors.warning} />
                <Text style={[styles.systemSettingTitle, { color: colors.warning }]}>
                  NOUVEL APPAREIL ACTUEL DÉTECTÉ
                </Text>
              </View>
              <Text style={styles.settingText}>
                Vous êtes connecté depuis un téléphone différent de celui enregistré dans votre profil opérateur. Pour protéger et localiser cet appareil physique actuel (Modèle : {localDevice.model}), associez-le à votre compte de sécurité.
              </Text>
              <TouchableOpacity
                style={[styles.settingBtn, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
                onPress={handleSyncDevice}
                disabled={isSyncingDevice}
              >
                <MaterialCommunityIcons name="shield-sync" size={14} color={colors.warning} style={{ marginRight: 6 }} />
                <Text style={[styles.settingBtnText, { color: colors.warning }]}>
                  {isSyncingDevice ? 'ASSOCIATION EN COURS...' : 'SÉCURISER CE TÉLÉPHONE ACTUEL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {localDevice && activeDevice && activeDevice.deviceId === localDevice.deviceId && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>📱 APPAREIL SYNCHRONISÉ</Text>
            <View style={[styles.settingCard, { borderColor: colors.success + '40' }]}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="cellphone-check" size={20} color={colors.success} />
                <Text style={[styles.systemSettingTitle, { color: colors.success }]}>
                  PROTECTION MATÉRIELLE ACTIVE
                </Text>
              </View>
              <Text style={styles.settingText}>
                Votre téléphone physique actuel ({localDevice.model}) est parfaitement synchronisé et sécurisé par notre protocole mesh à Madagascar.
              </Text>
            </View>
          </View>
        )}

        {/* Section Mise à jour du Profil */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MODIFIER MES INFORMATIONS</Text>
          <View style={styles.settingCard}>
            <Text style={styles.inputLabel}>NOM DE L'OPÉRATEUR</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Votre nom complet"
              placeholderTextColor={colors.textSecondary + '80'}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>NOUVEAU MOT DE PASSE (OPTIONNEL)</Text>
            <TextInput
              style={styles.textInput}
              value={editPassword}
              onChangeText={setEditPassword}
              placeholder="Saisissez un nouveau mot de passe pour changer"
              placeholderTextColor={colors.textSecondary + '80'}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.settingBtn, { marginTop: 16 }]}
              onPress={handleUpdateProfile}
              disabled={isSubmittingProfile}
            >
              <MaterialCommunityIcons name="account-edit-outline" size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.settingBtnText}>
                {isSubmittingProfile ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Paramètres Système / Persistance */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>VEILLE EN TÂCHE DE FOND</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MaterialCommunityIcons name="battery-off-outline" size={20} color={colors.primary} />
              <Text style={styles.systemSettingTitle}>OPTIMISATION DE LA BATTERIE</Text>
            </View>
            <Text style={styles.settingText}>
              Pour que le service de détection antivol reste actif 24h/24 en tâche interne, même si le téléphone s'éteint ou si vous quittez l'application, veuillez désactiver l'optimisation pour cette application.
            </Text>
            <TouchableOpacity
              style={styles.settingBtn}
              onPress={() => {
                Alert.alert(
                  'Configuration système',
                  "Nous allons ouvrir vos paramètres d'application. Allez dans 'Batterie' (ou 'Optimisation') et sélectionnez 'Non restreint' pour activer la veille permanente.",
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Configurer', onPress: () => Linking.openSettings() }
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.settingBtnText}>DÉSACTIVER L'OPTIMISATION</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Journal des alertes ou détections */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>
              {isVictim ? 'JOURNAL DES DÉTECTIONS' : 'JOURNAL DES INTERCEPTIONS'}
            </Text>
            {((isVictim ? (lostDeviceDetections || []).length : (alerts || []).length) > 0) && (
              <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
                <MaterialCommunityIcons name="delete-sweep-outline" size={14} color={colors.danger} style={{ marginRight: 4 }} />
                <Text style={styles.clearAllText}>EFFACER TOUT</Text>
              </TouchableOpacity>
            )}
          </View>

          {isVictim ? (
            (lostDeviceDetections || []).length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucun signal de détection reçu du réseau communautaire pour le moment.</Text>
              </View>
            ) : (
              lostDeviceDetections.map((det) => {
                const dateStr = new Date(parseInt(det.timestamp)).toLocaleString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <SwipeableItem
                    key={det.id}
                    onDelete={() => deleteDetection(det.id)}
                    confirmTitle="Supprimer la détection"
                    confirmMessage="Voulez-vous supprimer ce signal de détection de votre historique ?"
                  >
                    <TouchableOpacity
                      style={[styles.alertLog, { borderLeftColor: colors.danger, marginBottom: 0 }]}
                      onPress={() => handleDetectionPress(det)}
                    >
                      <View style={styles.alertHeader}>
                        <Text style={[styles.alertLogTitle, { color: colors.danger }]}>SIGNAL REÇU</Text>
                        <Text style={styles.alertLogTime}>{dateStr}</Text>
                      </View>
                      <Text style={styles.alertLogBody}>
                        Votre appareil a été localisé à Madagascar (Précision : {Math.round(det.accuracy)}m). Tapotez pour afficher la position exacte sur la carte tactique.
                      </Text>
                    </TouchableOpacity>
                  </SwipeableItem>
                );
              })
            )
          ) : (
            alerts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucun signal d’alerte détecté récemment.</Text>
              </View>
            ) : (
              alerts.map((al) => (
                <SwipeableItem
                  key={al.id}
                  onDelete={() => deleteAlert(al.id)}
                  confirmTitle="Supprimer l'interception"
                  confirmMessage="Voulez-vous supprimer cette alerte d'interception de votre journal ?"
                >
                  <TouchableOpacity style={[styles.alertLog, { marginBottom: 0 }]} onPress={() => handleAlertPress(al)}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertLogTitle}>{al.title.toUpperCase()}</Text>
                      <Text style={styles.alertLogTime}>
                        {new Date(al.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.alertLogBody}>{al.body}</Text>
                  </TouchableOpacity>
                </SwipeableItem>
              ))
            )
          )}
        </View>

        {/* Bouton Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>DÉCONNEXION DU TERMINAL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
    marginRight: 15,
  },
  avatarText: {
    fontSize: 36,
  },
  profileTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  profileName: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileInfoText: {
    flex: 1,
  },
  headerDeviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
    width: '100%',
  },
  headerDeviceTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerDeviceLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerDeviceModel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
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
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
  },
  settingTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  settingSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: 240,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginTop: 4,
    maxWidth: 200,
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textPrimary,
  },
  lostBtn: {
    backgroundColor: colors.danger + '20',
    borderColor: colors.danger,
    borderWidth: 1,
    height: 38,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  lostBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
  alertLog: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
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
  logoutButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: colors.danger,
    letterSpacing: 1,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
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
    lineHeight: 16,
    marginBottom: 14,
  },
  settingBtn: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
    height: 40,
    borderRadius: 6,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  clearAllText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.danger,
    letterSpacing: 1,
  },
  inputLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    height: 44,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
