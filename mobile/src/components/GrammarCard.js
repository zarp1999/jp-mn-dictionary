import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getGrammarMeaning } from '../utils/grammar';
import { useLocale } from '../i18n/LocaleContext';

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
      alignItems: 'center',
    },
    pattern: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginRight: 8,
    },
    badge: {
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primaryText,
    },
    meaning: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
  });
}

export default function GrammarCard({ item, index = 0, onPress, accessibilityLabel }) {
  const { isMongolian } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const meaning = getGrammarMeaning(item, isMongolian);
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
        <Text style={styles.pattern} numberOfLines={2}>{item.pattern}</Text>
        {item.level !== 'other' ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.level}</Text>
          </View>
        ) : null}
      </View>
      {meaning ? (
        <Text style={styles.meaning} numberOfLines={2}>{meaning}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
