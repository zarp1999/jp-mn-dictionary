import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../constants/colors';

function KanjiCard({ kanji, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${kanji.character}の詳細`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.character}>{kanji.character}</Text>
        <View style={styles.meta}>
          {kanji.meaningMn ? (
            <Text
              style={styles.metaText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {kanji.meaningMn}
            </Text>
          ) : null}
          <Text style={styles.detailHint}>詳細 →</Text>
        </View>
      </View>

      {kanji.onYomi.length > 0 ? (
        <Text style={styles.readingLine}>
          <Text style={styles.readingLabel}>音読み: </Text>
          {kanji.onYomi.join('、')}
        </Text>
      ) : null}

      {kanji.kunYomi.length > 0 ? (
        <Text style={styles.readingLine}>
          <Text style={styles.readingLabel}>訓読み: </Text>
          {kanji.kunYomi.join('、')}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function KanjiSection({ kanjiList, onKanjiPress }) {
  if (!kanjiList || kanjiList.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>漢字</Text>
      {kanjiList.map((kanji) => (
        <KanjiCard
          key={kanji.character}
          kanji={kanji}
          onPress={() => onKanjiPress?.(kanji.character)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  character: {
    fontSize: 36,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 40,
  },
  meta: {
    flex: 1,
    paddingTop: 6,
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  detailHint: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  readingLine: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  readingLabel: {
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});
