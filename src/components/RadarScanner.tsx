import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

// Cercle individuel pulsant avec un délai
const PulsingCircle = ({ delay }: { delay: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3000 }),
        -1, // Répéter indéfiniment
        false // Pas de reverse (recommence du centre)
      )
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.3, 1]);
    const opacity = interpolate(progress.value, [0, 0.8, 1], [0.6, 0.4, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.pulseCircle, animatedStyle]} />;
};

interface RadarScannerProps {
  devicesCount: number;
  isActive: boolean;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({ devicesCount, isActive }) => {
  const centralScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      centralScale.value = withRepeat(
        withTiming(1.15, { duration: 1200 }),
        -1,
        true // Reverse pour effet de "battement de coeur"
      );
    } else {
      centralScale.value = withTiming(1, { duration: 500 });
    }
  }, [isActive, centralScale]);

  const centralAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: centralScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      {isActive && (
        <>
          <PulsingCircle delay={0} />
          <PulsingCircle delay={1000} />
          <PulsingCircle delay={2000} />
        </>
      )}

      {/* Noyau central du Radar */}
      <Animated.View
        style={[
          styles.centerCore,
          centralAnimatedStyle,
          {
            borderColor: isActive ? colors.primary : colors.textMuted,
            shadowColor: isActive ? colors.primary : 'transparent',
          },
        ]}>
        <Text
          style={[styles.radarTitle, { color: isActive ? colors.primary : colors.textSecondary }]}>
          {isActive ? 'SCANNING' : 'OFFLINE'}
        </Text>
        <Text style={styles.countText}>{isActive ? devicesCount : '0'}</Text>
        <Text style={styles.subtext}>
          {devicesCount > 1 ? 'appareils protégés' : 'appareil protégé'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: colors.primaryDim,
    backgroundColor: 'transparent',
  },
  centerCore: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  radarTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  countText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 90,
  },
});
