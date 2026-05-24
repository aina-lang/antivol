import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import { notificationService } from '../services/notifications';
import * as Notifications from 'expo-notifications';

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
  lat?: number;
  lng?: number;
}

interface MeshContextType {
  user: any | null;
  devices: any[];
  localDevice: { deviceId: string; model: string } | null;
  detectedDevices: DetectedBLEDevice[];
  isServiceActive: boolean;
  alerts: MeshAlert[];
  currentLocation: LocationCoords | null;
  hasSeenOnboarding: boolean;
  lostDeviceDetections: any[];
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
  isSessionLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (payload: { email: string; code: string; password?: string }) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (payload: { name?: string; password?: string }) => Promise<void>;
  registerCurrentDevice: (forceReplace?: boolean) => Promise<void>;
  loadMyDevices: () => Promise<void>;
  declareDeviceLost: (description?: string) => Promise<void>;
  declareDeviceSecured: () => Promise<void>;
  toggleService: (active: boolean) => Promise<void>;
  updateLocation: (coords: LocationCoords) => void;
  addAlert: (alert: Omit<MeshAlert, 'id' | 'timestamp'>) => void;
  setDetectedDevices: React.Dispatch<React.SetStateAction<DetectedBLEDevice[]>>;
  focusCoords: { lat: number; lng: number } | null;
  setFocusCoords: (coords: { lat: number; lng: number } | null) => void;
  deleteAlert: (id: string) => void;
  clearAllAlerts: () => void;
  deleteDetection: (id: string) => void;
  clearAllDetections: () => void;
  protectedCount: number;
  loadProtectedStats: () => Promise<void>;
}

const MeshContext = createContext<MeshContextType | undefined>(undefined);

export const MeshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [localDevice, setLocalDevice] = useState<{ deviceId: string; model: string } | null>(null);
  const [detectedDevices, setDetectedDevices] = useState<DetectedBLEDevice[]>([]);
  const [isServiceActive, setIsServiceActive] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<MeshAlert[]>([]);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [lostDeviceDetections, setLostDeviceDetections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [protectedCount, setProtectedCount] = useState<number>(0);

  // Récupérer ou générer les infos persistantes du terminal local
  const getLocalDeviceDetails = async () => {
    let id = await SecureStore.getItemAsync('meshfind_local_device_id');
    if (!id) {
      id = 'MF-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await SecureStore.setItemAsync('meshfind_local_device_id', id);
    }
    const brandName = Device.brand ? Device.brand : '';
    const modelName = Device.modelName ? Device.modelName : 'Terminal Mesh';
    const fullModel = brandName ? `${brandName} ${modelName}` : modelName;
    return { deviceId: id, model: fullModel };
  };

  const loadProtectedStats = useCallback(async () => {
    try {
      const stats = await apiService.getProtectedStats();
      if (stats && typeof stats.count === 'number') {
        setProtectedCount(stats.count);
      }
    } catch (err) {
      console.warn("Échec du chargement des statistiques de protection:", err);
    }
  }, []);

  // Charger la session utilisateur au démarrage
  useEffect(() => {
    async function loadSession() {
      try {
        const storedUser = await authService.getUserData();
        const storedToken = await authService.getToken();
        const seen = await authService.getOnboardingSeen();
        setHasSeenOnboarding(seen);

        const details = await getLocalDeviceDetails();
        setLocalDevice(details);

        let pushToken = undefined;
        try {
          const fetchedToken = await notificationService.registerForPushNotificationsAsync();
          if (fetchedToken) pushToken = fetchedToken;
        } catch (pushErr) {
          console.warn("Echec d'obtention du token push pour enregistrement", pushErr);
        }

        if (storedUser && storedToken) {
          setUser(storedUser);
          // Auto-enregistrer l'appareil sous le compte connecté (Un téléphone = Un compte seulement)
          try {
            await apiService.registerDevice(details.deviceId, details.model, pushToken);
          } catch (regErr) {
            console.warn("Echec d'auto-enregistrement de l'appareil", regErr);
          }
          // Charger ses appareils s'il est connecté
          const myDevices = await apiService.getMyDevices().catch(() => []);
          setDevices(myDevices);
        }
        await loadProtectedStats().catch(() => {});
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

  const [prevHistoryCount, setPrevHistoryCount] = useState<number | null>(null);

  // Surveiller en temps réel l'apparition de nouvelles détections pour notre appareil perdu
  useEffect(() => {
    const lostDevice = devices.find((d) => d.isLost === true);
    if (!lostDevice) {
      setPrevHistoryCount(null);
      setLostDeviceDetections([]);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    // Charger le compte initial pour éviter de notifier des anciennes détections historiques
    const initHistory = async () => {
      try {
        const history = await apiService.getDeviceHistory(lostDevice.deviceId);
        if (isMounted) {
          setPrevHistoryCount(history.length);
          setLostDeviceDetections(history);
        }
      } catch (err: any) {
        if (err.message === 'Network Error' || !err.response) {
          console.log("[Suivi Detection] Telephone hors-ligne au demarrage (veille reseau).");
        } else if (err.response?.status === 404) {
          // L'appareil n'existe plus en DB (remplacé par forceReplace) → forcer un refresh
          console.log("[Suivi Detection] Appareil introuvable (404), rafraichissement de la liste...");
          if (isMounted) loadMyDevices().catch(() => {});
        } else {
          console.error("Erreur d'initialisation de l'ecouteur de detection:", err);
        }
      }
    };

    initHistory();

    intervalId = setInterval(async () => {
      try {
        loadProtectedStats().catch(() => {});
        const history = await apiService.getDeviceHistory(lostDevice.deviceId);
        if (!isMounted) return;

        setLostDeviceDetections(prev => {
          if (JSON.stringify(prev) === JSON.stringify(history)) {
            return prev;
          }
          return history;
        });

        if (prevHistoryCount !== null && history.length > prevHistoryCount) {
          // Une nouvelle détection a été enregistrée !
          const newDetection = history[0]; // La plus récente est en premier
          
          if (localDevice?.deviceId !== lostDevice.deviceId) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Appareil repere !',
                body: `Votre appareil "${lostDevice.model.toUpperCase()}" vient d'etre localise par le reseau communautaire MeshFind a Madagascar !`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                channelId: 'meshfind-alerts',
              },
            });

            addAlert({
              title: 'Appareil repere !',
              body: `Localise a ${new Date(parseInt(newDetection.timestamp)).toLocaleTimeString()}`,
              lat: parseFloat(newDetection.latitude),
              lng: parseFloat(newDetection.longitude),
            });
          }
        }
        
        // Mettre à jour le compte
        setPrevHistoryCount(history.length);
      } catch (err: any) {
        if (err.message === 'Network Error' || !err.response) {
          console.log("[Suivi Detection] Telephone hors-ligne (veille reseau).");
        } else if (err.response?.status === 404) {
          // L'appareil n'existe plus en DB (remplacé par forceReplace) → forcer un refresh
          console.log("[Suivi Detection] Appareil introuvable (404), rafraichissement de la liste...");
          if (isMounted) loadMyDevices().catch(() => {});
        } else {
          console.error("Erreur de suivi temps-reel de detection:", err);
        }
      }
    }, 7000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [devices, prevHistoryCount, loadMyDevices]);

  // Écouteur et scanner autonome pour le Helper (Téléphone B) en premier plan (Foreground Loop)
  useEffect(() => {
    if (!user) return;

    // Si cet appareil lui-même est déclaré perdu, il ne doit pas scanner pour d'autres
    const lostDevice = devices.find((d) => d.isLost === true);
    if (lostDevice) return;

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    intervalId = setInterval(async () => {
      try {
        loadProtectedStats().catch(() => {});
        // Tenter de synchroniser la file d'attente hors-ligne si la connexion est revenue
        apiService.syncOfflineQueue().catch(() => {});

        // 1. Récupérer les IDs perdus actifs sur le réseau
        const lostIds = await apiService.getLostBLEIds();
        if (lostIds.length === 0) return;

        // 2. Récupérer notre propre ID local pour l'exclure (anti-auto-détection)
        const localId = await SecureStore.getItemAsync('meshfind_local_device_id');
        const filtered = lostIds.filter(id => id.toLowerCase() !== localId?.toLowerCase());

        if (filtered.length > 0 && isMounted) {
          const targetId = filtered[0];
          console.log(`[Telephone B - HELPER] Auto-Scan : Detection automatique autonome de l'ID perdu "${targetId}"`);

          // 3. Obtenir la position GPS (instantanée, fallback si besoin)
          const hasPermission = await Location.getForegroundPermissionsAsync();
          if (hasPermission.status !== 'granted') return;

          const location = await Location.getLastKnownPositionAsync({});
          const lat = location?.coords.latitude || -18.8792;
          const lng = location?.coords.longitude || 47.5079;
          const accuracy = location?.coords.accuracy || 10;

          // 4. Téléverser automatiquement la détection
          await apiService.reportDetection({
            bleId: targetId,
            lat,
            lng,
            accuracy,
            timestamp: Date.now(),
          });

          console.log(`[Telephone B - HELPER] Upload autonome de detection reussi pour "${targetId}" !`);

          // 5. Alerter l'Helper par une notification locale
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Radar communautaire : Succes !',
              body: `Merci ! Votre radar vient d'aider a localiser l'appareil perdu "${targetId}" a Madagascar.`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              channelId: 'meshfind-alerts',
            },
          });

          addAlert({
            title: 'Radar communautaire : Succes !',
            body: `Appareil perdu "${targetId}" localise et signale.`,
            lat,
            lng,
          });
        }
      } catch (err: any) {
        if (err.message === 'Network Error' || !err.response) {
          console.log("[Auto-Scan Helper] Telephone hors-ligne (en attente de connexion).");
        } else {
          console.error("Erreur dans la boucle autonome du Helper:", err);
        }
      }
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, devices]);

  // --- ACTIONS ---

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.login(email, password);
      setUser(data.user);
      await authService.setToken(data.accessToken || data.token);
      await authService.setUserData(data.user);

      // Auto-enregistrer le terminal après connexion
      const details = await getLocalDeviceDetails();
      setLocalDevice(details);

      let pushToken = undefined;
      try {
        const fetchedToken = await notificationService.registerForPushNotificationsAsync();
        if (fetchedToken) pushToken = fetchedToken;
      } catch (pushErr) {
        console.warn("Echec d'obtention du token push après connexion", pushErr);
      }

      try {
        await apiService.registerDevice(details.deviceId, details.model, pushToken);
      } catch (regErr) {
        console.warn("Echec d'auto-enregistrement du terminal après connexion", regErr);
      }

      // Charger les appareils
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

  const updateProfile = async (payload: { name?: string; password?: string }) => {
    try {
      const updatedUser = await apiService.updateProfile(payload);
      setUser(updatedUser);
      await authService.setUserData(updatedUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const registerCurrentDevice = async (forceReplace?: boolean) => {
    try {
      const details = await getLocalDeviceDetails();
      let pushToken = undefined;
      try {
        const fetchedToken = await notificationService.registerForPushNotificationsAsync();
        if (fetchedToken) pushToken = fetchedToken;
      } catch (pushErr) {
        console.warn("Echec d'obtention du token push lors de l'association", pushErr);
      }
      await apiService.registerDevice(details.deviceId, details.model, pushToken, forceReplace);
      await loadMyDevices();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de l'association de l'appareil");
    }
  };

  const loadMyDevices = useCallback(async () => {
    try {
      const myDevices = await apiService.getMyDevices();
      setDevices(myDevices);
    } catch (error) {
      console.error('Erreur de chargement des appareils', error);
    }
  }, []);

  const declareDeviceLost = async (description?: string) => {
    try {
      await apiService.declareLost(description);
      await loadMyDevices();
      await loadProtectedStats().catch(() => {});
      addAlert({
        title: 'Recherche active !',
        body: `Votre appareil est recherché par le réseau MeshFind à Madagascar.`,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors du signalement');
    }
  };

  const declareDeviceSecured = async () => {
    try {
      await apiService.declareSecured();
      await loadMyDevices();
      await loadProtectedStats().catch(() => {});
      addAlert({
        title: 'Appareil sécurisé',
        body: 'Recherche active annulée. Votre appareil est à nouveau en sécurité.',
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la sécurisation');
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

  const updateLocation = React.useCallback((coords: LocationCoords) => {
    setCurrentLocation(coords);
  }, []);

  const addAlert = (alert: Omit<MeshAlert, 'id' | 'timestamp'>) => {
    const newAlert: MeshAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const deleteDetection = (id: string) => {
    setLostDeviceDetections((prev) => prev.filter((d) => d.id !== id));
  };

  const clearAllDetections = () => {
    setLostDeviceDetections([]);
  };

  return (
    <MeshContext.Provider
      value={{
        user,
        devices,
        localDevice,
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
        updateProfile,
        registerCurrentDevice,
        loadMyDevices,
        declareDeviceLost,
        declareDeviceSecured,
        toggleService,
        updateLocation,
        addAlert,
        setDetectedDevices,
        lostDeviceDetections,
        focusCoords,
        setFocusCoords,
        deleteAlert,
        clearAllAlerts,
        deleteDetection,
        clearAllDetections,
        protectedCount,
        loadProtectedStats,
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
