import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

interface StatusBadgeProps {
  isActive: boolean;
  protectedCount: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive, protectedCount }) => {
  const dotOpacity = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.7);

  useEffect(() => {
    // Dot blink
    dotOpacity.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
    // Expanding ring
    ringScale.value = withRepeat(withTiming(2.8, { duration: 1600 }), -1, false);
    ringOpacity.value = withRepeat(withTiming(0, { duration: 1600 }), -1, false);
  }, [dotOpacity, ringScale, ringOpacity]);

  const pulsingDotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const expandingRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const dotColor = isActive ? colors.success : colors.danger;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isActive ? colors.primary + '40' : colors.border,
          backgroundColor: colors.surface,
        },
      ]}>
      {/* Dot with expanding ring behind it */}
      <View style={styles.dotWrapper}>
        {isActive && (
          <Animated.View
            style={[
              styles.dotRing,
              expandingRingStyle,
              { backgroundColor: dotColor + '30' },
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.dot,
            pulsingDotStyle,
            {
              backgroundColor: dotColor,
              shadowColor: dotColor,
            },
          ]}
        />
      </View>

      <Text style={styles.text}>
        {isActive
          ? `Réseau Actif  ${protectedCount} téléphones protégés`
          : "Service d'arrière-plan inactif"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  dotWrapper: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dotRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.4,
  },
});
