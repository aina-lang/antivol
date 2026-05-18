import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

interface BleSignalCardProps {
  bleId: string;
  rssi: number;
  timestamp: number;
  onReportPress?: () => void;
}

// Calcul de la distance estimée basée sur le RSSI
const estimateDistance = (rssi: number): number => {
  // Formule simplifiée : Distance = 10^((MeasuredPower - RSSI) / (10 * N))
  // MeasuredPower = RSSI à 1 mètre (typiquement -59 dBm)
  // N = constante environnementale (typiquement entre 2 et 4, prenons 2.2)
  const measuredPower = -59;
  const n = 2.2;
  const ratio = (measuredPower - rssi) / (10 * n);
  const distance = Math.pow(10, ratio);
  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
};

export const BleSignalCard: React.FC<BleSignalCardProps> = ({
  bleId,
  rssi,
  timestamp,
  onReportPress,
}) => {
  const borderWidthAnim = useSharedValue(1);

  useEffect(() => {
    borderWidthAnim.value = withRepeat(withTiming(2.5, { duration: 1000 }), -1, true);
  }, [borderWidthAnim]);

  const animatedBorder = useAnimatedStyle(() => {
    return {
      borderWidth: borderWidthAnim.value,
    };
  });

  const distance = estimateDistance(rssi);
  const timeStr = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Animated.View
      style={[
        styles.card,
        animatedBorder,
        {
          borderColor: colors.danger,
          backgroundColor: colors.surface,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.alertDotContainer}>
          <View style={styles.alertDot} />
          <Text style={styles.alertTitle}>APPAREIL PERDU DÉTECTÉ</Text>
        </View>
        <Text style={styles.timeText}>{timeStr}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Adresse / ID BLE</Text>
          <Text style={styles.value} numberOfLines={1}>
            {bleId}
          </Text>
        </View>

        <View style={styles.distanceBlock}>
          <Text style={styles.distanceValue}>{distance}</Text>
          <Text style={styles.distanceUnit}>mètres (est.)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.rssiText}>Signal : {rssi} dBm</Text>
        {onReportPress ? (
          <TouchableOpacity style={styles.button} onPress={onReportPress}>
            <Text style={styles.buttonText}>SIGNANLER POSITION</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.autoReportBadge}>
            <Text style={styles.autoReportText}>AUTO-SIGNALÉ ANONYMEMENT</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginRight: 6,
  },
  alertTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.danger,
    letterSpacing: 1,
  },
  timeText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBlock: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  distanceBlock: {
    alignItems: 'flex-end',
  },
  distanceValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 28,
    color: colors.textPrimary,
    lineHeight: 32,
    fontWeight: 'bold',
  },
  distanceUnit: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  rssiText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textPrimary,
  },
  autoReportBadge: {
    backgroundColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  autoReportText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: colors.primary,
  },
});
