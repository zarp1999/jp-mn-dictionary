import { Alert, Platform } from 'react-native';
import {
  EPAPER_MAX_WORDS,
  EPAPER_WIFI_PASSWORD,
  EPAPER_WIFI_SSID,
  loadEpaperHost,
  sendKanjiToEpaper,
} from './epaperSync';

export function showEpaperAlert(title, message) {
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

/**
 * Confirm Wi-Fi steps, then POST kanji cards (replace mode).
 * @returns {Promise<'cancelled'|'sent'|'failed'>}
 */
/**
 * @param {object} [options]
 * @param {{ from: number, to: number }} [options.range] 1-based inclusive range for confirm copy
 */
export async function confirmAndSendKanjiToEpaper(kanjiList, t, options = {}) {
  const list = Array.isArray(kanjiList) ? kanjiList.filter((k) => k?.character) : [];
  if (list.length === 0) {
    showEpaperAlert(t('epaperSendFailed'), t('epaperSendFailedNoKanji'));
    return 'failed';
  }

  const host = await loadEpaperHost();
  const range = options?.range;
  const message = range
    ? t(
      'epaperSendKanjiRangeMessage',
      EPAPER_WIFI_SSID,
      EPAPER_WIFI_PASSWORD,
      host,
      range.from,
      range.to,
      list.length,
    )
    : t(
      'epaperSendKanjiMessage',
      EPAPER_WIFI_SSID,
      EPAPER_WIFI_PASSWORD,
      host,
      list.length,
      EPAPER_MAX_WORDS,
    );

  const ok = await confirmSend(
    t('epaperSendTitle'),
    message,
    t('cancel'),
    t('epaperSendConfirm'),
  );

  if (!ok) {
    return 'cancelled';
  }

  try {
    const result = await sendKanjiToEpaper(host, list, options?.overrides ?? null);
    showEpaperAlert(
      t('epaperSendTitle'),
      t('epaperSendKanjiSuccess', result.sent),
    );
    return 'sent';
  } catch (error) {
    if (error?.code === 'NO_WORDS') {
      showEpaperAlert(t('epaperSendFailed'), t('epaperSendFailedNoKanji'));
    } else if (error?.code === 'NETWORK') {
      showEpaperAlert(t('epaperSendFailed'), t('epaperSendFailedNetwork'));
    } else {
      showEpaperAlert(
        t('epaperSendFailed'),
        error?.message || t('epaperSendFailedNetwork'),
      );
    }
    return 'failed';
  }
}
