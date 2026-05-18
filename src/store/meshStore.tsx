import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import { notificationService } from '../services/notifications';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface DetectedBLEDevice {
  bleId: string;
  rssi: number;
  timestamp: number;
}

interface MeshAlert {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

interface MeshContextType {
  user: any | null;
  devices: any[];
  detectedDevices: DetectedBLEDevice[];
  isServiceActive: boolean;
  alerts: MeshAlert[];
  currentLocation: LocationCoords | null;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
  isSessionLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (payload: { email: string; code: string; password?: string }) => Promise<any>;
  logout: () => Promise<void>;
  loadMyDevices: () => Promise<void>;
  declareDeviceLost: (deviceId: string, model: string, description?: string) => Promise<void>;
  toggleService: (active: boolean) => Promise<void>;
  updateLocation: (coords: LocationCoords) => void;
  addAlert: (alert: Omit<MeshAlert, 'id' | 'timestamp'>) => void;
  setDetectedDevices: React.Dispatch<React.SetStateAction<DetectedBLEDevice[]>>;
}

const MeshContext = createContext<MeshContextType | undefined>(undefined);

export const MeshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [detectedDevices, setDetectedDevices] = useState<DetectedBLEDevice[]>([]);
  const [isServiceActive, setIsServiceActive] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<MeshAlert[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);

  // Charger la session utilisateur au démarrage
  useEffect(() => {
    async function loadSession() {
      try {
        const storedUser = await authService.getUserData();
        const storedToken = await authService.getToken();
        const seen = await authService.getOnboardingSeen();
        setHasSeenOnboarding(seen);
        if (storedUser && storedToken) {
          setUser(storedUser);
          // Charger ses appareils s'il est connecté
          const myDevices = await apiService.getMyDevices().catch(() => []);
          setDevices(myDevices);
        }
      } catch (error) {
        console.error('Erreur au chargement de la session', error);
      } finally {
        setIsSessionLoading(false);
      }
    }
    loadSession();

    // S'abonner aux notifications push
    const receivedSub = notificationService.addReceivedListener((notif) => {
      addAlert({
        title: notif.request.content.title || 'Signal détecté !',
        body: notif.request.content.body || 'Un appareil du réseau mesh a été détecté.',
      });
    });

    return () => {
      receivedSub.remove();
    };
  }, []);

  // --- ACTIONS ---

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.login(email, password);
      setUser(data.user);
      await authService.setToken(data.accessToken || data.token);
      await authService.setUserData(data.user);
      // Charger les appareils après connexion
      const myDevices = await apiService.getMyDevices().catch(() => []);
      setDevices(myDevices);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.register(name, email, password);
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.verifyEmail(email, code);
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Code OTP de validation invalide');
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      return await apiService.forgotPassword(email);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de demande de réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (payload: { email: string; code: string; password?: string }) => {
    setIsLoading(true);
    try {
      return await apiService.resetPassword(payload);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de réinitialisation de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    await authService.setOnboardingSeen();
    setHasSeenOnboarding(true);
  };

  const logout = async () => {
    await authService.clearAll();
    setUser(null);
    setDevices([]);
  };

  const loadMyDevices = async () => {
    try {
      const myDevices = await apiService.getMyDevices();
      setDevices(myDevices);
    } catch (error) {
      console.error('Erreur de chargement des appareils', error);
    }
  };

  const declareDeviceLost = async (deviceId: string, model: string, description?: string) => {
    try {
      await apiService.declareLost(deviceId, model, description);
      await loadMyDevices();
      addAlert({
        title: 'Recherche active !',
        body: `Votre ${model} est recherché par le réseau MeshFind à Madagascar.`,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors du signalement');
    }
  };

  const toggleService = async (active: boolean) => {
    setIsServiceActive(active);
    addAlert({
      title: active ? 'Réseau activé' : 'Réseau désactivé',
      body: active
        ? 'Votre téléphone participe à la recherche et est protégé par le réseau.'
        : 'Recherche suspendue. Vous ne recevrez plus de signaux mesh.',
    });
  };

  const updateLocation = (coords: LocationCoords) => {
    setCurrentLocation(coords);
  };

  const addAlert = (alert: Omit<MeshAlert, 'id' | 'timestamp'>) => {
    const newAlert: MeshAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  return (
    <MeshContext.Provider
      value={{
        user,
        devices,
        detectedDevices,
        isServiceActive,
        alerts,
        currentLocation,
        hasSeenOnboarding,
        completeOnboarding,
        isLoading,
        isSessionLoading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        loadMyDevices,
        declareDeviceLost,
        toggleService,
        updateLocation,
        addAlert,
        setDetectedDevices,
      }}>
      {children}
    </MeshContext.Provider>
  );
};

export const useMesh = () => {
  const context = useContext(MeshContext);
  if (context === undefined) {
    throw new Error('useMesh doit être utilisé au sein d’un MeshProvider');
  }
  return context;
};
