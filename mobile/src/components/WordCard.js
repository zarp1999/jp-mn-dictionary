import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useMeaningOverrides } from '../theme/MeaningOverridesContext';

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowEven: {
      backgroundColor: colors.white,
    },
    rowOdd: {
      backgroundColor: colors.bg,
    },
    left: {
      flex: 1,
    },
    headwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headword: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    reading: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textTertiary,
    },
    definition: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    starBtn: {
      paddingLeft: 8,
    },
    star: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    starActive: {
      color: colors.amber,
    },
  });
}

export default function WordCard({ word, index = 0, isFavorite, onPress, onToggleFavorite }) {
  const { colors } = useTheme();
  const { getWordDefinitions } = useMeaningOverrides();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEven = index % 2 === 0;
  const definitions = getWordDefinitions(word);

  return (
    <TouchableOpacity
      style={[styles.card, isEven ? styles.rowEven : styles.rowOdd]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.headwordRow}>
          <Text style={styles.headword}>
            {word.headword}
            {word.reading && word.reading !== word.headword ? (
              <Text style={styles.reading}> [{word.reading}]</Text>
            ) : null}
          </Text>
        </View>
        <Text style={styles.definition} numberOfLines={2}>
          {definitions.join(', ')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.starBtn}
        onPress={() => onToggleFavorite(word)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.star, isFavorite && styles.starActive]}>
          {isFavorite ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
