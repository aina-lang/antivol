import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

interface StatusBadgeProps {
  isActive: boolean;
  protectedCount: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive, protectedCount }) => {
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1000 }),
      -1, // boucle infinie
      true // alternance fade in/out
    );
  }, [dotOpacity]);

  const pulsingStyle = useAnimatedStyle(() => {
    return {
      opacity: dotOpacity.value,
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isActive ? colors.borderGlow : colors.border,
          backgroundColor: colors.surface,
        },
      ]}>
      <Animated.View
        style={[
          styles.dot,
          pulsingStyle,
          {
            backgroundColor: isActive ? colors.success : colors.danger,
            shadowColor: isActive ? colors.success : colors.danger,
          },
        ]}
      />
      <Text style={styles.text}>
        {isActive
          ? `Réseau Actif • ${protectedCount} téléphones protégés`
          : 'Service d’arrière-plan inactif'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});
