import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import WordCard from '../components/WordCard';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import {
  EPAPER_MAX_WORDS,
  EPAPER_WIFI_PASSWORD,
  EPAPER_WIFI_SSID,
  loadEpaperHost,
  sendWordsToEpaper,
} from '../utils/epaperSync';

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    toolbar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      gap: 10,
    },
    count: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    sendBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    list: {
      paddingBottom: 20,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 60,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
      marginBottom: 6,
    },
    emptySubText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  });
}

function showAlert(title, message) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(text);
      return;
    }
  }
  Alert.alert(title, message);
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

export default function FavoritesScreen({ navigation, favorites, onToggleFavorite }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const favoriteList = Object.values(favorites);
  const [sending, setSending] = useState(false);

  const handlePressWord = useCallback((word) => {
    navigation.navigate('WordDetail', { word });
  }, [navigation]);

  const runSend = useCallback(async () => {
    setSending(true);
    try {
      const host = await loadEpaperHost();
      const result = await sendWordsToEpaper(host, favoriteList);
      showAlert(
        t('epaperSendTitle'),
        result.truncated
          ? t('epaperSendSuccessTruncated', result.sent, result.totalFavorites, EPAPER_MAX_WORDS)
          : t('epaperSendSuccess', result.sent),
      );
    } catch (error) {
      if (error?.code === 'NO_WORDS') {
        showAlert(t('epaperSendFailed'), t('epaperSendFailedNoWords'));
      } else if (error?.code === 'NETWORK') {
        showAlert(t('epaperSendFailed'), t('epaperSendFailedNetwork'));
      } else {
        showAlert(t('epaperSendFailed'), error?.message || t('epaperSendFailedNetwork'));
      }
    } finally {
      setSending(false);
    }
  }, [favoriteList, t]);

  const handleSendPress = useCallback(async () => {
    if (sending || favoriteList.length === 0) {
      return;
    }

    const host = await loadEpaperHost();
    const ok = await confirmSend(
      t('epaperSendTitle'),
      t(
        'epaperSendMessage',
        EPAPER_WIFI_SSID,
        EPAPER_WIFI_PASSWORD,
        host,
        favoriteList.length,
        EPAPER_MAX_WORDS,
      ),
      t('cancel'),
      t('epaperSendConfirm'),
    );

    if (ok) {
      await runSend();
    }
  }, [favoriteList.length, runSend, sending, t]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title={t('favoritesTitle')} compact />
      </View>

      {favoriteList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyText}>{t('favoritesEmpty')}</Text>
          <Text style={styles.emptySubText}>{t('favoritesEmptySub')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            <Text style={styles.count}>{t('favoritesCount', favoriteList.length)}</Text>
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={handleSendPress}
              disabled={sending}
              accessibilityRole="button"
              accessibilityLabel={t('epaperSend')}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendBtnText}>{t('epaperSend')}</Text>
              )}
            </TouchableOpacity>
          </View>
          <FlatList
            data={favoriteList}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <WordCard
                word={item}
                index={index}
                isFavorite
                onPress={() => handlePressWord(item)}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}
