import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getKanjiEntry } from '../utils/kanji';
import { useLocale } from '../i18n/LocaleContext';
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
      flexDirection: 'row',
      alignItems: 'center',
    },
    character: {
      fontSize: 28,
      fontWeight: '600',
      color: colors.textPrimary,
      width: 44,
      textAlign: 'center',
    },
    meta: {
      flex: 1,
      marginLeft: 8,
    },
    reading: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    meaning: {
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

function readingPreview(kanji) {
  if (!kanji) {
    return '';
  }
  const on = (kanji.onYomi || []).slice(0, 2).join(' ');
  const kun = (kanji.kunYomi || []).slice(0, 2).join(' ');
  return [on, kun].filter(Boolean).join(' / ');
}

export default function KanjiFavoriteCard({
  item,
  index = 0,
  isFavorite,
  onPress,
  onToggleFavorite,
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const { getKanjiMeaningsList } = useMeaningOverrides();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const kanji = getKanjiEntry(item.character) || item;
  const isEven = index % 2 === 0;
  const reading = readingPreview(kanji);
  const meaning = getKanjiMeaningsList(kanji)[0] || '';

  return (
    <TouchableOpacity
      style={[styles.card, isEven ? styles.rowEven : styles.rowOdd]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('kanjiDetailA11y', item.character)}
    >
      <View style={styles.left}>
        <Text style={styles.character}>{item.character}</Text>
        <View style={styles.meta}>
          {reading ? (
            <Text style={styles.reading} numberOfLines={1}>{reading}</Text>
          ) : null}
          {meaning ? (
            <Text style={styles.meaning} numberOfLines={2}>{meaning}</Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.starBtn}
        onPress={() => onToggleFavorite(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t('removeFavorite') : t('addFavorite')}
      >
        <Text style={[styles.star, isFavorite && styles.starActive]}>
          {isFavorite ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
