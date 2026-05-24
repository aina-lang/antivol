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

// Reusable section title with a left accent bar
function SectionTitle({ label, color = colors.primary }: { label: string; color?: string }) {
  return (
    <View style={sectionTitleStyles.row}>
      <View style={[sectionTitleStyles.bar, { backgroundColor: color }]} />
      <Text style={[sectionTitleStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const sectionTitleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bar: {
    width: 3,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  text: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
  },
});

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

  const isVictim = useMemo(
    () => (devices || []).some((d: any) => d.isLost === true),
    [devices]
  );

  const router = useRouter();
  const { getCurrentLocation } = useLocation();
  const [mapLoading, setMapLoading] = useState(false);

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

  const mapCenter = useMemo(() => {
    const hasDetections = lostDeviceDetections && lostDeviceDetections.length > 0;
    const lat = hasDetections
      ? parseFloat(lostDeviceDetections[0].latitude)
      : currentLocation?.latitude || -18.8792;
    const lng = hasDetections
      ? parseFloat(lostDeviceDetections[0].longitude)
      : currentLocation?.longitude || 47.5079;
    const accuracy = hasDetections
      ? parseFloat(lostDeviceDetections[0].accuracy)
      : currentLocation?.accuracy || 20;
    return { lat, lng, accuracy, hasDetections };
  }, [lostDeviceDetections, currentLocation]);

  const allMarkers = useMemo(() => {
    return [
      ...(currentLocation
        ? [
            {
              id: 'current-pos',
              position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
              icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00FF66" width="36" height="36">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>`,
              size: [36, 36] as [number, number],
              title: 'Votre Position Actuelle',
            },
          ]
        : []),
      ...detectionMarkers,
    ];
  }, [currentLocation, detectionMarkers]);

  useEffect(() => {
    async function initDashboard() {
      setMapLoading(true);
      try {
        await loadProtectedStats().catch(() => {});
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

    if (isServiceActive) {
      foregroundLocationService.startService().catch((err) => {
        console.warn('Erreur auto-start Foreground Service:', err);
        if (err.message?.includes('arrière-plan')) {
          Alert.alert(
            'Protection active requise',
            'Pour sécuriser votre appareil en arrière-plan, veuillez accorder la permission de localisation "Toujours" dans les paramètres.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Paramètres', onPress: () => Linking.openSettings() },
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

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: colors.primary, marginRight: 8 }} />
              <Text style={{ fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 }}>OPÉRATEUR MESH</Text>
            </View>
            <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: colors.textSecondary, marginTop: 5, marginLeft: 11, letterSpacing: 0.5 }}>{user?.name?.toUpperCase() || 'ANONYME'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name="shield-account-outline"
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}>

        {/* Status badge */}
        <View style={styles.badgeWrapper}>
          <StatusBadge isActive={isServiceActive} protectedCount={protectedCount} />
        </View>

        {/* Radar section */}
        <View style={styles.radarSection}>
          <RadarScanner devicesCount={protectedCount} isActive={isServiceActive} />
        </View>

        {/* BLE alerts */}
        {detectedDevices.length > 0 && (
          <View style={styles.alertSection}>
            <SectionTitle label="ALERTES INTERCEPTÉES" color={colors.danger} />
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

        {/* Mini-map */}
        {!isVictim && (
          <View style={styles.mapSection}>
            <SectionTitle label="COUVERTURE GÉO-TACTIQUE" />
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
                  <MaterialCommunityIcons
                    name="satellite-uplink"
                    size={24}
                    color={colors.textMuted}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={styles.noGpsText}>RECHERCHE DE SIGNAL GPS</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Declare lost button */}
        <TouchableOpacity
          style={styles.lostButton}
          onPress={() => router.push('/declare-lost')}
          activeOpacity={0.85}>
          <MaterialCommunityIcons
            name="alert-decagram-outline"
            size={18}
            color={colors.textPrimary}
            style={{ marginRight: 10 }}
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
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '18',
    zIndex: 10,
  },

  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrapper: {
    marginBottom: 24,
    marginTop: 4,
  },
  radarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  alertSection: {
    marginVertical: 16,
  },
  mapSection: {
    marginVertical: 16,
  },
  mapWrapper: {
    height: 185,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  noGpsWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noGpsText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  lostButton: {
    width: '100%',
    height: 60,
    backgroundColor: colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 24,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  lostButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },
});

export type {} from 'react-native';
