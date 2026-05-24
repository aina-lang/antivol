import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { RadarScanner } from '../src/components/RadarScanner';
import { useLocation } from '../src/hooks/useLocation';
import { useMesh } from '../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Mesh network illustration for slide 2 ───────────────────────
// Five nodes arranged in a loose mesh with connecting lines
const NODES: {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  shadow: string;
}[] = [
  { id: 'center', x: 90, y: 80,  size: 28, color: colors.primary,   shadow: colors.primary },
  { id: 'tl',     x: 20, y: 20,  size: 18, color: colors.secondary, shadow: colors.secondary },
  { id: 'tr',     x: 160, y: 10, size: 20, color: colors.success,   shadow: colors.success },
  { id: 'bl',     x: 10, y: 140, size: 16, color: colors.primary,   shadow: colors.primary },
  { id: 'br',     x: 165, y: 130,size: 18, color: colors.secondary, shadow: colors.secondary },
];

const EDGES = [
  ['center', 'tl'],
  ['center', 'tr'],
  ['center', 'bl'],
  ['center', 'br'],
  ['tl', 'tr'],
  ['bl', 'br'],
  ['tl', 'bl'],
];

function getNode(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function MeshVisualizer() {
  const CANVAS_W = 200;
  const CANVAS_H = 165;

  return (
    <View style={{ width: CANVAS_W, height: CANVAS_H }}>
      {/* Edges */}
      {EDGES.map(([aId, bId], i) => {
        const a = getNode(aId);
        const b = getNode(bId);
        const ax = a.x + a.size / 2;
        const ay = a.y + a.size / 2;
        const bx = b.x + b.size / 2;
        const by = b.y + b.size / 2;
        const len = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
        const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: ax,
              top: ay - 0.5,
              width: len,
              height: 1,
              backgroundColor: colors.primary + '30',
              transformOrigin: '0% 50%',
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
      {/* Nodes */}
      {NODES.map((n) => (
        <View
          key={n.id}
          style={{
            position: 'absolute',
            left: n.x,
            top: n.y,
            width: n.size,
            height: n.size,
            borderRadius: n.size / 2,
            backgroundColor: n.color,
            shadowColor: n.shadow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 5,
          }}
        />
      ))}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────
export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { requestPermissions } = useLocation();
  const { completeOnboarding } = useMesh();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (currentStep === 2) {
      await requestPermissions();
      await completeOnboarding();
      router.push('/(auth)/login');
    } else {
      scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * width, animated: true });
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.push('/(auth)/login');
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentStep && index >= 0 && index <= 2) {
      setCurrentStep(index);
    }
  };

  const handleDotPress = (idx: number) => {
    scrollViewRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}>
      <StatusBar style="light" />

      {/* Skip button */}
      {currentStep < 2 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>PASSER</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>

        {/* Slide 1 – Radar */}
        <View style={[styles.slide, { width }]}>
          <View style={styles.radarWrapper}>
            <RadarScanner devicesCount={12} isActive={true} />
          </View>
          <View style={styles.slideAccentRow}>
            <View style={[styles.slideAccentBar, { backgroundColor: colors.primary }]} />
            <Text style={styles.title}>REJOIGNEZ LE RÉSEAU</Text>
          </View>
          <Text style={styles.description}>
            MeshFind protège votre téléphone grâce à un réseau Bluetooth communautaire à
            Madagascar et partout en Afrique.
          </Text>
        </View>

        {/* Slide 2 – Mesh signal */}
        <View style={[styles.slide, { width }]}>
          <View style={styles.meshWrapper}>
            <MeshVisualizer />
          </View>
          <View style={styles.slideAccentRow}>
            <View style={[styles.slideAccentBar, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.title, { color: colors.secondary }]}>SIGNAL COMMUNAUTAIRE</Text>
          </View>
          <Text style={styles.description}>
            Même si votre téléphone perdu est éteint ou hors-ligne, les autres utilisateurs
            MeshFind captent son signal BLE et vous notifient en temps réel.
          </Text>
        </View>

        {/* Slide 3 – Security */}
        <View style={[styles.slide, { width }]}>
          <View style={styles.iconContainer}>
            <View style={styles.iconInner}>
              <MaterialCommunityIcons name="shield-lock-outline" size={56} color={colors.primary} />
            </View>
            {/* Outer ring */}
            <View style={styles.iconRing} />
          </View>
          <View style={styles.slideAccentRow}>
            <View style={[styles.slideAccentBar, { backgroundColor: colors.success }]} />
            <Text style={[styles.title, { color: colors.success }]}>SÉCURITÉ & ANONYMAT</Text>
          </View>
          <Text style={styles.description}>
            Pour fonctionner en tâche de fond, MeshFind nécessite l'accès Bluetooth et la
            localisation. Vos données restent 100% anonymes et chiffrées.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Indicator dots */}
        <View style={styles.indicatorContainer}>
          {[0, 1, 2].map((idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleDotPress(idx)}
              activeOpacity={0.7}
              style={styles.dotTouchable}>
              <View
                style={[
                  styles.indicatorDot,
                  idx === currentStep && styles.indicatorActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / authorize button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>
            {currentStep === 2 ? 'AUTORISER & REJOINDRE' : 'SUIVANT'}
          </Text>
          <MaterialCommunityIcons
            name={currentStep === 2 ? 'check-bold' : 'arrow-right'}
            size={16}
            color={colors.background}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 24,
    marginTop: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  skipText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginRight: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  radarWrapper: {
    marginBottom: 40,
  },
  meshWrapper: {
    marginBottom: 40,
    width: 200,
    height: 165,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  slideAccentBar: {
    width: 4,
    height: 22,
    borderRadius: 3,
    marginRight: 10,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 19,
    color: colors.primary,
    letterSpacing: 1.5,
    flexShrink: 1,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },
  iconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2,
  },
  iconRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    borderStyle: 'dashed',
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  dotTouchable: {
    padding: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 28,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    height: 54,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.background,
    letterSpacing: 1,
  },
});

export type {} from 'react-native';
