import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  FlatList,
} from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import {
  getStrokeCountOptions,
  getRadicalSearchOptions,
  searchKanjiByRadicalAndStrokes,
} from '../utils/kanjiSearch';

const STROKE_CHIP_WIDTH = 52;
const RESULT_COLUMNS = 5;

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: colors.white,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
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
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginRight: 44,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: 24,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    strokeRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 16,
    },
    chip: {
      minWidth: STROKE_CHIP_WIDTH,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
      alignItems: 'center',
    },
    chipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    radicalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    radicalChip: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radicalChar: {
      fontSize: 22,
      color: colors.textPrimary,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    resultCount: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    clearBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    clearText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    hint: {
      paddingHorizontal: 24,
      paddingTop: 32,
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 22,
    },
    empty: {
      paddingHorizontal: 24,
      paddingTop: 32,
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    resultGrid: {
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    strokeResultSection: {
      paddingTop: 8,
    },
    resultCell: {
      flex: 1,
      aspectRatio: 1,
      margin: 4,
      borderRadius: 12,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultCellPressed: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    resultChar: {
      fontSize: 28,
      color: colors.textPrimary,
    },
  });
}

export default function KanjiSearchScreen({ navigation }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const strokeOptions = useMemo(() => getStrokeCountOptions(), []);
  const radicalOptions = useMemo(() => getRadicalSearchOptions(), []);

  const [strokeCount, setStrokeCount] = useState(null);
  const [selectedRadicals, setSelectedRadicals] = useState([]);

  const results = useMemo(
    () => searchKanjiByRadicalAndStrokes({ strokeCount, radicals: selectedRadicals }),
    [strokeCount, selectedRadicals],
  );

  const hasFilter = strokeCount !== null || selectedRadicals.length > 0;
  const showStrokeResults = strokeCount !== null;
  const showRadicalResults = strokeCount === null && selectedRadicals.length > 0;

  const toggleRadical = useCallback((display) => {
    setSelectedRadicals((prev) =>
      prev.includes(display) ? prev.filter((r) => r !== display) : [...prev, display],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setStrokeCount(null);
    setSelectedRadicals([]);
  }, []);

  const handleSelectKanji = useCallback(
    (character) => {
      navigation.navigate('KanjiDetail', { character });
    },
    [navigation],
  );

  const renderResultItem = useCallback(
    ({ item }) => (
      <Pressable
        style={({ pressed }) => [styles.resultCell, pressed && styles.resultCellPressed]}
        onPress={() => handleSelectKanji(item)}
        accessibilityLabel={t('kanjiDetailA11y', item)}
      >
        <Text style={styles.resultChar}>{item}</Text>
      </Pressable>
    ),
    [handleSelectKanji, styles, t],
  );

  const renderResultsBlock = (showToolbar = true) => (
    <>
      {showToolbar && (
        <View style={styles.toolbar}>
          <Text style={styles.resultCount}>
            {t('kanjiSearchResultCount', results.length)}
          </Text>
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <Text style={styles.clearText}>{t('clearFilters')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {results.length === 0 ? (
        <Text style={styles.empty}>{t('kanjiSearchEmpty')}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item}
          renderItem={renderResultItem}
          numColumns={RESULT_COLUMNS}
          scrollEnabled={false}
          contentContainerStyle={styles.resultGrid}
        />
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('back')}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('kanjiSearchTitle')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('strokes')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.strokeRow}>
              <TouchableOpacity
                style={[styles.chip, strokeCount === null && styles.chipActive]}
                onPress={() => setStrokeCount(null)}
              >
                <Text
                  style={[
                    styles.chipText,
                    strokeCount === null && styles.chipTextActive,
                  ]}
                >
                  {t('strokeAny')}
                </Text>
              </TouchableOpacity>
              {strokeOptions.map(({ count }) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.chip, strokeCount === count && styles.chipActive]}
                  onPress={() => setStrokeCount(count)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      strokeCount === count && styles.chipTextActive,
                    ]}
                  >
                    {t('strokeCountOption', count)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {showStrokeResults && (
          <View style={[styles.section, styles.strokeResultSection]}>
            {renderResultsBlock()}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('radical')}</Text>
          <View style={styles.radicalGrid}>
            {radicalOptions.map(({ display }) => {
              const active = selectedRadicals.includes(display);
              return (
                <TouchableOpacity
                  key={display}
                  style={[styles.radicalChip, active && styles.chipActive]}
                  onPress={() => toggleRadical(display)}
                  accessibilityLabel={t('radicalChipA11y', display)}
                >
                  <Text style={styles.radicalChar}>{display}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {showRadicalResults ? (
          renderResultsBlock()
        ) : !hasFilter ? (
          <Text style={styles.hint}>{t('kanjiSearchHint')}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
