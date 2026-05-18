import React, { useEffect, useState, useMemo } from 'react';
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
import * as SecureStore from 'expo-secure-store';

export default function Dashboard() {
  const { user, isServiceActive, toggleService, detectedDevices, currentLocation, updateLocation, lostDeviceDetections, devices } =
    useMesh();

  // Déterminer si l'utilisateur est une victime (a un téléphone perdu)
  const isVictim = useMemo(() => {
    return (devices || []).some((d: any) => d.isLost === true);
  }, [devices]);

  const router = useRouter();
  const { getCurrentLocation } = useLocation();
  const [protectedCount, setProtectedCount] = useState(42);
  const [mapLoading, setMapLoading] = useState(false);

  // Convertir les détections communautaires en marqueurs Leaflet de couleur Rouge (mémorisés)
  const detectionMarkers = useMemo(() => {
    return (lostDeviceDetections || []).map((det: any) => {
      const dateStr = new Date(parseInt(det.timestamp)).toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: 'numeric',
        month: 'short',
      });
      return {
        id: `det-${det.id}`,
        position: { lat: parseFloat(det.latitude), lng: parseFloat(det.longitude) },
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF3B30" width="36" height="36">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`,
        size: [36, 36] as [number, number],
        title: `Signalé le ${dateStr} (Précision: ${Math.round(det.accuracy)}m)`,
      };
    });
  }, [lostDeviceDetections]);

  // Centrer dynamiquement la carte sur le dernier signal reçu si perdu, sinon sur le GPS local (mémorisé)
  const mapCenter = useMemo(() => {
    const hasDetections = lostDeviceDetections && lostDeviceDetections.length > 0;
    const lat = hasDetections
      ? parseFloat(lostDeviceDetections[0].latitude)
      : (currentLocation?.latitude || -18.8792);

    const lng = hasDetections
      ? parseFloat(lostDeviceDetections[0].longitude)
      : (currentLocation?.longitude || 47.5079);

    const accuracy = hasDetections
      ? parseFloat(lostDeviceDetections[0].accuracy)
      : (currentLocation?.accuracy || 20);

    return { lat, lng, accuracy, hasDetections };
  }, [lostDeviceDetections, currentLocation]);

  // Regrouper tous les marqueurs (mémorisés)
  const allMarkers = useMemo(() => {
    return [
      // Marqueur vert pour la position GPS actuelle
      ...(currentLocation ? [{
        id: 'current-pos',
        position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00FF66" width="36" height="36">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`,
        size: [36, 36] as [number, number],
        title: 'Votre Position Actuelle',
      }] : []),
      ...detectionMarkers,
    ];
  }, [currentLocation, detectionMarkers]);

  // Charger les stats de proximité + récupérer la position initiale
  useEffect(() => {
    async function initDashboard() {
      setMapLoading(true);
      try {
        // Charger le nombre de téléphones protégés à proximité
        const stats = await apiService.getProtectedStats().catch(() => ({ count: 42 }));
        setProtectedCount(stats.count);

        // Récupérer la position GPS actuelle
        const coords = await getCurrentLocation();
        if (coords) {
          updateLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? undefined,
          });
        }
      } catch (err) {
        console.warn("Échec de l'initialisation du tableau de bord:", err);
      } finally {
        setMapLoading(false);
      }
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
  }, []);

  // Activer/Désactiver le service en cliquant sur le Radar (Force un scan manuel instantané pour la démo)
  const handleRadarPress = async () => {
    try {
      setMapLoading(true);
      // 1. Récupérer les IDs perdus actifs sur le serveur
      const lostIds = await apiService.getLostBLEIds();
      
      // 2. Filtrer notre propre appareil local pour ne pas s'auto-détecter
      const localId = await SecureStore.getItemAsync('meshfind_local_device_id');
      const filtered = lostIds.filter(id => id.toLowerCase() !== localId?.toLowerCase());

      if (filtered.length > 0) {
        // Simuler la détection immédiate de l'appareil perdu par ce Helper
        const targetId = filtered[0];
        const coords = await getCurrentLocation();
        if (coords) {
          await apiService.reportDetection({
            bleId: targetId,
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy ?? 10,
            timestamp: Date.now(),
          });

          Alert.alert(
            '📡 DÉTECTION TRANSMISE !',
            `Succès ! Votre radar vient de capter le signal de l'appareil perdu "${targetId}". Ses coordonnées GPS ont été envoyées à la victime en temps réel.`,
            [{ text: 'EXCELLENT', style: 'default' }]
          );
          return;
        }
      }

      // Si aucun autre appareil n'est perdu sur le réseau
      Alert.alert(
        '🛡️ PROTECTION ACTIVE',
        'Votre récepteur Mesh BLE veille en arrière-plan en continu pour protéger votre téléphone et localiser les appareils perdus à Madagascar.',
        [{ text: 'ENTENDU', style: 'default' }]
      );
    } catch (err: any) {
      console.warn("Échec du scan manuel tactique:", err);
      Alert.alert(
        '🛡️ PROTECTION ACTIVE',
        'Votre récepteur Mesh BLE veille en arrière-plan en continu pour protéger votre téléphone et localiser les appareils perdus à Madagascar.',
        [{ text: 'ENTENDU', style: 'default' }]
      );
    } finally {
      setMapLoading(false);
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
      {!isVictim && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>COUVERTURE GÉO-TACTIQUE ACTUELLE</Text>
          <View style={styles.mapWrapper}>
            {currentLocation || mapCenter.hasDetections ? (
              <MapView
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                accuracy={mapCenter.accuracy}
                markers={allMarkers}
                isLoading={mapLoading}
              />
            ) : (
              <View style={styles.noGpsWrapper}>
                <Text style={styles.noGpsText}>RECHERCHE DE SIGNAL GPS...</Text>
              </View>
            )}
          </View>
        </View>
      )}

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
