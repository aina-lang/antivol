import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlowTabBarBackground from 'components/Glowtabbarbackground';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,

        // Glowing animated background
        tabBarBackground: () => <GlowTabBarBackground/>,

        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 20,
          left: 20,
          right: 20,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 0,          // border handled inside GlowTabBarBackground
          borderRadius: 24,
          overflow: 'hidden',
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
marginHorizontal:24,
          // iOS outer glow — uses primary color as shadow
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.65,
          shadowRadius: 22,
        },

        tabBarLabelStyle: {
          fontFamily: 'Orbitron_700Bold',
          fontSize: 9,
          letterSpacing: 1.2,
          marginTop: 2,
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'RADAR',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="radar"
              size={focused ? 25 : 22}
              color={color}
              style={focused ? glowIcon(colors.primary) : undefined}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'CARTE',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              size={focused ? 25 : 22}
              color={color}
              style={focused ? glowIcon(colors.primary) : undefined}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'JOURNAL',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={focused ? 25 : 22}
              color={color}
              style={focused ? glowIcon(colors.primary) : undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * Adds a colored shadow glow to active tab icons (iOS only).
 * On Android, the tint color change is enough visual feedback.
 */
function glowIcon(color: string) {
  return Platform.OS === 'ios'
    ? {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95,
        shadowRadius: 8,
      }
    : {};
}