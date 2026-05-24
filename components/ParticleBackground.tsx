import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../src/constants/colors';

const { width: W, height: H } = Dimensions.get('window');

const NUM_PARTICLES = 40;

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  duration: number;
  delay: number;
  color: string;
};

// Generates an electric blue particle with variable opacities for a telemetry star-field effect
function createParticle(id: number): Particle {
  const opacityVal = 0.35 + Math.random() * 0.5; // High-tech crisp opacity
  const size = 1.2 + Math.random() * 2.2; // Tiny precise points
  return {
    id,
    x: Math.random() * W,
    y: Math.random() * H,
    size,
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random() * 0.5),
    duration: 6000 + Math.random() * 8000,
    delay: Math.random() * 4000,
    color: `rgba(0, 212, 255, ${opacityVal})`, // Monochromatic Electric Blue (colors.primary)
  };
}

function animateParticle(p: Particle) {
  // NASA design: extremely slow, precise linear/subtle drift (mostly vertical/diagonal)
  const driftX = (Math.random() - 0.5) * 30;
  const driftY = -(30 + Math.random() * 40);

  p.translateX.setValue(0);
  p.translateY.setValue(0);
  p.opacity.setValue(0);
  p.scale.setValue(0.5 + Math.random() * 0.5);

  Animated.sequence([
    Animated.delay(p.delay),
    Animated.parallel([
      Animated.sequence([
        Animated.timing(p.opacity, {
          toValue: 0.8 + Math.random() * 0.2,
          duration: p.duration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: p.duration * 0.7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(p.translateX, {
        toValue: driftX,
        duration: p.duration,
        useNativeDriver: true,
      }),
      Animated.timing(p.translateY, {
        toValue: driftY,
        duration: p.duration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(p.scale, {
          toValue: 1.2,
          duration: p.duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(p.scale, {
          toValue: 0.4,
          duration: p.duration * 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]),
  ]).start(() => {
    p.x = Math.random() * W;
    p.y = H * 0.3 + Math.random() * H * 0.7;
    p.delay = Math.random() * 1500;
    animateParticle(p);
  });
}

export default function ParticleBackground({ children }: { children?: React.ReactNode }) {
  const particles = useMemo(() => Array.from({ length: NUM_PARTICLES }, (_, i) => {
    const p = createParticle(i);
    p.y = Math.random() * H;
    return p;
  }), []);

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    particles.forEach(p => animateParticle(p));

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const gridOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.05] });

  return (
    <View style={styles.container}>
      {/* Deep Space / NASA Control Room Dashboard Background (Monochrome Deep Blue-Black) */}
      <View style={styles.bg} />

      {/* Subtle high-tech crosshair/grid overlay */}
      <Animated.View style={[styles.gridOverlay, { opacity: gridOpacity }]} />

      {/* Particles */}
      {particles.map(p => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              // Tiny crisp glow
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 2,
              transform: [
                { translateX: p.translateX },
                { translateY: p.translateY },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060A13', // Deep tactical monochrome space color
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  particle: {
    position: 'absolute',
  },
  content: {
    flex: 1,
  },
});