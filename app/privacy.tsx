import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>POLITIQUE DE CONFIDENTIALITÉ</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) }]}>
        
        <View style={styles.contentBox}>
          <Text style={styles.sectionTitle}>1. COLLECTE DES DONNÉES</Text>
          <Text style={styles.paragraph}>
            L'application MeshFind collecte les données de géolocalisation en arrière-plan afin de
            garantir le bon fonctionnement du réseau maillé (Mesh) pour retrouver les appareils
            perdus. Ces données sont anonymisées avant d'être transmises au serveur.
          </Text>

          <Text style={styles.sectionTitle}>2. UTILISATION DU BLUETOOTH (BLE)</Text>
          <Text style={styles.paragraph}>
            Le système utilise le Bluetooth Low Energy pour scanner les appareils environnants.
            Les adresses MAC interceptées ne sont stockées temporairement que si elles
            correspondent à un appareil déclaré perdu.
          </Text>

          <Text style={styles.sectionTitle}>3. PARTAGE DES DONNÉES</Text>
          <Text style={styles.paragraph}>
            MeshFind ne partage ni ne vend aucune information personnelle ou donnée de
            localisation à des tiers. Les données servent uniquement à la communauté pour 
            protéger et retrouver les téléphones volés.
          </Text>

          <Text style={styles.sectionTitle}>4. VOS DROITS</Text>
          <Text style={styles.paragraph}>
            Vous pouvez à tout moment vous retirer du réseau en désinstallant l'application ou en 
            désactivant la permission de localisation en arrière-plan, bien que cela annule 
            votre propre protection antivol.
          </Text>

          <Text style={styles.dateText}>Dernière mise à jour : Mai 2026</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '18',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContainer: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  contentBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  paragraph: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  dateText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 30,
    textAlign: 'center',
  },
});
