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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function Dashboard() {
  const {
    user,
    isServiceActive,
    detectedDevices,
    currentLocation,
    updateLocation,
    lostDeviceDetections,
    devices,
    protectedCount,
    loadProtectedStats,
  } = useMesh();

  // Déterminer si l'utilisateur est une victime (a un téléphone perdu)
  const isVictim = useMemo(() => {
    return (devices || []).some((d: any) => d.isLost === true);
  }, [devices]);

  const router = useRouter();
  const { getCurrentLocation } = useLocation();
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
        // Charger le nombre de téléphones protégés via le store global
        await loadProtectedStats().catch(() => {});

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


  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Tactique Fixe */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
        <View>
          <Text style={styles.welcomeText}>OPÉRATEUR MESH</Text>
          <Text style={styles.userName}>{user?.name || 'ANONYME'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Badge de statut pulsant */}
        <View style={styles.badgeWrapper}>
          <StatusBadge isActive={isServiceActive} protectedCount={protectedCount} />
        </View>

        {/* Section Centrale Radar */}
        <View style={styles.radarSection}>
          <RadarScanner devicesCount={protectedCount} isActive={isServiceActive} />
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
                  zoom={mapCenter.hasDetections ? 18 : 15}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
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
