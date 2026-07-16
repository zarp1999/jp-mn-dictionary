import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { getKanjiForWord } from '../utils/kanji';
import DetailHeader from '../components/DetailHeader';
import ExampleSentence from '../components/ExampleSentence';
import KanjiSection from '../components/KanjiSection';
import { useLocale } from '../i18n/LocaleContext';

export default function WordDetailScreen({
  navigation,
  route,
  favorites,
  onToggleFavorite,
}) {
  const { t } = useLocale();
  const word = route.params?.word;

  const kanjiList = useMemo(
    () => (word ? getKanjiForWord(word) : []),
    [word],
  );

  if (!word) {
    return null;
  }

  const isFavorite = !!favorites[word.id];
  const showReading = word.reading && word.reading !== word.headword;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader
          onBack={() => navigation.goBack()}
          isFavorite={isFavorite}
          onToggleFavorite={() => onToggleFavorite(word)}
        />

        <View style={styles.heroCard}>
          <Text style={styles.headword}>{word.headword}</Text>
          {showReading ? (
            <Text style={styles.reading}>{word.reading}</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.meaningCard]}>
          <Text style={styles.label}>{t('mongolianTranslation')}</Text>
          {word.definitions.map((def, i) => (
            <Text key={i} style={styles.definition}>
              {word.definitions.length > 1 ? `${i + 1}. ` : ''}
              {def}
            </Text>
          ))}
        </View>

        {word.examples.length > 0 ? (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 12,
  },
  headword: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 40,
  },
  reading: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  meaningCard: {
    backgroundColor: COLORS.primaryLight,
  },
  label: {
    fontSize: 11,
    color: COLORS.primaryText,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  definition: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.primaryText,
    marginBottom: 6,
    lineHeight: 28,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
});
