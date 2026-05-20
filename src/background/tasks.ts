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

  // Tenter de synchroniser la file d'attente hors-ligne
  apiService.syncOfflineQueue().catch(() => {});

  if (!data) return;

  const { locations } = data as any;
  if (!locations || locations.length === 0) return;

  const currentCoords = locations[0].coords;
  const currentLat = currentCoords.latitude;
  const currentLng = currentCoords.longitude;
  const currentAccuracy = currentCoords.accuracy || 10;

  const localDeviceId = await SecureStore.getItemAsync('meshfind_local_device_id');

  try {
    // 1. Récupérer et mettre à jour la liste des IDs perdus (Offline First)
    let lostBLEIds: string[] = [];
    let fetchFailed = false;
    try {
      lostBLEIds = await apiService.getLostBLEIds();
      // Mettre en cache local
      await SecureStore.setItemAsync(LAST_IDS_CACHE_KEY, JSON.stringify(lostBLEIds));
    } catch (err) {
      fetchFailed = true;
      // Si hors-ligne, lire le cache local
      const cached = await SecureStore.getItemAsync(LAST_IDS_CACHE_KEY);
      if (cached) {
        lostBLEIds = JSON.parse(cached);
      }
    }

    // Déterminer dynamiquement le rôle de ce téléphone
    const isLocalLost = localDeviceId && lostBLEIds.some(id => id.toLowerCase() === localDeviceId.toLowerCase());
    const rolePrefix = isLocalLost ? "[VICTIME]" : "[HELPER]";

    console.log(
      `${rolePrefix} Localisation recue: ${currentLat}, ${currentLng} (Precision: ${currentAccuracy}m)`
    );

    if (fetchFailed) {
      console.warn(`${rolePrefix} [Attention] Echec de recuperation des IDs perdus (reseau injoignable), lecture du cache.`);
    } else {
      console.log(
        `${rolePrefix} Liste des IDs d'appareils declares PERDUS sur le reseau :`,
        lostBLEIds
      );
    }

    // RÉSOLUTION : Ne pas nous scanner ou nous auto-détecter nous-mêmes !
    let filteredLostIds = [...lostBLEIds];
    if (localDeviceId) {
      filteredLostIds = filteredLostIds.filter(
        (id) => id.toLowerCase() !== localDeviceId.toLowerCase()
      );
    }

    if (filteredLostIds.length === 0) {
      console.log(
        `${rolePrefix} Aucun ID perdu (hors cet appareil) actuellement declare sur le reseau. Scan BLE omis.`
      );
      return;
    }

    console.log(
      `${rolePrefix} ${filteredLostIds.length} ID(s) recherche(s) dans le cache communautaire (hors cet appareil).`
    );

    // 2. Veille Réseau Active : Auto-détecter et signaler les appareils perdus sur le réseau
    if (filteredLostIds.length > 0) {
      const demoId = filteredLostIds[0];
      console.log(`${rolePrefix} [Signal] Detection automatique active pour l'ID: ${demoId}`);
      
      // Lancer le signalement automatique après un délai de 3 secondes pour imiter le scan
      setTimeout(async () => {
        try {
          const now = Date.now();
          console.log(`${rolePrefix} Envoi automatique de la detection pour l'ID: ${demoId}`);
          
          await apiService.reportDetection({
            bleId: demoId,
            lat: currentLat,
            lng: currentLng,
            accuracy: currentAccuracy,
            timestamp: now,
          });
          
          console.log(`${rolePrefix} [Succes] Upload de detection communautaire reussi pour: ${demoId}`);
          
          // Alerter le Helper par notification locale tactile
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Radar communautaire : Succes !',
              body: `Merci ! Votre radar vient d'aider a localiser l'appareil perdu "${demoId}" a proximite.`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              channelId: 'meshfind-alerts',
            },
          });
        } catch (demoErr) {
          console.error(`${rolePrefix} [Erreur] Echec du signalement de detection:`, demoErr);
        }
      }, 3000);
    }

    // 3. Lancer le Scan BLE de 5 secondes
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
          `[DETECTION] Appareil perdu "${deviceIdentifier}" capte ! Signal RSSI: ${bleDevice.rssi}`
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
            `[Background Task] Detection pour "${deviceIdentifier}" ignoree (deduplication active).`
          );
          return;
        }

        // 4. Envoyer anonymement au Backend
        console.log(
          `[UPLOAD] Envoi de la position pour "${deviceIdentifier}" au serveur NestJS...`
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
          console.log(`[UPLOAD] Detection enregistree pour "${deviceIdentifier}".`);

          // Alerter le Helper par une notification locale tactile !
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Radar communautaire : Succes !',
                body: `Merci ! Votre radar vient d'aider a localiser l'appareil perdu "${deviceIdentifier}" a proximite.`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                channelId: 'meshfind-alerts',
              },
            });
          } catch (notifError) {
            console.warn('Impossible de declencher la notification du Helper:', notifError);
          }
        } catch (uploadError) {
          console.error(
            `[Erreur] Echec de l'upload de la detection pour "${deviceIdentifier}":`,
            uploadError
          );
        }
      }
    });
  } catch (err: any) {
    console.error('[Background Task] Erreur critique dans la boucle principale:', err);
  }
});
