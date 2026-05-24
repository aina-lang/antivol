import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';

export default function TermsOfService() {
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
        <Text style={styles.headerTitle}>CONDITIONS D'UTILISATION</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) }]}>
        
        <View style={styles.contentBox}>
          <Text style={styles.sectionTitle}>1. ACCEPTATION DES CONDITIONS</Text>
          <Text style={styles.paragraph}>
            En utilisant l'application MeshFind, vous acceptez de rejoindre le réseau communautaire 
            de détection et de contribuer à la sécurité globale des autres utilisateurs.
          </Text>

          <Text style={styles.sectionTitle}>2. OBLIGATIONS DE L'UTILISATEUR</Text>
          <Text style={styles.paragraph}>
            L'utilisateur s'engage à ne pas utiliser l'application de manière abusive ou pour tracer 
            des individus sans leur consentement. L'outil est strictement réservé à la localisation 
            d'appareils perdus ou volés.
          </Text>

          <Text style={styles.sectionTitle}>3. LIMITATION DE RESPONSABILITÉ</Text>
          <Text style={styles.paragraph}>
            L'équipe de MeshFind ne peut garantir le recouvrement systématique d'un appareil volé. 
            L'efficacité dépend du maillage du réseau (nombre d'utilisateurs actifs dans la zone). 
            Nous déclinons toute responsabilité en cas de perte définitive.
          </Text>

          <Text style={styles.sectionTitle}>4. MODIFICATIONS DU SERVICE</Text>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de modifier ou d'interrompre le service à tout moment pour 
            des raisons de maintenance ou de mise à niveau de l'infrastructure.
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
