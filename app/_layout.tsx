// 1. Importer la tâche de fond en scope global en tout premier
import '../src/background/tasks';

import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { MeshProvider, useMesh } from '../src/store/meshStore';
import { colors } from '../src/constants/colors';

// Garder le splash screen visible pendant le chargement des polices et de la session
SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const { user, isSessionLoading, hasSeenOnboarding } = useMesh();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      if (!hasSeenOnboarding && segments[0] !== 'onboarding') {
        // Rediriger vers l'onboarding si l'utilisateur n'a jamais vu l'onboarding
        router.replace('/onboarding');
      } else if (hasSeenOnboarding && !inAuthGroup) {
        // Rediriger vers le login si pas connecté et pas déjà dans le groupe d'auth
        router.replace('/(auth)/login');
      }
    } else if (user && (inAuthGroup || segments[0] === 'onboarding')) {
      // Rediriger vers le dashboard si déjà connecté
      router.replace('/(tabs)');
    }
  }, [user, isSessionLoading, hasSeenOnboarding, segments, router]);

  if (isSessionLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="declare-lost" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Orbitron_700Bold,
    SpaceMono_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <MeshProvider>
        <NavigationGuard />
      </MeshProvider>
    </SafeAreaProvider>
  );
}
