import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { RadarScanner } from '../../src/components/RadarScanner';
import { StatusBadge } from '../../src/components/StatusBadge';
import { BleSignalCard } from '../../src/components/BleSignalCard';
import { MapView } from '../../src/components/MapView';
import { useLocation } from '../../src/hooks/useLocation';
import { foregroundLocationService } from '../../src/background/foregroundService';
import { apiService } from '../../src/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Dashboard() {
  const { user, isServiceActive, toggleService, detectedDevices, currentLocation, updateLocation } =
    useMesh();

  const router = useRouter();
  const { getCurrentLocation } = useLocation();
  const [protectedCount, setProtectedCount] = useState(42);
  const [mapLoading, setMapLoading] = useState(false);

  // Charger les stats de proximité + récupérer la position initiale
  useEffect(() => {
    async function initDashboard() {
      // Charger le nombre de téléphones protégés à proximité
      const stats = await apiService.getProtectedStats();
      setProtectedCount(stats.count);

      // Récupérer la position GPS actuelle
      setMapLoading(true);
      const coords = await getCurrentLocation();
      if (coords) {
        updateLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? undefined,
        });
      }
      setMapLoading(false);
    }

    initDashboard();

    // Démarrer automatiquement le Foreground Service s'il est actif dans le store
    if (isServiceActive) {
      foregroundLocationService.startService().catch((err) => {
        console.warn('Erreur auto-start Foreground Service:', err);
        if (err.message?.includes('arrière-plan')) {
          Alert.alert(
            'Protection active requise',
            'Pour sécuriser votre appareil en arrière-plan, veuillez accorder la permission de localisation "Toujours" dans les paramètres.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Paramètres', onPress: () => Linking.openSettings() }
            ]
          );
        }
      });
    }
  }, [getCurrentLocation, isServiceActive, updateLocation]);

  // Activer/Désactiver le service en cliquant sur le Radar
  const handleRadarPress = async () => {
    const nextState = !isServiceActive;
    try {
      if (nextState) {
        await foregroundLocationService.startService();
      } else {
        await foregroundLocationService.stopService();
      }
      await toggleService(nextState);
    } catch (e: any) {
      if (e.message?.includes('arrière-plan')) {
        Alert.alert(
          'Permission requise',
          'Veuillez activer la localisation "Toujours autoriser" dans les paramètres du téléphone pour démarrer le service.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        Alert.alert('Erreur Service', e.message || 'Impossible de modifier l’état du service.');
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Header Tactique */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>OPÉRATEUR MESH</Text>
          <Text style={styles.userName}>{user?.name || 'ANONYME'}</Text>
        </View>
        <TouchableOpacity style={styles.signalBadge} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.signalText}>ID: {user?.id ? String(user.id).substring(0, 8) : 'OFF'} </Text>
        </TouchableOpacity>
      </View>

      {/* Badge de statut pulsant */}
      <View style={styles.badgeWrapper}>
        <StatusBadge isActive={isServiceActive} protectedCount={protectedCount} />
      </View>

      {/* Section Centrale Radar */}
      <View style={styles.radarSection}>
        <TouchableOpacity onPress={handleRadarPress} activeOpacity={0.8}>
          <RadarScanner devicesCount={protectedCount} isActive={isServiceActive} />
        </TouchableOpacity>
        <Text style={styles.radarHint}>
          {isServiceActive
            ? 'TAPOTEZ LE RADAR POUR PASSER HORS-LIGNE'
            : 'TAPOTEZ LE RADAR POUR DÉMARRER LA SURVEILLANCE'}
        </Text>
      </View>

      {/* Cartes d'alertes BLE détectées en temps réel à proximité */}
      {detectedDevices.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.sectionTitle}>ALERTES INTERCEPTÉES À PROXIMITÉ</Text>
          {detectedDevices.map((device, idx) => (
            <BleSignalCard
              key={`${device.bleId}-${idx}`}
              bleId={device.bleId}
              rssi={device.rssi}
              timestamp={device.timestamp}
            />
          ))}
        </View>
      )}

      {/* Mini-carte Tactique */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>COUVERTURE GÉO-TACTIQUE ACTUELLE</Text>
        <View style={styles.mapWrapper}>
          {currentLocation ? (
            <MapView
              latitude={currentLocation.latitude}
              longitude={currentLocation.longitude}
              accuracy={currentLocation.accuracy}
              isLoading={mapLoading}
            />
          ) : (
            <View style={styles.noGpsWrapper}>
              <Text style={styles.noGpsText}>RECHERCHE DE SIGNAL GPS...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bouton Proéminent Déclarer Perdu */}
      <TouchableOpacity style={styles.lostButton} onPress={() => router.push('/declare-lost')}>
        <MaterialCommunityIcons
          name="alert-decagram"
          size={18}
          color={colors.textPrimary}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.lostButtonText}>DÉCLARER UN TÉLÉPHONE VOLÉ / PERDU</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  userName: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  signalBadge: {
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  signalText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.primary,
  },
  badgeWrapper: {
    marginBottom: 24,
  },
  radarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radarHint: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  alertSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  mapSection: {
    marginVertical: 16,
  },
  mapWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noGpsWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noGpsText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  lostButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.danger,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 24,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  lostButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },
});
export type {} from 'react-native';
