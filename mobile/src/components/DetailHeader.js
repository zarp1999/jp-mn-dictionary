import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sideBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    star: {
      fontSize: 24,
    },
    spacer: {
      flex: 1,
    },
  });
}

export default function DetailHeader({ onBack, isFavorite, onToggleFavorite }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.sideBtn}
        onPress={onBack}
        accessibilityLabel={t('back')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.sideBtn}
        onPress={onToggleFavorite}
        accessibilityLabel={isFavorite ? t('removeFavorite') : t('addFavorite')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.star}>{isFavorite ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </View>
  );
}
