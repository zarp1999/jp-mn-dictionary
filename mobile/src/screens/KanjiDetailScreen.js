import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { getKanjiEntry, filterKnownSimilarKanji } from '../utils/kanji';

function MetaRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export default function KanjiDetailScreen({ navigation, route }) {
  const character = route.params?.character || '';

  const kanji = useMemo(
    () => (character ? getKanjiEntry(character) : null),
    [character],
  );

  const similar = useMemo(
    () => (kanji ? filterKnownSimilarKanji(kanji.similarKanji) : []),
    [kanji],
  );

  if (!kanji) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="戻る"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.empty}>漢字が見つかりません</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="戻る"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.character}>{kanji.character}</Text>
          <View style={styles.metaColumn}>
            <MetaRow label="画数" value={kanji.strokeCount} />
            <MetaRow label="JLPT" value={kanji.jlpt} />
            <MetaRow label="学年" value={kanji.grade} />
            <MetaRow label="部首" value={kanji.radical} />
          </View>
        </View>

        {(kanji.onYomi.length > 0 || kanji.kunYomi.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>読み</Text>
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
          </View>
        )}

        {kanji.meaningsMnList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>モンゴル語の意味</Text>
            {kanji.meaningsMnList.map((meaning, index) => (
              <Text key={`${index}-${meaning}`} style={styles.meaningLine}>
                {`${index + 1}. ${meaning}`}
              </Text>
            ))}
          </View>
        )}

        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>似ている漢字</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarRow}
            >
              {similar.map((char) => (
                <Pressable
                  key={char}
                  style={styles.similarChip}
                  onPress={() =>
                    navigation.push('KanjiDetail', { character: char })
                  }
                  accessibilityLabel={`${char}の詳細`}
                >
                  <Text style={styles.similarChar}>{char}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  empty: {
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 24,
  },
  character: {
    fontSize: 72,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 84,
    minWidth: 88,
  },
  metaColumn: {
    flex: 1,
    paddingTop: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    width: 40,
  },
  metaValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  readingLine: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
    marginBottom: 6,
  },
  readingLabel: {
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  meaningLine: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: 6,
  },
  similarRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 8,
  },
  similarChip: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarChar: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
});
