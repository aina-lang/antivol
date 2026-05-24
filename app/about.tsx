import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';

export default function About() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>RETOUR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) }]}>
        
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoIconWrapper}>
            <MaterialCommunityIcons name="radar" size={48} color={colors.primary} />
          </View>
          <Text style={styles.appName}>FARORATRA</Text>
          <Text style={styles.appVersion}>Version 1.0.0 (Build tactique)</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>RÉSEAU COMMUNAUTAIRE</Text>
          </View>
          <Text style={styles.infoText}>
            Faroratra est un système de protection antivol basé sur un réseau communautaire maillé (Mesh) à Madagascar. 
            Chaque téléphone de l'écosystème contribue anonymement à localiser les appareils déclarés volés.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="bluetooth-connect" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>TECHNOLOGIE BLE</Text>
          </View>
          <Text style={styles.infoText}>
            Utilise le Bluetooth Low Energy (BLE) pour opérer en continu en arrière-plan avec un impact quasi-nul sur 
            la batterie, garantissant une surveillance constante 24h/24.
          </Text>
        </View>

        {/* Links */}
        <View style={styles.linksSection}>
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.push('/privacy')}>
            <MaterialCommunityIcons name="shield-account-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.linkText}>Politique de confidentialité</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.push('/terms')}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.linkText}>Conditions d'utilisation</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © 2026 Faroratra Madagascar.{'\n'}Tous droits réservés.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '18',
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  backBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginLeft: 2,
  },
  scrollContainer: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary + '50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  appName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: 3,
    marginBottom: 6,
  },
  appVersion: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  linksSection: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
    overflow: 'hidden',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  copyright: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 16,
  },
});
