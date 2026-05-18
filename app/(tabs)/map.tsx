import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';
import { MapView, MapMarker } from '../../src/components/MapView';
import { apiService } from '../../src/services/api';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FollowMap() {
  const { currentLocation, devices } = useMesh();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(null);

  // Charger l'historique des détections pour les appareils déclarés perdus
  useEffect(() => {
    async function fetchLostDevicesDetections() {
      if (devices.length === 0) return;

      const lostDevice = devices.find((d) => d.isLost === true);
      if (!lostDevice) {
        // Aucun appareil perdu, n'afficher que la position de l'utilisateur
        if (currentLocation) {
          setMarkers([
            {
              id: 'my-location',
              position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
              icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00FF66" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
              size: [36, 36],
              title: 'Votre Position',
            },
          ]);
        }
        return;
      }

      setSelectedDeviceName(lostDevice.model);
      setLoadingHistory(true);
      try {
        const history = await apiService.getDeviceHistory(lostDevice.id);

        const historyMarkers: MapMarker[] = history.map((det: any, index: number) => ({
          id: `det-${index}`,
          position: { lat: det.lat, lng: det.lng },
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF3B30" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>`,
          size: [36, 36],
          title: `Détecté le ${new Date(det.timestamp).toLocaleDateString()} à ${new Date(det.timestamp).toLocaleTimeString()}`,
        }));

        // Ajouter la position de l'opérateur courant en vert/bleu
        if (currentLocation) {
          historyMarkers.push({
            id: 'my-location',
            position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00F0FF" width="36" height="36"><circle cx="12" cy="12" r="10" fill="#00F0FF" fill-opacity="0.15" stroke="#00F0FF" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#00F0FF"/><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#00F0FF" stroke-width="2" stroke-linecap="round"/></svg>`,
            size: [36, 36],
            title: 'Votre Position (Détecteur actif)',
          });
        }

        setMarkers(historyMarkers);
      } catch (err) {
        console.error('Erreur au chargement de l’historique tactique:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchLostDevicesDetections();
  }, [devices, currentLocation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* En-tête de carte */}
      <View style={styles.header}>
        <Text style={styles.title}>VISUALISEUR DE RENSEIGNEMENT</Text>
        {selectedDeviceName ? (
          <View style={styles.trackingBadge}>
            <Text style={styles.trackingText}>
              SUIVI ACTIF : {selectedDeviceName.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={styles.subText}>VEILLE RÉSEAU MESH ACTIVÉE</Text>
        )}
      </View>

      {/* Zone Cartographique */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
            accuracy={currentLocation.accuracy}
            markers={markers}
            zoom={selectedDeviceName ? 16 : 14}
            isLoading={loadingHistory}
          />
        ) : (
          <View style={styles.noLocationContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.noLocationText}>INTERCEPTIONS DU SIGNAL GPS EN COURS...</Text>
          </View>
        )}
      </View>

      {/* Overlay du bas de carte (Rapport tactique) */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>RAPPORT SUR L’ÉTAT DU SIGNAL</Text>

        <ScrollView style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Noeuds actifs à Madagascar</Text>
            <Text style={styles.statValue}>1,248</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Marqueurs de détections affichés</Text>
            <Text style={styles.statValue}>{markers.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Statut du récepteur BLE</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>OPÉRATIONNEL</Text>
          </View>
          {selectedDeviceName && (
            <View style={styles.alertNotice}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={colors.danger}
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text style={styles.alertNoticeText}>
                Le réseau transmet en direct les coordonnées de votre {selectedDeviceName} perdu
                au terminal de recherche de la police de proximité.
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
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 2,
  },
  subText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  trackingBadge: {
    backgroundColor: colors.danger + '20',
    borderColor: colors.danger,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  trackingText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.danger,
    fontWeight: 'bold',
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
  },
  noLocationText: {
    marginTop: 12,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
  },
  panel: {
    flex: 0.8,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginTop: 16,
    padding: 20,
  },
  panelTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
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
    paddingVertical: 8,
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
    borderRadius: 8,
    padding: 10,
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
