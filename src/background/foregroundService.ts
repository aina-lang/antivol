import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { config } from '../constants/config';

export const foregroundLocationService = {
  // Démarrer le Foreground Service Android / Tracking iOS
  async startService(): Promise<void> {
    try {
      // 1. Vérifier les permissions en premier plan et arrière-plan
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        throw new Error('Permission de localisation au premier plan refusée.');
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        throw new Error('Permission de localisation en arrière-plan refusée.');
      }

      // 2. Vérifier si la tâche tourne déjà
      const isRegistered = await TaskManager.isTaskRegisteredAsync(config.MESH_MAIN_TASK);
      if (isRegistered) {
        return;
      }

      console.log(
        'Démarrage du service de géolocalisation d’arrière-plan (Android Foreground Service)...'
      );

      // 3. Lancer la tâche récurrente
      await Location.startLocationUpdatesAsync(config.MESH_MAIN_TASK, {
        accuracy: Location.Accuracy.Balanced,
        // Options Android pour le Foreground Service persistent
        foregroundService: {
          notificationTitle: 'MeshFind — Réseau Actif',
          notificationBody: 'Vous sécurisez la communauté de Madagascar.',
          notificationColor: '#00D4FF',
        },
        // Options iOS / Android
        timeInterval: config.BLE_SCAN_INTERVAL,
        distanceInterval: 10, // Déclencher s'il se déplace de 10m
        showsBackgroundLocationIndicator: true,
      });

      console.log('Service démarré avec succès.');
    } catch (error: any) {
      console.error('Échec du démarrage du service de localisation', error);
      throw error;
    }
  },

  // Arrêter le service
  async stopService(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(config.MESH_MAIN_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(config.MESH_MAIN_TASK);
        console.log('Foreground Service arrêté avec succès.');
      }
    } catch (error) {
      console.error('Erreur lors de l’arrêt du service de localisation', error);
    }
  },

  // Vérifier l'état d'enregistrement
  async isRunning(): Promise<boolean> {
    return await TaskManager.isTaskRegisteredAsync(config.MESH_MAIN_TASK);
  },
};
