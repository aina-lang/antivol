import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurer le gestionnaire de notifications par défaut
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // Demander la permission et récupérer le token
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Les notifications push nécessitent un appareil physique.');
      return null;
    }

    let token: string | null = null;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission de notification push refusée !');
        return null;
      }

      // Récupérer le token de notification Expo
      const expoToken = await Notifications.getExpoPushTokenAsync();
      token = expoToken.data;
      console.log('Expo Push Token récupéré avec succès:', token);

      // Spécifique Android pour canaux d'alertes à fort impact
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meshfind-alerts', {
          name: 'Alertes MeshFind',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00D4FF',
        });
      }
    } catch (error) {
      console.error("Erreur d'enregistrement aux notifications push", error);
    }

    return token;
  },

  // Ajouter un écouteur de notification reçue
  addReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  // Ajouter un écouteur d'action de notification cliquée
  addResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
