import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { getKanjiEntry, filterKnownSimilarKanji } from '../utils/kanji';
import { KANJI_WORD_POSITION } from '../utils/kanjiWordSearch';
import DetailHeader from '../components/DetailHeader';
import MeaningEditModal from '../components/MeaningEditModal';
import { toKanjiFavorite } from '../utils/favorites';
import { useMeaningOverrides } from '../theme/MeaningOverridesContext';
import { parseMeaningsText } from '../utils/meaningOverrides';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerWrap: {
      paddingHorizontal: 16,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    empty: {
      paddingHorizontal: 20,
      fontSize: 16,
      color: colors.textSecondary,
    },
    heroCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 18,
      marginBottom: 12,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
    },
    character: {
      fontSize: 72,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 84,
      minWidth: 88,
    },
    chipColumn: {
      flex: 1,
      paddingTop: 8,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chipLabel: {
      fontSize: 10,
      color: colors.textTertiary,
      fontWeight: '600',
      marginBottom: 2,
    },
    chipValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 12,
    },
    meaningCard: {
      backgroundColor: colors.primaryLight,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    meaningLabel: {
      color: colors.primaryText,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    editBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    editBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    readingBlock: {
      marginBottom: 12,
    },
    readingLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    readingChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    readingChip: {
      backgroundColor: colors.bg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    readingChipText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    meaningLine: {
      fontSize: 16,
      color: colors.primaryText,
      lineHeight: 26,
      marginBottom: 8,
    },
    section: {
      marginBottom: 8,
    },
    outerLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    similarRow: {
      flexDirection: 'row',
      gap: 10,
      paddingRight: 8,
    },
    similarChip: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    similarChipPressed: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    similarChar: {
      fontSize: 26,
      color: colors.textPrimary,
    },
    wordSearchRow: {
      flexDirection: 'row',
      gap: 10,
    },
    wordSearchBtn: {
      flex: 1,
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    wordSearchBtnPressed: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    wordSearchBtnText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 1,
    },
  });
}

function MetaChip({ label, value, styles }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function ReadingBlock({ label, readings, styles }) {
  if (!readings || readings.length === 0) {
    return null;
  }

  return (
    <View style={styles.readingBlock}>
      <Text style={styles.readingLabel}>{label}</Text>
      <View style={styles.readingChipRow}>
        {readings.map((reading) => (
          <View key={`${label}-${reading}`} style={styles.readingChip}>
            <Text style={styles.readingChipText}>{reading}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function shortenGrade(grade, formatYear) {
  if (!grade) {
    return '';
  }
  const match = String(grade).match(/([一二三四五六七八九十\d]+)年/);
  if (match) {
    return formatYear(match[1]);
  }
  return grade;
}

function shortenRadical(radical) {
  if (!radical) {
    return '';
  }
  const first = String(radical).split(/[（(]/)[0].trim();
  return first || radical;
}

export default function KanjiDetailScreen({
  navigation,
  route,
  favorites = {},
  onToggleFavorite,
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const character = route.params?.character || '';
  const [editVisible, setEditVisible] = useState(false);
  const {
    getKanjiMeaningsList,
    hasKanjiOverride,
    saveKanjiOverride,
    resetKanjiOverride,
  } = useMeaningOverrides();

  const kanji = useMemo(
    () => (character ? getKanjiEntry(character) : null),
    [character],
  );

  const similar = useMemo(
    () => (kanji ? filterKnownSimilarKanji(kanji.similarKanji) : []),
    [kanji],
  );

  const meaningsList = useMemo(
    () => (kanji ? getKanjiMeaningsList(kanji) : []),
    [kanji, getKanjiMeaningsList],
  );

  const handleSaveMeaning = useCallback(async (text) => {
    if (!kanji) {
      return;
    }
    await saveKanjiOverride(kanji.character, parseMeaningsText(text));
    setEditVisible(false);
  }, [kanji, saveKanjiOverride]);

  const handleResetMeaning = useCallback(async () => {
    if (!kanji) {
      return;
    }
    await resetKanjiOverride(kanji.character);
    setEditVisible(false);
  }, [kanji, resetKanjiOverride]);

  if (!kanji) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('back')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.empty}>{t('kanjiNotFound')}</Text>
      </SafeAreaView>
    );
  }

  const favoriteItem = toKanjiFavorite(kanji);
  const isFavorite = !!favorites[favoriteItem.id];

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(favoriteItem);
    }
  };

  const gradeShort = shortenGrade(kanji.grade, (n) => t('gradeYear', n));
  const radicalShort = shortenRadical(kanji.radical);

  const handleOpenWordSearch = (position) => {
    navigation.navigate('KanjiWordList', { character: kanji.character, position });
  };

  const wordSearchButtons = [
    {
      key: 'prefix',
      position: KANJI_WORD_POSITION.prefix,
      label: t('kanjiWordSearchBtnPrefix', kanji.character),
      a11y: t('kanjiWordSearchBtnPrefixA11y', kanji.character),
    },
    {
      key: 'middle',
      position: KANJI_WORD_POSITION.middle,
      label: t('kanjiWordSearchBtnMiddle', kanji.character),
      a11y: t('kanjiWordSearchBtnMiddleA11y', kanji.character),
    },
    {
      key: 'suffix',
      position: KANJI_WORD_POSITION.suffix,
      label: t('kanjiWordSearchBtnSuffix', kanji.character),
      a11y: t('kanjiWordSearchBtnSuffixA11y', kanji.character),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <DetailHeader
          onBack={() => navigation.goBack()}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.character}>{kanji.character}</Text>
            <View style={styles.chipColumn}>
              <View style={styles.chipWrap}>
                <MetaChip label={t('strokes')} value={kanji.strokeCount} styles={styles} />
                <MetaChip label={t('jlpt')} value={kanji.jlpt} styles={styles} />
                <MetaChip label={t('grade')} value={gradeShort} styles={styles} />
                <MetaChip label={t('radical')} value={radicalShort} styles={styles} />
              </View>
            </View>
          </View>
        </View>

        {(kanji.onYomi.length > 0 || kanji.kunYomi.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('readings')}</Text>
            <ReadingBlock label={t('onYomi')} readings={kanji.onYomi} styles={styles} />
            <ReadingBlock label={t('kunYomi')} readings={kanji.kunYomi} styles={styles} />
          </View>
        )}

        <View style={[styles.card, styles.meaningCard]}>
          <View style={styles.labelRow}>
            <Text style={[styles.sectionLabel, styles.meaningLabel, { marginBottom: 0 }]}>
              {t('mongolianMeanings')}
            </Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('editMeaning')}
            >
              <Text style={styles.editBtnText}>{t('editMeaning')}</Text>
            </TouchableOpacity>
          </View>
          {meaningsList.length > 0 ? (
            meaningsList.map((meaning, index) => (
              <Text key={`${index}-${meaning}`} style={styles.meaningLine}>
                {`${index + 1}. ${meaning}`}
              </Text>
            ))
          ) : (
            <Text style={styles.meaningLine}>{t('showMeaning')}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('kanjiWordSearchSection')}</Text>
          <View style={styles.wordSearchRow}>
            {wordSearchButtons.map(({ key, position, label, a11y }) => (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.wordSearchBtn,
                  pressed && styles.wordSearchBtnPressed,
                ]}
                onPress={() => handleOpenWordSearch(position)}
                accessibilityLabel={a11y}
              >
                <Text style={styles.wordSearchBtnText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.outerLabel}>{t('similarKanji')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarRow}
            >
              {similar.map((char) => (
                <Pressable
                  key={char}
                  style={({ pressed }) => [
                    styles.similarChip,
                    pressed && styles.similarChipPressed,
                  ]}
                  onPress={() =>
                    navigation.push('KanjiDetail', { character: char })
                  }
                  accessibilityLabel={t('kanjiDetailA11y', char)}
                >
                  <Text style={styles.similarChar}>{char}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <MeaningEditModal
        visible={editVisible}
        title={t('meaningEditKanjiTitle', kanji.character)}
        initialMeanings={meaningsList}
        hasOverride={hasKanjiOverride(kanji.character)}
        onSave={handleSaveMeaning}
        onReset={handleResetMeaning}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  );
}
