import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 0,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    chipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: colors.primaryText,
      fontWeight: '600',
    },
  });
}

export default function EpaperRangePicker({ ranges, selectedIndex, onSelect }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!ranges || ranges.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {ranges.map((range, index) => {
            const active = index === selectedIndex;
            return (
              <TouchableOpacity
                key={`${range.from}-${range.to}`}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelect(index)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t('epaperSendRangeChip', range.from, range.to)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t('epaperSendRangeChip', range.from, range.to)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
