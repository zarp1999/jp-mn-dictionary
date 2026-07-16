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
import { useLocale } from '../i18n/LocaleContext';

function MetaChip({ label, value }) {
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

function ReadingBlock({ label, readings }) {
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

export default function KanjiDetailScreen({ navigation, route }) {
  const { t } = useLocale();
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

  const gradeShort = shortenGrade(kanji.grade, (n) => t('gradeYear', n));
  const radicalShort = shortenRadical(kanji.radical);

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
            accessibilityLabel={t('back')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.character}>{kanji.character}</Text>
            <View style={styles.chipColumn}>
              <View style={styles.chipWrap}>
                <MetaChip label={t('strokes')} value={kanji.strokeCount} />
                <MetaChip label={t('jlpt')} value={kanji.jlpt} />
                <MetaChip label={t('grade')} value={gradeShort} />
                <MetaChip label={t('radical')} value={radicalShort} />
              </View>
            </View>
          </View>
        </View>

        {(kanji.onYomi.length > 0 || kanji.kunYomi.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('readings')}</Text>
            <ReadingBlock label={t('onYomi')} readings={kanji.onYomi} />
            <ReadingBlock label={t('kunYomi')} readings={kanji.kunYomi} />
          </View>
        )}

        {kanji.meaningsMnList.length > 0 && (
          <View style={[styles.card, styles.meaningCard]}>
            <Text style={[styles.sectionLabel, styles.meaningLabel]}>
              {t('mongolianMeanings')}
            </Text>
            {kanji.meaningsMnList.map((meaning, index) => (
              <Text key={`${index}-${meaning}`} style={styles.meaningLine}>
                {`${index + 1}. ${meaning}`}
              </Text>
            ))}
          </View>
        )}

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
    color: COLORS.textPrimary,
  },
  empty: {
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  heroCard: {
    backgroundColor: COLORS.white,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginBottom: 2,
  },
  chipValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
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
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  meaningLabel: {
    color: COLORS.primaryText,
  },
  readingBlock: {
    marginBottom: 12,
  },
  readingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  readingChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readingChip: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readingChipText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  meaningLine: {
    fontSize: 16,
    color: COLORS.primaryText,
    lineHeight: 26,
    marginBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  outerLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
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
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarChipPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  similarChar: {
    fontSize: 26,
    color: COLORS.textPrimary,
  },
});
