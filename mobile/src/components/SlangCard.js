import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getSlangMeaning } from '../utils/slang';

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowEven: {
      backgroundColor: colors.white,
    },
    rowOdd: {
      backgroundColor: colors.bg,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    term: {
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    reading: {
      flex: 1,
      marginLeft: 8,
      fontSize: 13,
      fontWeight: '400',
      color: colors.textTertiary,
    },
    meaning: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
  });
}

export default function SlangCard({ item, index = 0, onPress, accessibilityLabel }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const meaning = getSlangMeaning(item);
  const reading = item.reading && item.reading !== item.term ? item.reading : '';
  const isEven = index % 2 === 0;

  return (
    <TouchableOpacity
      style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.rowTop}>
        <Text style={styles.term} numberOfLines={2}>{item.term}</Text>
        {reading ? (
          <Text style={styles.reading} numberOfLines={1}>{reading}</Text>
        ) : null}
      </View>
      {meaning ? (
        <Text style={styles.meaning} numberOfLines={2}>{meaning}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
