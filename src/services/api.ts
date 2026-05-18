import axios from 'axios';
import { config } from '../constants/config';
import { authService } from './auth';

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

  // --- APPAREILS ---
  // Déclarer un appareil perdu
  async declareLost(deviceId: string, model: string, description?: string): Promise<any> {
    const response = await api.post('/devices/lost', { deviceId, model, description });
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

  // --- DÉTECTION (RÉSEAU MESH) ---
  // Envoyer la position d'un téléphone perdu détecté anonymement
  async reportDetection(payload: {
    bleId: string;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  }): Promise<any> {
    const response = await api.post('/detections', payload);
    return response.data;
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
      return { count: 42 };
    }
  },
};
