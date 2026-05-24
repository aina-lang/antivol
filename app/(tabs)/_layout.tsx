import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="dark"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface + 'CC' }]}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: colors.primary + '25',
          height: Platform.OS === 'ios' ? 84 : 66,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Orbitron_700Bold',
          fontSize: 9,
          letterSpacing: 1.2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'RADAR',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="radar"
              size={focused ? 24 : size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'CARTE',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              size={focused ? 24 : size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'JOURNAL',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={focused ? 24 : size || 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
