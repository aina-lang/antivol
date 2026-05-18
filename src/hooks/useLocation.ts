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

  // Obtenir la position actuelle une seule fois
  const getCurrentLocation =
    useCallback(async (): Promise<Location.LocationObjectCoords | null> => {
      setLoading(true);
      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return location.coords;
      } catch (e: any) {
        setErrorMsg(e.message || 'Impossible de récupérer la position.');
        return null;
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
