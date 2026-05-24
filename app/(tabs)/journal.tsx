import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { useMesh } from '../../src/store/meshStore';

// ── Swipeable row ──────────────────────────────────────────────────
interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  confirmTitle: string;
  confirmMessage: string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onDelete,
  confirmTitle,
  confirmMessage,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isRevealed = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 5,
      onPanResponderMove: (_, g) => {
        let newX = g.dx;
        if (isRevealed.current) newX -= 80;
        if (newX > 0) newX = 0;
        if (newX < -120) newX = -120;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, g) => {
        let dx = g.dx;
        if (isRevealed.current) dx -= 80;
        const finalX = dx < -40 ? -80 : 0;
        isRevealed.current = finalX === -80;
        Animated.spring(translateX, {
          toValue: finalX,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const handleDeletePress = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(() => {
      isRevealed.current = false;
    });
    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={swipeStyles.container}>
      <View style={swipeStyles.backRow}>
        <TouchableOpacity style={swipeStyles.deleteButton} onPress={handleDeletePress} activeOpacity={0.8}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[swipeStyles.frontRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
};

const swipeStyles = StyleSheet.create({
  container: { position: 'relative', marginBottom: 12 },
  backRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.danger,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.danger,
  },
  frontRow: { backgroundColor: colors.background, borderRadius: 12 },
});

// ── Main Screen ────────────────────────────────────────────────────
export default function Journal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    devices,
    alerts,
    lostDeviceDetections,
    deleteAlert,
    clearAllAlerts,
    deleteDetection,
    clearAllDetections,
    setFocusCoords,
  } = useMesh();

  const isVictim = devices.some((d: any) => d.isLost === true);

  const handleAlertPress = (al: any) => {
    if (al.lat && al.lng) {
      setFocusCoords({ lat: al.lat, lng: al.lng });
      router.push('/(tabs)/map');
    } else {
      Alert.alert(al.title, al.body);
    }
  };

  const handleDetectionPress = (det: any) => {
    if (det.latitude && det.longitude) {
      setFocusCoords({ lat: parseFloat(det.latitude), lng: parseFloat(det.longitude) });
      router.push('/(tabs)/map');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Vider le journal de sécurité',
      'Voulez-vous vraiment effacer tous les éléments ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout Effacer',
          style: 'destructive',
          onPress: () => (isVictim ? clearAllDetections() : clearAllAlerts()),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
        <View style={{ paddingLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: colors.primary, marginRight: 8 }} />
            <Text style={{ fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 }}>{isVictim ? 'JOURNAL DÉTECTIONS' : 'JOURNAL INTERCEPTIONS'}</Text>
          </View>
          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: colors.textSecondary, marginTop: 5, marginLeft: 11, letterSpacing: 0.5 }}>SYNCHRONISATION GLOBALE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>HISTORIQUE</Text>
          {((isVictim ? (lostDeviceDetections || []).length : (alerts || []).length) > 0) && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
              <MaterialCommunityIcons
                name="delete-sweep-outline"
                size={13}
                color={colors.danger}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.clearAllText}>EFFACER TOUT</Text>
            </TouchableOpacity>
          )}
        </View>

        {isVictim ? (
          (lostDeviceDetections || []).length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="radar"
                size={28}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyText}>
                Aucun signal de détection reçu du réseau communautaire pour le moment.
              </Text>
            </View>
          ) : (
            lostDeviceDetections.map((det: any) => {
              const dateStr = new Date(parseInt(det.timestamp)).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: 'numeric',
                month: 'short',
              });
              return (
                <SwipeableItem
                  key={det.id}
                  onDelete={() => deleteDetection(det.id)}
                  confirmTitle="Supprimer la détection"
                  confirmMessage="Voulez-vous supprimer ce signal de détection de votre historique ?">
                  <TouchableOpacity
                    style={[styles.alertLog, { borderLeftColor: colors.danger, marginBottom: 0 }]}
                    onPress={() => handleDetectionPress(det)}>
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertLogTitle, { color: colors.danger }]}>SIGNAL REÇU</Text>
                      <Text style={styles.alertLogTime}>{dateStr}</Text>
                    </View>
                    <Text style={styles.alertLogBody}>
                      Votre appareil a été localisé à Madagascar (Précision :{' '}
                      {Math.round(det.accuracy)}m). Appuyez pour afficher sur la carte.
                    </Text>
                  </TouchableOpacity>
                </SwipeableItem>
              );
            })
          )
        ) : alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={28}
              color={colors.textMuted}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyText}>Aucun signal d'alerte détecté récemment.</Text>
          </View>
        ) : (
          alerts.map((al: any) => (
            <SwipeableItem
              key={al.id}
              onDelete={() => deleteAlert(al.id)}
              confirmTitle="Supprimer l'interception"
              confirmMessage="Voulez-vous supprimer cette alerte de votre journal ?">
              <TouchableOpacity
                style={[styles.alertLog, { marginBottom: 0 }]}
                onPress={() => handleAlertPress(al)}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertLogTitle}>{al.title.toUpperCase()}</Text>
                  <Text style={styles.alertLogTime}>
                    {new Date(al.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.alertLogBody}>{al.body}</Text>
              </TouchableOpacity>
            </SwipeableItem>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '18',
    zIndex: 10,
  },

  scrollContainer: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.danger + '12',
    borderWidth: 1,
    borderColor: colors.danger + '25',
  },
  clearAllText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.danger,
    letterSpacing: 1,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  alertLog: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertLogTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.primary,
  },
  alertLogTime: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
  },
  alertLogBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
  },
});
