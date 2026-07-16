import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    section: {
      marginTop: 4,
      marginBottom: 8,
    },
    label: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPressed: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },
    character: {
      fontSize: 36,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 40,
    },
    meta: {
      flex: 1,
    },
    metaText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    chevron: {
      fontSize: 28,
      color: colors.primary,
      lineHeight: 32,
      marginTop: -2,
    },
    readingBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 6,
      gap: 8,
    },
    readingLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      minWidth: 28,
      marginTop: 5,
    },
    chipRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    readingChip: {
      backgroundColor: colors.bg,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    readingChipText: {
      fontSize: 13,
      color: colors.textPrimary,
    },
  });
}

function ReadingChips({ label, readings, styles }) {
  if (!readings || readings.length === 0) {
    return null;
  }

  return (
    <View style={styles.readingBlock}>
      <Text style={styles.readingLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {readings.map((reading) => (
          <View key={`${label}-${reading}`} style={styles.readingChip}>
            <Text style={styles.readingChipText}>{reading}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function KanjiCard({ kanji, onPress, t, styles }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('kanjiDetailA11y', kanji.character)}
    >
      <View style={styles.headerRow}>
        <Text style={styles.character}>{kanji.character}</Text>
        <View style={styles.meta}>
          {kanji.meaningMn ? (
            <Text
              style={styles.metaText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {kanji.meaningMn}
            </Text>
          ) : (
            <Text style={styles.metaText}>{t('showMeaning')}</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <ReadingChips label={t('onReadingShort')} readings={kanji.onYomi} styles={styles} />
      <ReadingChips label={t('kunReadingShort')} readings={kanji.kunYomi} styles={styles} />
    </Pressable>
  );
}

export default function KanjiSection({ kanjiList, onKanjiPress }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!kanjiList || kanjiList.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('kanji')}</Text>
      {kanjiList.map((kanji) => (
        <KanjiCard
          key={kanji.character}
          kanji={kanji}
          t={t}
          styles={styles}
          onPress={() => onKanjiPress?.(kanji.character)}
        />
      ))}
    </View>
  );
}
