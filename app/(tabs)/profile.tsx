import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { foregroundLocationService } from '../../src/background/foregroundService';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Profile() {
  const {
    user,
    devices,
    isServiceActive,
    toggleService,
    alerts,
    logout,
    loadMyDevices,
    declareDeviceLost,
  } = useMesh();

  // Charger les appareils de l'utilisateur au montage
  useEffect(() => {
    loadMyDevices();
  }, [loadMyDevices]);

  const handleToggleService = async (value: boolean) => {
    try {
      if (value) {
        await foregroundLocationService.startService();
      } else {
        await foregroundLocationService.stopService();
      }
      await toggleService(value);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de configurer le service.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous fermer la session de ce terminal ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Profil de l'Opérateur */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="shield-account" size={42} color={colors.primary} />
        </View>
        <Text style={styles.profileTitle}>OPÉRATEUR SÉCURITÉ</Text>
        <Text style={styles.profileName}>{user?.name || 'Inconnu'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'pas-de-mail@meshfind.net'}</Text>
      </View>

      {/* Toggles Système */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>RÉGLAGES SYSTÈME</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Récepteur Mesh BLE</Text>
            <Text style={styles.settingSub}>
              Participer passivement à la recherche communautaire
            </Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primaryDim }}
            thumbColor={isServiceActive ? colors.primary : colors.textMuted}
            value={isServiceActive}
            onValueChange={handleToggleService}
          />
        </View>
      </View>

      {/* Liste des terminaux sécurisés */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>MES APPAREILS SÉCURISÉS</Text>
        {devices.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun appareil déclaré sous cet identifiant.</Text>
          </View>
        ) : (
          devices.map((dev) => (
            <View key={dev.id} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View>
                  <Text style={styles.deviceModel}>{dev.model.toUpperCase()}</Text>
                  <Text style={styles.deviceId} numberOfLines={1}>
                    ID: {dev.id}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: dev.isLost ? colors.danger : colors.success },
                  ]}>
                  <Text style={styles.statusText}>{dev.isLost ? 'RECHERCHÉ' : 'SÉCURISÉ'}</Text>
                </View>
              </View>

              {!dev.isLost && (
                <TouchableOpacity
                  style={styles.lostBtn}
                  onPress={() => {
                    Alert.alert(
                      'Déclaration de vol',
                      `Voulez-vous déclarer votre ${dev.model} comme perdu sur le réseau Mesh ?`,
                      [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Déclarer Perdu',
                          style: 'destructive',
                          onPress: () => declareDeviceLost(dev.id, dev.model),
                        },
                      ]
                    );
                  }}>
                  <MaterialCommunityIcons
                    name="alert"
                    size={14}
                    color={colors.textPrimary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.lostBtnText}>SIGNALER APPAREIL PERDU / VOLÉ</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Journal des alertes interceptées par cet utilisateur */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>JOURNAL DES INTERCEPTIONS</Text>
        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun signal d’alerte détecté récemment.</Text>
          </View>
        ) : (
          alerts.map((al) => (
            <View key={al.id} style={styles.alertLog}>
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
            </View>
          ))
        )}
      </View>

      {/* Bouton Déconnexion */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>DÉCONNEXION DU TERMINAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
});
