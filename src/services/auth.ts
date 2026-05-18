import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'meshfind_jwt_token';
const USER_KEY = 'meshfind_user_data';
const ONBOARDING_SEEN_KEY = 'meshfind_onboarding_seen';

export const authService = {
  // Stocker le statut de l'onboarding
  async setOnboardingSeen(): Promise<void> {
    await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, 'true');
  },

  // Récupérer le statut de l'onboarding
  async getOnboardingSeen(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
    return val === 'true';
  },
  // Stocker le token de manière sécurisée
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  // Récupérer le token
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  // Supprimer le token
  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  // Stocker les données utilisateur (non sensibles, simple cache JSON)
  async setUserData(userData: object): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
  },

  // Récupérer les données utilisateur
  async getUserData(): Promise<any | null> {
    const rawData = await SecureStore.getItemAsync(USER_KEY);
    if (!rawData) return null;
    try {
      return JSON.parse(rawData);
    } catch {
      return null;
    }
  },

  // Supprimer les données utilisateur
  async removeUserData(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  // Déconnexion complète
  async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeUserData();
  },
};
