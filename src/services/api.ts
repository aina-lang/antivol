import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '../constants/config';
import { authService } from './auth';

const OFFLINE_QUEUE_KEY = 'meshfind_offline_detections_queue';

export interface OfflineDetection {
  bleId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export const api = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter automatiquement le JWT
api.interceptors.request.use(
  async (req) => {
    const token = await authService.getToken();
    if (token && req.headers) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints et services API
export const apiService = {
  // --- AUTHENTIFICATION ---
  async login(email: string, password: string): Promise<any> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<any> {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async verifyEmail(email: string, code: string): Promise<any> {
    const response = await api.post('/auth/verify-email', { email, code });
    return response.data;
  },

  async forgotPassword(email: string): Promise<any> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(payload: { email: string; code: string; password?: string }): Promise<any> {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },

  async updateProfile(payload: { name?: string; password?: string }): Promise<any> {
    const response = await api.put('/auth/profile', payload);
    return response.data;
  },

  // Enregistrer cet appareil
  async registerDevice(deviceId: string, model: string, expoPushToken?: string): Promise<any> {
    const response = await api.post('/devices/register', { deviceId, model, expoPushToken });
    return response.data;
  },

  // Déclarer l'appareil du compte perdu
  async declareLost(description?: string): Promise<any> {
    const response = await api.post('/devices/lost', { description });
    return response.data;
  },

  // Annuler l'alerte de perte (sécuriser l'appareil)
  async declareSecured(): Promise<any> {
    const response = await api.post('/devices/secure');
    return response.data;
  },

  // Récupérer la liste des miens
  async getMyDevices(): Promise<any> {
    const response = await api.get('/devices/mine');
    return response.data;
  },

  // Récupérer la liste des IDs BLE perdus (cache local pour scan offline)
  async getLostBLEIds(): Promise<string[]> {
    try {
      const response = await api.get('/devices/lost-ids');
      return response.data; // Tableau de chaînes (les IDs BLE rotatifs perdus)
    } catch (error) {
      console.warn(
        'Impossible de charger les IDs perdus depuis le serveur, utilisation du cache vide.',
        error
      );
      return [];
    }
  },

  // Synchroniser la file d'attente hors-ligne si la connexion est revenue
  async syncOfflineQueue(): Promise<void> {
    try {
      const rawQueue = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
      if (!rawQueue) return;

      const queue: OfflineDetection[] = JSON.parse(rawQueue);
      if (queue.length === 0) return;

      console.log(`[Sync Queue] Detection de ${queue.length} rapports en attente de synchronisation...`);

      const remainingQueue: OfflineDetection[] = [];

      for (const item of queue) {
        try {
          // Tenter d'envoyer directement via l'API brute
          await api.post('/detections', item);
          console.log(`[Sync Queue] Rapport synchronise avec succes pour l'ID: ${item.bleId}`);
        } catch (err: any) {
          // Si cela échoue encore à cause du réseau, on le garde dans la file
          if (!err.response || err.message === 'Network Error') {
            remainingQueue.push(item);
          } else {
            // Si c'est une autre erreur (ex: mauvaise donnée, id inexistant), on le supprime pour ne pas bloquer la file
            console.warn(`[Sync Queue] Suppression d'un rapport invalide de la file d'attente:`, err.message);
          }
        }
      }

      if (remainingQueue.length > 0) {
        await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
      } else {
        await SecureStore.deleteItemAsync(OFFLINE_QUEUE_KEY);
        console.log('[Sync Queue] Tous les rapports hors-ligne ont ete synchronises avec succes !');
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation de la file hors-ligne:', error);
    }
  },

  // --- DÉTECTION (RÉSEAU MESH) ---
  // Envoyer la position d'un téléphone perdu détecté anonymement (avec Queue Hors-ligne)
  async reportDetection(payload: {
    bleId: string;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  }): Promise<any> {
    try {
      // 1. Tenter d'envoyer la détection immédiatement
      const response = await api.post('/detections', payload);
      
      // 2. Si l'envoi réussit, tenter de synchroniser la file d'attente en arrière-plan
      this.syncOfflineQueue().catch(() => {});

      return response.data;
    } catch (error: any) {
      // 3. En cas d'erreur de réseau (hors-ligne), empiler dans la file d'attente
      if (!error.response || error.message === 'Network Error') {
        console.log(`[Offline Queue] Telephone hors-ligne. Mise en file d'attente de la detection pour "${payload.bleId}"...`);
        try {
          const rawQueue = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
          const queue: OfflineDetection[] = rawQueue ? JSON.parse(rawQueue) : [];
          
          // Vérifier si cette détection n'est pas déjà présente dans la queue pour éviter les doublons
          const isDuplicate = queue.some(
            q => q.bleId === payload.bleId && Math.abs(q.timestamp - payload.timestamp) < 10000
          );
          
          if (!isDuplicate) {
            queue.push(payload);
            await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
            console.log(`[Offline Queue] Detection sauvegardee localement (${queue.length} en attente).`);
          }
        } catch (storeErr) {
          console.error("Echec d'enregistrement local de la detection hors-ligne:", storeErr);
        }
      }
      throw error;
    }
  },

  // Récupérer l'historique des positions pour mon appareil perdu
  async getDeviceHistory(deviceId: string): Promise<any> {
    const response = await api.get(`/devices/${deviceId}/history`);
    return response.data;
  },

  // Récupérer les statistiques globales (appareils protégés à proximité)
  async getProtectedStats(): Promise<{ count: number }> {
    try {
      const response = await api.get('/devices/stats');
      return response.data;
    } catch {
      // Fallback local réaliste si le backend n'est pas connecté
      return { count: 0 };
    }
  },
};
