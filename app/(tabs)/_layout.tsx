import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderGlow,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Orbitron_700Bold',
          fontSize: 9,
          letterSpacing: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'RADAR',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="radar" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'CARTE',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFIL',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-account-outline" size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
