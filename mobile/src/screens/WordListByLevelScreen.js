import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import WordCard from '../components/WordCard';
import EpaperRangePicker from '../components/EpaperRangePicker';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { hydrateJlptWords, listWordsByJlpt } from '../utils/jlptVocab';
import {
  EPAPER_WIFI_PASSWORD,
  EPAPER_WIFI_SSID,
  loadEpaperHost,
  sendWordsToEpaper,
} from '../utils/epaperSync';
import { showEpaperAlert } from '../utils/epaperSendUi';
import { buildEpaperRanges, sliceByRange } from '../utils/epaperRanges';

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
    list: {
      paddingBottom: 24,
    },
  });
}

function confirmSend(title, message, cancelLabel, confirmLabel) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined' && window.confirm) {
      return Promise.resolve(window.confirm(text));
    }
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

export default function WordListByLevelScreen({
  navigation,
  route,
  favorites,
  onToggleFavorite,
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sending, setSending] = useState(false);
  const [rangeIndex, setRangeIndex] = useState(0);

  const level = route.params?.level || '';
  const words = useMemo(() => listWordsByJlpt(level), [level]);

  const ranges = useMemo(() => buildEpaperRanges(words.length), [words.length]);

  useEffect(() => {
    setRangeIndex(0);
  }, [level]);

  useEffect(() => {
    if (rangeIndex >= ranges.length) {
      setRangeIndex(Math.max(0, ranges.length - 1));
    }
  }, [rangeIndex, ranges.length]);

  const selectedRange = ranges[rangeIndex] || ranges[0] || null;
  const visibleWords = useMemo(
    () => sliceByRange(words, selectedRange),
    [words, selectedRange],
  );

  const handlePressWord = useCallback(
    (word) => {
      const [hydrated] = hydrateJlptWords([word]);
      navigation.navigate('WordDetail', { word: hydrated || word });
    },
    [navigation],
  );

  const handleSendPress = useCallback(async () => {
    if (sending || visibleWords.length === 0) {
      return;
    }

    const host = await loadEpaperHost();
    const ok = await confirmSend(
      t('epaperSendTitle'),
      selectedRange
        ? t(
          'epaperSendListRangeMessage',
          EPAPER_WIFI_SSID,
          EPAPER_WIFI_PASSWORD,
          host,
          selectedRange.from,
          selectedRange.to,
          visibleWords.length,
        )
        : t(
          'epaperSendListMessage',
          EPAPER_WIFI_SSID,
          EPAPER_WIFI_PASSWORD,
          host,
          visibleWords.length,
          visibleWords.length,
        ),
      t('cancel'),
      t('epaperSendConfirm'),
    );
    if (!ok) {
      return;
    }

    setSending(true);
    try {
      const payloadWords = hydrateJlptWords(visibleWords);
      const result = await sendWordsToEpaper(host, payloadWords);
      showEpaperAlert(
        t('epaperSendTitle'),
        t('epaperSendSuccess', result.sent),
      );
    } catch (error) {
      if (error?.code === 'NO_WORDS') {
        showEpaperAlert(t('epaperSendFailed'), t('epaperSendFailedNoWords'));
      } else if (error?.code === 'NETWORK') {
        showEpaperAlert(t('epaperSendFailed'), t('epaperSendFailedNetwork'));
      } else {
        showEpaperAlert(
          t('epaperSendFailed'),
          error?.message || t('epaperSendFailedNetwork'),
        );
      }
    } finally {
      setSending(false);
    }
  }, [selectedRange, sending, t, visibleWords]);

  const renderItem = useCallback(
    ({ item, index }) => {
      const [hydrated] = hydrateJlptWords([item]);
      const word = hydrated || item;
      return (
        <WordCard
          word={word}
          index={index}
          isFavorite={!!favorites?.[word.id]}
          onPress={() => handlePressWord(word)}
          onToggleFavorite={onToggleFavorite}
        />
      );
    },
    [favorites, handlePressWord, onToggleFavorite],
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
          {t('wordListLevelLabel', level)}
        </Text>
        <View style={styles.headerRight}>
          {words.length > 0 ? (
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

      {words.length === 0 ? (
        <Text style={styles.empty}>{t('wordListEmpty')}</Text>
      ) : (
        <>
          <FlatList
            data={visibleWords}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            initialNumToRender={20}
            windowSize={7}
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
