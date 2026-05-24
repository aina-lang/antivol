import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

const CONTAINER_SIZE = 280;
const RADIUS = CONTAINER_SIZE / 2;

// Pulsing concentric ring expanding outward
const PulsingCircle = ({ delay }: { delay: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 3000 }), -1, false)
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.3, 1]);
    const opacity = interpolate(progress.value, [0, 0.6, 1], [0.55, 0.2, 0]);
    return { transform: [{ scale }], opacity };
  });

  return <Animated.View style={[styles.pulseCircle, animatedStyle]} />;
};

// Rotating radar sweep beam
const SweepBeam = ({ rotationValue }: { rotationValue: Animated.SharedValue<number> }) => {
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationValue.value}deg` }],
  }));

  return (
    <>
      {/* Soft glow trail */}
      <Animated.View
        style={[
          styles.sweepGlow,
          sweepStyle,
        ]}
      />
      {/* Sharp sweep line */}
      <Animated.View
        style={[
          styles.sweepLine,
          sweepStyle,
        ]}
      />
    </>
  );
};

// Static grid overlay (crosshair + concentric dashed circles)
const GridOverlay = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {/* Horizontal crosshair */}
    <View style={styles.crossH} />
    {/* Vertical crosshair */}
    <View style={styles.crossV} />
    {/* Concentric dashed circles */}
    {[0.30, 0.55, 0.78, 1.0].map((scale, i) => (
      <View
        key={i}
        style={[
          styles.gridCircle,
          {
            width: CONTAINER_SIZE * scale,
            height: CONTAINER_SIZE * scale,
            borderRadius: (CONTAINER_SIZE * scale) / 2,
            opacity: 0.05 + i * 0.025,
          },
        ]}
      />
    ))}
  </View>
);

interface RadarScannerProps {
  devicesCount: number;
  isActive: boolean;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({ devicesCount, isActive }) => {
  const sweepRotation = useSharedValue(0);
  const centralScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      sweepRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      centralScale.value = withRepeat(
        withTiming(1.12, { duration: 1400 }),
        -1,
        true
      );
    } else {
      sweepRotation.value = withTiming(0, { duration: 800 });
      centralScale.value = withTiming(1, { duration: 500 });
    }
  }, [isActive, sweepRotation, centralScale]);

  const centralAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centralScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Grid overlay always visible */}
      <GridOverlay />

      {/* Pulsing rings (only when active) */}
      {isActive && (
        <>
          <PulsingCircle delay={0} />
          <PulsingCircle delay={1000} />
          <PulsingCircle delay={2000} />
        </>
      )}

      {/* Rotating sweep beam */}
      {isActive && <SweepBeam rotationValue={sweepRotation} />}

      {/* Center core */}
      <Animated.View
        style={[
          styles.centerCore,
          centralAnimatedStyle,
          {
            borderColor: isActive ? colors.primary : colors.textMuted,
            shadowColor: isActive ? colors.primary : 'transparent',
          },
        ]}>
        {/* Inner ring */}
        <View
          style={[
            styles.innerRing,
            {
              borderColor: isActive
                ? colors.primary + '60'
                : colors.textMuted + '30',
            },
          ]}
        />
        <Text
          style={[
            styles.radarTitle,
            { color: isActive ? colors.primary : colors.textMuted },
          ]}>
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
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: colors.primary + '50',
    backgroundColor: 'transparent',
  },
  // Sweep beam: positioned from center going up, rotates around bottom-center (= container center)
  sweepLine: {
    position: 'absolute',
    width: 2,
    height: RADIUS,
    top: 0,
    left: RADIUS - 1,
    backgroundColor: colors.primary,
    transformOrigin: '50% 100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 6,
  },
  sweepGlow: {
    position: 'absolute',
    width: 14,
    height: RADIUS,
    top: 0,
    left: RADIUS - 7,
    backgroundColor: colors.primary + '20',
    transformOrigin: '50% 100%',
  },
  // Grid overlay elements
  crossH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    top: RADIUS - 0.5,
    backgroundColor: colors.primary + '0D',
  },
  crossV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    left: RADIUS - 0.5,
    backgroundColor: colors.primary + '0D',
  },
  gridCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignSelf: 'center',
  },
  // Core
  centerCore: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: colors.surface,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 10,
  },
  innerRing: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 1,
  },
  radarTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  countText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 36,
    color: colors.textPrimary,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 90,
    marginTop: 2,
  },
});
