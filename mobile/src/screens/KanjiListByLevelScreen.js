import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { getKanjiEntry, listKanjiCharactersByJlpt } from '../utils/kanji';
import { confirmAndSendKanjiToEpaper } from '../utils/epaperSendUi';
import { buildEpaperRanges, sliceByRange } from '../utils/epaperRanges';
import EpaperRangePicker from '../components/EpaperRangePicker';

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
    },
    headerRight: {
      minWidth: 44,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingRight: 4,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 120,
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    sendBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      backgroundColor: colors.white,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    empty: {
      paddingHorizontal: 24,
      paddingTop: 40,
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    listFlex: {
      flex: 1,
    },
    resultGrid: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 24,
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

export default function KanjiListByLevelScreen({ navigation, route }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sending, setSending] = useState(false);
  const [rangeIndex, setRangeIndex] = useState(0);

  const level = route.params?.level || '';
  const characters = useMemo(
    () => listKanjiCharactersByJlpt(level),
    [level],
  );

  const kanjiEntries = useMemo(
    () => characters.map((ch) => getKanjiEntry(ch)).filter(Boolean),
    [characters],
  );

  const ranges = useMemo(
    () => buildEpaperRanges(kanjiEntries.length),
    [kanjiEntries.length],
  );

  useEffect(() => {
    setRangeIndex(0);
  }, [level]);

  useEffect(() => {
    if (rangeIndex >= ranges.length) {
      setRangeIndex(Math.max(0, ranges.length - 1));
    }
  }, [rangeIndex, ranges.length]);

  const selectedRange = ranges[rangeIndex] || ranges[0] || null;
  const visibleCharacters = useMemo(
    () => sliceByRange(characters, selectedRange),
    [characters, selectedRange],
  );
  const visibleKanji = useMemo(
    () => sliceByRange(kanjiEntries, selectedRange),
    [kanjiEntries, selectedRange],
  );

  const handleSelectKanji = useCallback(
    (character) => {
      navigation.navigate('KanjiDetail', { character });
    },
    [navigation],
  );

  const handleSendPress = useCallback(async () => {
    if (sending || visibleKanji.length === 0) {
      return;
    }
    setSending(true);
    try {
      await confirmAndSendKanjiToEpaper(visibleKanji, t, {
        range: selectedRange,
      });
    } finally {
      setSending(false);
    }
  }, [selectedRange, sending, t, visibleKanji]);

  const renderItem = useCallback(
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
        <Text style={styles.title} numberOfLines={1}>
          {t('kanjiListLevelLabel', level)}
        </Text>
        <View style={styles.headerRight}>
          {characters.length > 0 ? (
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={handleSendPress}
              disabled={sending}
              accessibilityRole="button"
              accessibilityLabel={t('epaperSend')}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sendBtnText} numberOfLines={2}>
                  {t('epaperSend')}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {characters.length === 0 ? (
        <Text style={styles.empty}>{t('kanjiListEmpty')}</Text>
      ) : (
        <>
          <FlatList
            data={visibleCharacters}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            numColumns={RESULT_COLUMNS}
            contentContainerStyle={styles.resultGrid}
            extraData={rangeIndex}
            style={styles.listFlex}
          />
          <View style={styles.footer}>
            <EpaperRangePicker
              ranges={ranges}
              selectedIndex={rangeIndex}
              onSelect={setRangeIndex}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
