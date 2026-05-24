import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { MapView, MapMarker } from '../../src/components/MapView';
import { apiService } from '../../src/services/api';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Reusable accent-bar title
function AccentTitle({ label, sub }: { label: string; sub?: string }) {
  return (
    <View>
      <View style={accentStyles.row}>
        <View style={accentStyles.bar} />
        <Text style={accentStyles.title}>{label}</Text>
      </View>
      {sub ? <Text style={accentStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const accentStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bar: { width: 3, height: 14, borderRadius: 2, backgroundColor: colors.primary, marginRight: 8 },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 2,
  },
  sub: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 5,
    marginLeft: 11,
    letterSpacing: 0.5,
  },
});

export default function FollowMap() {
  const {
    currentLocation,
    devices,
    focusCoords,
    setFocusCoords,
    isServiceActive,
    protectedCount,
    loadProtectedStats,
  } = useMesh();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  useEffect(() => {
    loadProtectedStats().catch(() => {});
  }, [loadProtectedStats]);

  useEffect(() => {
    async function fetchLostDevicesDetections() {
      if (devices.length === 0) return;

      const lostDevice = devices.find((d) => d.isLost === true);
      if (!lostDevice) {
        if (currentLocation) {
          setMarkers([
            {
              id: 'my-location',
              position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
              icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00FF66" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
              size: [36, 36] as [number, number],
              title: 'Votre Position',
            },
          ]);
        }
        return;
      }

      setSelectedDeviceName(lostDevice.model);
      setLoadingHistory(true);
      try {
        const history = await apiService.getDeviceHistory(lostDevice.deviceId);
        const historyMarkers: MapMarker[] = history.map((det: any, index: number) => ({
          id: `det-${index}`,
          position: { lat: parseFloat(det.latitude), lng: parseFloat(det.longitude) },
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF3B30" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>`,
          size: [36, 36] as [number, number],
          title: `Détecté le ${new Date(parseInt(det.timestamp)).toLocaleDateString()} à ${new Date(parseInt(det.timestamp)).toLocaleTimeString()}`,
        }));

        if (currentLocation) {
          historyMarkers.push({
            id: 'my-location',
            position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00F0FF" width="36" height="36"><circle cx="12" cy="12" r="10" fill="#00F0FF" fill-opacity="0.15" stroke="#00F0FF" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#00F0FF"/><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#00F0FF" stroke-width="2" stroke-linecap="round"/></svg>`,
            size: [36, 36] as [number, number],
            title: 'Votre Position (Détecteur actif)',
          });
        }
        setMarkers(historyMarkers);

        if (history.length > 0 && !focusCoords) {
          setMapCenter({
            lat: parseFloat(history[0].latitude),
            lng: parseFloat(history[0].longitude),
            accuracy: parseFloat(history[0].accuracy || 10),
          });
        }
      } catch (err) {
        console.error("Erreur au chargement de l'historique tactique:", err);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchLostDevicesDetections();
  }, [devices, currentLocation]);

  useEffect(() => {
    if (focusCoords) {
      setMapCenter({ lat: focusCoords.lat, lng: focusCoords.lng, accuracy: 10 });
      setFocusCoords(null);
    }
  }, [focusCoords, setFocusCoords]);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <AccentTitle
          label="VISUALISEUR DE RENSEIGNEMENT"
          sub={
            selectedDeviceName
              ? undefined
              : 'VEILLE RÉSEAU MESH ACTIVÉE'
          }
        />
        {selectedDeviceName && (
          <View style={styles.trackingBadge}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={11}
              color={colors.danger}
              style={{ marginRight: 5 }}
            />
            <Text style={styles.trackingText}>
              SUIVI : {selectedDeviceName.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Map area */}
      <View style={styles.mapContainer}>
        {currentLocation || mapCenter ? (
          <MapView
            latitude={mapCenter?.lat || currentLocation?.latitude || -18.8792}
            longitude={mapCenter?.lng || currentLocation?.longitude || 47.5079}
            accuracy={mapCenter?.accuracy || currentLocation?.accuracy || 20}
            markers={markers}
            zoom={selectedDeviceName ? 18 : 14}
            isLoading={loadingHistory}
          />
        ) : (
          <View style={styles.noLocationContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.noLocationText}>INTERCEPTION DU SIGNAL GPS EN COURS</Text>
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View style={styles.panel}>
        {/* Decorative top line */}
        <View style={styles.panelTopLine} />

        <View style={styles.panelTitleRow}>
          <MaterialCommunityIcons name="signal" size={13} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.panelTitle}>RAPPORT D'ÉTAT DU SIGNAL</Text>
        </View>

        <ScrollView style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Noeuds actifs à Madagascar</Text>
            <Text style={styles.statValue}>{protectedCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Marqueurs de détections affichés</Text>
            <Text style={styles.statValue}>{markers.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Statut du récepteur BLE</Text>
            <Text
              style={[
                styles.statValue,
                { color: isServiceActive ? colors.success : colors.textSecondary },
              ]}>
              {isServiceActive ? 'ACTIF' : 'INACTIF'}
            </Text>
          </View>
          {selectedDeviceName && (
            <View style={styles.alertNotice}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={15}
                color={colors.danger}
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text style={styles.alertNoticeText}>
                Le réseau transmet en direct les coordonnées de votre{' '}
                {selectedDeviceName} perdu au terminal de recherche de la police de proximité.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '18',
    borderColor: colors.danger,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 11,
  },
  trackingText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.danger,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  mapContainer: {
    flex: 1.2,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    gap: 12,
  },
  noLocationText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  panel: {
    flex: 0.8,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  panelTopLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary + '50',
    alignSelf: 'center',
    marginBottom: 14,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  panelTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  statsScroll: {
    flex: 1,
  },
  statsContent: {
    paddingBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  alertNotice: {
    backgroundColor: colors.danger + '10',
    borderWidth: 1,
    borderColor: colors.danger + '40',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertNoticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
    flex: 1,
  },
});
