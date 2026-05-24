import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/constants/colors';


export default function GlowTabBarBackground() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing border breath
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    // Sheen sweep: repeats every 5s
    const runSheen = () => {
      sheen.setValue(0);
      Animated.timing(sheen, { toValue: 1, duration: 1400, useNativeDriver: true }).start(() => {
        setTimeout(runSheen, 5000);
      });
    };
    setTimeout(runSheen, 1000);
  }, []);

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [`${colors.primary}30`, `${colors.primary}CC`],
  });

  const dotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.9],
  });

  // Sheen: a semi-opaque bar that slides across
  const sheenX = sheen.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 440],
  });

  const sheenOpacity = sheen.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.root}>
      {/* Frosted glass */}
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Dark surface tint */}
      <View style={[StyleSheet.absoluteFill, styles.tint]} />

      {/* Top-edge solid highlight line */}
      <View style={styles.topLine} />

      {/* Animated pulsing border */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.border, { borderColor }]} />

      {/* Corner accent dots */}
      <Animated.View style={[styles.dot, styles.dotTL, { opacity: dotOpacity }]} />
      <Animated.View style={[styles.dot, styles.dotTR, { opacity: dotOpacity }]} />

      {/* Sweeping sheen — solid semi-opaque bar, no gradient */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sheen,
          { opacity: sheenOpacity, transform: [{ translateX: sheenX }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: 'rgba(10, 8, 25, 0.58)',
    borderRadius: 24,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.25)',
    borderRadius: 1,
  },
  border: {
    borderRadius: 24,
    borderWidth: 1.5,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  dotTL: { top: 8, left: 18 },
  dotTR: { top: 8, right: 18 },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: 'rgba(167,139,250,0.07)',
  },
});