import { Platform } from 'react-native';

// Host pour émulateur vs appareil réel/simulateur
const DEV_API_URL = Platform.select({
  android: 'http://192.168.1.170:3000',
  ios: 'http://192.168.1.170:3000',
  default: 'http://192.168.1.170:3000',
});

export const config = {
  // Client API URL
  API_URL: DEV_API_URL,

  // Tâche principale en arrière-plan
  MESH_MAIN_TASK: 'meshfind-main-task',

  // Intervalles de fonctionnement du scanner BLE
  BLE_SCAN_INTERVAL: 20000, // Lance un scan toutes les 20 secondes
  BLE_SCAN_DURATION: 5000, // Durée de scan actif de 5 secondes

  // Déduplication des localisations (pour limiter l'usage de la bande passante)
  DEDUPLICATION_RADIUS_METERS: 50, // Pas d'envoi si la position a bougé de moins de 50m
  DEDUPLICATION_TIME_MS: 30000, // Pas d'envoi si la dernière détection est à moins de 30 secondes
};
