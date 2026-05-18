import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { config } from '../constants/config';
import { bleScannerService } from './bleScanner';
import { apiService } from '../services/api';

const LAST_IDS_CACHE_KEY = 'meshfind_lost_ids_cache';
const REPORTED_CACHE_KEY = 'meshfind_reported_dedup_cache';

interface ReportedCacheEntry {
  bleId: string;
  lat: number;
  lng: number;
  timestamp: number;
}

// Calcul de la distance géodésique simplifiée (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Définir la tâche principale
TaskManager.defineTask(config.MESH_MAIN_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Erreur lors du cycle de Foreground Service:', error.message);
    return;
  }

  if (!data) return;

  const { locations } = data as any;
  if (!locations || locations.length === 0) return;

  const currentCoords = locations[0].coords;
  const currentLat = currentCoords.latitude;
  const currentLng = currentCoords.longitude;
  const currentAccuracy = currentCoords.accuracy || 10;

  console.log(
    `[Background Task] Localisation reçue: ${currentLat}, ${currentLng} (Précision: ${currentAccuracy}m)`
  );

  try {
    // 1. Récupérer et mettre à jour la liste des IDs perdus (Offline First)
    let lostBLEIds: string[] = [];
    try {
      lostBLEIds = await apiService.getLostBLEIds();
      // Mettre en cache local
      await SecureStore.setItemAsync(LAST_IDS_CACHE_KEY, JSON.stringify(lostBLEIds));
    } catch {
      // Si hors-ligne, lire le cache local
      const cached = await SecureStore.getItemAsync(LAST_IDS_CACHE_KEY);
      if (cached) {
        lostBLEIds = JSON.parse(cached);
      }
    }

    if (lostBLEIds.length === 0) {
      console.log(
        '[Background Task] Aucun ID perdu actuellement déclaré sur le réseau. Scan BLE omis.'
      );
      return;
    }

    console.log(
      `[Background Task] ${lostBLEIds.length} ID(s) recherché(s) dans le cache communautaire.`
    );

    // 2. Lancer le Scan BLE de 5 secondes
    await bleScannerService.scanForLostDevices(config.BLE_SCAN_DURATION, async (bleDevice) => {
      // Déterminer l'ID de détection
      // Le BLE device id (MAC/UUID) ou son nom local
      const deviceIdentifier = bleDevice.name || bleDevice.id;

      // Vérifier si le signal détecté correspond à un ID recherché
      const isLost = lostBLEIds.some(
        (lostId) =>
          lostId.toLowerCase() === bleDevice.id.toLowerCase() ||
          (bleDevice.name && lostId.toLowerCase() === bleDevice.name.toLowerCase())
      );

      if (isLost) {
        console.log(
          `🚨 [DÉTECTION] Appareil perdu "${deviceIdentifier}" capté ! Signal RSSI: ${bleDevice.rssi}`
        );

        // 3. Appliquer la déduplication
        let reportedCache: ReportedCacheEntry[] = [];
        const rawCache = await SecureStore.getItemAsync(REPORTED_CACHE_KEY);
        if (rawCache) {
          try {
            reportedCache = JSON.parse(rawCache);
          } catch {
            reportedCache = [];
          }
        }

        // Nettoyer les anciennes entrées expirées de la déduplication (ex: > 5 minutes)
        const now = Date.now();
        reportedCache = reportedCache.filter((entry) => now - entry.timestamp < 300000);

        // Vérifier si nous avons déjà reporté cet ID récemment aux mêmes coordonnées
        const alreadyReported = reportedCache.some((entry) => {
          if (entry.bleId !== bleDevice.id) return false;
          const dist = getDistance(currentLat, currentLng, entry.lat, entry.lng);
          const timeElapsed = now - entry.timestamp;

          return (
            dist < config.DEDUPLICATION_RADIUS_METERS && timeElapsed < config.DEDUPLICATION_TIME_MS
          );
        });

        if (alreadyReported) {
          console.log(
            `[Background Task] Détection pour "${deviceIdentifier}" ignorée (déduplication active).`
          );
          return;
        }

        // 4. Envoyer anonymement au Backend
        console.log(
          `📡 [UPLOAD] Envoi de la position pour "${deviceIdentifier}" au serveur NestJS...`
        );
        try {
          await apiService.reportDetection({
            bleId: bleDevice.id,
            lat: currentLat,
            lng: currentLng,
            accuracy: currentAccuracy,
            timestamp: now,
          });

          // Mettre en cache la déduction locale
          reportedCache.push({
            bleId: bleDevice.id,
            lat: currentLat,
            lng: currentLng,
            timestamp: now,
          });
          await SecureStore.setItemAsync(REPORTED_CACHE_KEY, JSON.stringify(reportedCache));
          console.log(`✅ [UPLOAD] Détection enregistrée pour "${deviceIdentifier}".`);

          // Alerter le Helper par une notification locale tactile !
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🚨 Radar communautaire : Succès !',
                body: `Merci ! Votre radar vient d'aider à localiser l'appareil perdu "${deviceIdentifier}" à proximité.`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null,
            });
          } catch (notifError) {
            console.warn('Impossible de déclencher la notification du Helper:', notifError);
          }
        } catch (uploadError) {
          console.error(
            `❌ Échec de l'upload de la détection pour "${deviceIdentifier}":`,
            uploadError
          );
        }
      }
    });
  } catch (err: any) {
    console.error('[Background Task] Erreur critique dans la boucle principale:', err);
  }
});
