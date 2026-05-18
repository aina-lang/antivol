import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ExpoLeaflet, MapMarker, MapLayer } from 'expo-leaflet';
import { colors } from '../constants/colors';

interface MapViewProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  markers?: MapMarker[];
  zoom?: number;
  isLoading?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  accuracy = 20,
  markers = [],
  zoom = 15,
  isLoading = false,
}) => {
  // Coordonnée par défaut (Antananarivo, Madagascar) s'il n'y a pas de GPS encore
  const mapCenter = {
    lat: latitude || -18.8792,
    lng: longitude || 47.5079,
  };

  // Configuration de la couche de carte par défaut (OpenStreetMap)
  const mapLayers: MapLayer[] = [
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      baseLayerName: 'OpenStreetMap',
      baseLayer: true,
      layerType: 'TileLayer',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    }
  ];

  // Créer un marqueur par défaut s'il n'y en a pas d'autres
  const defaultMarkers: MapMarker[] =
    markers.length > 0
      ? markers
      : [
          {
            id: 'current-pos',
            position: mapCenter,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00FF66" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
            size: [36, 36],
            title: 'Votre Position',
          },
        ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadText}>Chargement des cartes tactiques...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoLeaflet
        backgroundColor={colors.background}
        mapCenterPosition={mapCenter}
        mapMarkers={defaultMarkers}
        mapLayers={mapLayers}
        onMessage={() => {}}
        zoom={zoom}
        maxZoom={18}
      />
      {/* Overlay affichant les coordonnées en bas de carte */}
      <View style={styles.coordsOverlay}>
        <Text style={styles.coordsText}>
          LAT: {mapCenter.lat.toFixed(6)} | LNG: {mapCenter.lng.toFixed(6)}
        </Text>
        <Text style={styles.accuracyText}>PRÉCISION: ±{Math.round(accuracy)}m</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadText: {
    marginTop: 12,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  coordsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.surface + 'D0', // Translucide
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 99,
  },
  coordsText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textPrimary,
  },
  accuracyText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: colors.primary,
    marginTop: 2,
  },
});
export type { MapMarker };
