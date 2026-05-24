import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface BleSignalCardProps {
  bleId: string;
  rssi: number;
  timestamp: number;
  onReportPress?: () => void;
}

const estimateDistance = (rssi: number): number => {
  const measuredPower = -59;
  const n = 2.2;
  const ratio = (measuredPower - rssi) / (10 * n);
  return Math.round(Math.pow(10, ratio) * 10) / 10;
};

const getSignalBars = (rssi: number): number => {
  if (rssi >= -50) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -80) return 2;
  return 1;
};

const BAR_HEIGHTS = [6, 9, 12, 15];

export const BleSignalCard: React.FC<BleSignalCardProps> = ({
  bleId,
  rssi,
  timestamp,
  onReportPress,
}) => {
  const glowOpacity = useSharedValue(0.5);
  const borderProgress = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    borderProgress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [glowOpacity, borderProgress]);

  const cardGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value * 0.35,
  }));

  const distance = estimateDistance(rssi);
  const signalBars = getSignalBars(rssi);

  const timeStr = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Animated.View
      style={[
        styles.card,
        cardGlowStyle,
        { borderColor: colors.danger },
      ]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.alertTitleRow}>
          <MaterialCommunityIcons
            name="bluetooth-audio"
            size={13}
            color={colors.danger}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.alertTitle}>APPAREIL PERDU DÉTECTÉ</Text>
        </View>
        <Text style={styles.timeText}>{timeStr}</Text>
      </View>

      {/* Content row */}
      <View style={styles.content}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Adresse BLE</Text>
          <Text style={styles.value} numberOfLines={1}>
            {bleId}
          </Text>
          {/* Signal strength bars */}
          <View style={styles.signalBarsRow}>
            {BAR_HEIGHTS.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor:
                      i < signalBars ? colors.danger : colors.border,
                    opacity: i < signalBars ? 1 : 0.4,
                  },
                ]}
              />
            ))}
            <Text style={styles.rssiLabel}>{rssi} dBm</Text>
          </View>
        </View>

        <View style={styles.distanceBlock}>
          <Text style={styles.distanceValue}>{distance}</Text>
          <Text style={styles.distanceUnit}>m estimé</Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={styles.footer}>
        {onReportPress ? (
          <TouchableOpacity style={styles.button} onPress={onReportPress}>
            <MaterialCommunityIcons
              name="map-marker-alert-outline"
              size={12}
              color={colors.textPrimary}
              style={{ marginRight: 5 }}
            />
            <Text style={styles.buttonText}>SIGNALER POSITION</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.autoReportBadge}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={11}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.autoReportText}>AUTO-SIGNALÉ ANONYMEMENT</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 8,
    backgroundColor: colors.surface,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'flex-end',
    marginBottom: 14,
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
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  signalBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 5,
    borderRadius: 2,
  },
  rssiLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: colors.textSecondary,
    marginLeft: 6,
    marginBottom: 1,
  },
  distanceBlock: {
    alignItems: 'flex-end',
  },
  distanceValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 32,
    color: colors.textPrimary,
    lineHeight: 36,
    fontWeight: 'bold',
  },
  distanceUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  button: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 7,
  },
  buttonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textPrimary,
  },
  autoReportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  autoReportText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: colors.primary,
  },
});
