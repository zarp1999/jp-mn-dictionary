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

export default function WordDetailScreen({
  navigation,
  route,
  favorites,
  onToggleFavorite,
}) {
  const word = route.params?.word;

  const kanjiList = useMemo(
    () => (word ? getKanjiForWord(word) : []),
    [word],
  );

  if (!word) {
    return null;
  }

  const isFavorite = !!favorites[word.id];

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

        <Text style={styles.headword}>
          {word.headword}
          {word.reading && word.reading !== word.headword ? (
            <Text style={styles.reading}> [{word.reading}]</Text>
          ) : null}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>モンゴル語訳</Text>
        {word.definitions.map((def, i) => (
          <Text key={i} style={styles.definition}>
            {word.definitions.length > 1 ? `${i + 1}. ` : ''}{def}
          </Text>
        ))}

        {word.examples.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>例文</Text>
            {word.examples.map((ex, i) => (
              <ExampleSentence key={i} text={ex} />
            ))}
          </>
        )}

        {kanjiList.length > 0 && (
          <>
            <View style={styles.divider} />
            <KanjiSection kanjiList={kanjiList} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headword: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  reading: {
    fontSize: 20,
    fontWeight: '400',
    color: COLORS.textTertiary,
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  label: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  definition: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 6,
    lineHeight: 28,
  },
});
