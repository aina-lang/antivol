import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Demander les permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setErrorMsg('Permission de localisation au premier plan refusée.');
        return false;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        setErrorMsg('Permission de localisation en arrière-plan refusée.');
        return false;
      }

      setErrorMsg(null);
      return true;
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la requête de permissions.');
      return false;
    }
  }, []);

  // Obtenir la position actuelle une seule fois (avec protection anti-blocage)
  const getCurrentLocation =
    useCallback(async (): Promise<Location.LocationObjectCoords | null> => {
      setLoading(true);
      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        // 1. Tenter de récupérer la dernière position connue (instantané)
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords) {
          setLoading(false);
          return lastKnown.coords;
        }

        // 2. Si non disponible, lancer la requête de position avec un timeout de 4 secondes
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );

        const result = await Promise.race([locationPromise, timeoutPromise]);
        if (result && 'coords' in result) {
          return result.coords;
        }

        // Fallback tactique par défaut (Antananarivo) en cas de timeout pour ne pas bloquer l'interface
        return {
          latitude: -18.8792,
          longitude: 47.5079,
          accuracy: 100,
          altitude: null,
          heading: null,
          speed: null,
          altitudeAccuracy: null,
        };
      } catch (e: any) {
        setErrorMsg(e.message || 'Impossible de récupérer la position.');
        return {
          latitude: -18.8792,
          longitude: 47.5079,
          accuracy: 100,
          altitude: null,
          heading: null,
          speed: null,
          altitudeAccuracy: null,
        };
      } finally {
        setLoading(false);
      }
    }, [requestPermissions]);

  return {
    getCurrentLocation,
    requestPermissions,
    errorMsg,
    loading,
  };
};
