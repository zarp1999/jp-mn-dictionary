import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function WordCard({ word, index = 0, isFavorite, onPress, onToggleFavorite }) {
  const isEven = index % 2 === 0;

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
          {word.definitions.join(', ')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.starBtn}
        onPress={() => onToggleFavorite(word)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.star}>{isFavorite ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: COLORS.white,
  },
  rowOdd: {
    backgroundColor: COLORS.bg,
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
    color: COLORS.textPrimary,
  },
  reading: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textTertiary,
  },
  definition: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  starBtn: {
    paddingLeft: 8,
  },
  star: {
    fontSize: 20,
  },
});
