/**
 * 【画面】単語の詳細
 *
 * 役割: 見出し語・モンゴル語/英語訳・例文・漢字・活用の表示
 * 機能: utils/meaningOverrides.js（訳の編集）, utils/conjugation.js（活用）, utils/kanji.js
 * 遷移元: 検索 / お気に入り / 単語リスト / OCR など
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getKanjiForWord } from '../utils/kanji';
import DetailHeader from '../components/DetailHeader';
import ExampleSentence from '../components/ExampleSentence';
import KanjiSection from '../components/KanjiSection';
import ConjugationSection from '../components/ConjugationSection';
import MeaningEditModal from '../components/MeaningEditModal';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { useMeaningOverrides } from '../theme/MeaningOverridesContext';
import { useDisableDrawerSwipe } from '../navigation/useDisableDrawerSwipe';
import {
  getWordEnglishDefinitions,
  parseMeaningsText,
} from '../utils/meaningOverrides';
import { buildMeaningSections } from '../utils/meaningDisplay';

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
      paddingTop: 8,
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 20,
      marginBottom: 12,
    },
    headword: {
      fontSize: 32,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 40,
    },
    reading: {
      marginTop: 6,
      fontSize: 18,
      fontWeight: '400',
      color: colors.textSecondary,
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
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    label: {
      fontSize: 11,
      color: colors.primaryText,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
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
    definition: {
      fontSize: 20,
      fontWeight: '500',
      color: colors.primaryText,
      marginBottom: 6,
      lineHeight: 28,
    },
    meaningBlock: {
      marginBottom: 12,
    },
    meaningBlockLast: {
      marginBottom: 0,
    },
    section: {
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
  });
}

export default function WordDetailScreen({
  navigation,
  route,
  favorites,
  onToggleFavorite,
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  useDisableDrawerSwipe();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const word = route.params?.word;
  const [editVisible, setEditVisible] = useState(false);
  const {
    getWordDefinitions,
    hasWordOverride,
    saveWordOverride,
    resetWordOverride,
  } = useMeaningOverrides();

  const kanjiList = useMemo(
    () => (word ? getKanjiForWord(word) : []),
    [word],
  );

  const definitions = useMemo(
    () => (word ? getWordDefinitions(word) : []),
    [word, getWordDefinitions],
  );

  const definitionsEn = useMemo(
    () => (word ? getWordEnglishDefinitions(word) : []),
    [word],
  );

  const meaningSections = useMemo(
    () => buildMeaningSections(definitions, definitionsEn),
    [definitions, definitionsEn],
  );

  const handleSaveMeaning = useCallback(async (text) => {
    if (!word) {
      return;
    }
    await saveWordOverride(word.id, parseMeaningsText(text));
    setEditVisible(false);
  }, [saveWordOverride, word]);

  const handleResetMeaning = useCallback(async () => {
    if (!word) {
      return;
    }
    await resetWordOverride(word.id);
    setEditVisible(false);
  }, [resetWordOverride, word]);

  if (!word) {
    return null;
  }

  const isFavorite = !!favorites[word.id];
  const showReading = word.reading && word.reading !== word.headword;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <DetailHeader
          onBack={() => navigation.goBack()}
          isFavorite={isFavorite}
          onToggleFavorite={() => onToggleFavorite(word)}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.headword}>{word.headword}</Text>
          {showReading ? (
            <Text style={styles.reading}>{word.reading}</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.meaningCard]}>
          {meaningSections.length === 0 ? (
            <Text style={styles.definition}>—</Text>
          ) : (
            meaningSections.map((section, sectionIndex) => {
              const isLast = sectionIndex === meaningSections.length - 1;
              const labelKey =
                section.lang === 'en' ? 'englishTranslation' : 'mongolianTranslation';
              const showEdit = section.lang === 'mn';
              return (
                <View
                  key={section.lang}
                  style={[styles.meaningBlock, isLast && styles.meaningBlockLast]}
                >
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{t(labelKey)}</Text>
                    {showEdit ? (
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setEditVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel={t('editMeaning')}
                      >
                        <Text style={styles.editBtnText}>{t('editMeaning')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {section.items.map((def, i) => (
                    <Text key={`${section.lang}-${i}`} style={styles.definition}>
                      {section.items.length > 1 ? `${i + 1}. ` : ''}
                      {def}
                    </Text>
                  ))}
                </View>
              );
            })
          )}
        </View>

        {word.examples?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('examples')}</Text>
            {word.examples.map((ex, i) => (
              <ExampleSentence key={i} text={ex} />
            ))}
          </View>
        ) : null}

        {kanjiList.length > 0 ? (
          <KanjiSection
            kanjiList={kanjiList}
            onKanjiPress={(character) =>
              navigation.navigate('KanjiDetail', { character })
            }
          />
        ) : null}

        <ConjugationSection headword={word.headword} reading={word.reading} />
      </ScrollView>

      <MeaningEditModal
        visible={editVisible}
        title={t('meaningEditWordTitle')}
        initialMeanings={definitions}
        hasOverride={hasWordOverride(word.id)}
        onSave={handleSaveMeaning}
        onReset={handleResetMeaning}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  );
}
