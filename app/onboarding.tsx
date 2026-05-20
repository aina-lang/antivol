import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { RadarScanner } from '../src/components/RadarScanner';
import { useLocation } from '../src/hooks/useLocation';
import { useMesh } from '../src/store/meshStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      // Étape 3 : Demander les permissions
      const granted = await requestPermissions();
      console.log('Permissions accordées ?', granted);
      // Marquer l'onboarding comme complété
      await completeOnboarding();
      // Poursuivre vers l'authentification
      router.push('/(auth)/login');
    } else {
      scrollViewRef.current?.scrollTo({
        x: (currentStep + 1) * width,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.push('/(auth)/login');
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentStep && index >= 0 && index <= 2) {
      setCurrentStep(index);
    }
  };

  const handleDotPress = (idx: number) => {
    scrollViewRef.current?.scrollTo({
      x: idx * width,
      animated: true,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
      <StatusBar style="light" />

      {/* Bouton passer en haut à droite */}
      {currentStep < 2 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>PASSER</Text>
        </TouchableOpacity>
      )}

      {/* Contenu principal horizontal et swipable */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.slide, { width }]}>
          <View style={styles.radarWrapper}>
            <RadarScanner devicesCount={12} isActive={true} />
          </View>
          <Text style={styles.title}>REJOIGNEZ LE RÉSEAU</Text>
          <Text style={styles.description}>
            MeshFind protège votre téléphone grâce à un réseau Bluetooth communautaire à
            Madagascar et partout en Afrique.
          </Text>
        </View>

        <View style={[styles.slide, { width }]}>
          {/* Visualisation simplifiée du signal Mesh */}
          <View style={styles.meshVisualizer}>
            <View style={[styles.visualNode, styles.visualNodePrimary]} />
            <View style={styles.visualLine} />
            <View style={[styles.visualNode, styles.visualNodeSec]} />
            <View style={styles.visualLine} />
            <View style={[styles.visualNode, styles.visualNodeSuccess]} />
          </View>
          <Text style={styles.title}>SIGNAL COMMUNAUTAIRE</Text>
          <Text style={styles.description}>
            Même si votre téléphone perdu est éteint ou hors-ligne, les autres utilisateurs
            MeshFind captent son signal BLE et vous notifient en temps réel.
          </Text>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-lock-outline" size={64} color={colors.primary} />
          </View>
          <Text style={styles.title}>SÉCURITÉ & ANONYMAT</Text>
          <Text style={styles.description}>
            Pour fonctionner en tâche de fond, MeshFind nécessite l’accès Bluetooth et la
            localisation « Toujours ». Vos données restent 100% anonymes et chiffrées.
          </Text>
        </View>
      </ScrollView>

      {/* Pied de page : Dots indicateurs + Bouton Action */}
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {[0, 1, 2].map((idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleDotPress(idx)}
              activeOpacity={0.8}
            >
              <View
                style={[styles.indicatorDot, idx === currentStep ? styles.indicatorActive : null]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === 2 ? 'AUTORISER & REJOINDRE' : 'SUIVANT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  skipButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  skipText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  radarWrapper: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 20,
    color: colors.primary,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  meshVisualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 60,
  },
  visualNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  visualNodePrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  visualNodeSec: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  },
  visualNodeSuccess: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  visualLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.borderGlow,
    marginHorizontal: -4,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  visualIcon: {
    fontSize: 48,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.background,
    letterSpacing: 1,
  },
});
export type {} from 'react-native';
