import AsyncStorage from '@react-native-async-storage/async-storage';
import { getKanjiEntry } from './kanji';
import { isKanjiFavorite } from './favorites';
import {
  getKanjiMeaningsList,
  getWordDefinitions,
} from './meaningOverrides';

const HOST_KEY = '@epaper_host';

export const DEFAULT_EPAPER_HOST = '192.168.4.1';
export const EPAPER_WIFI_SSID = 'Wordbook_AP';
export const EPAPER_WIFI_PASSWORD = '12345678';
export const EPAPER_MAX_WORDS = 80;
export const EPAPER_MAX_FIELD_LEN = 96;
export const EPAPER_TIMEOUT_MS = 8000;

function truncateField(value) {
  const text = String(value ?? '').trim();
  if (text.length <= EPAPER_MAX_FIELD_LEN) {
    return text;
  }
  return text.slice(0, EPAPER_MAX_FIELD_LEN);
}

export function normalizeEpaperHost(host) {
  return String(host ?? '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

export function buildEpaperBaseUrl(host = DEFAULT_EPAPER_HOST) {
  const normalized = normalizeEpaperHost(host) || DEFAULT_EPAPER_HOST;
  return `http://${normalized}`;
}

export async function loadEpaperHost() {
  try {
    const saved = await AsyncStorage.getItem(HOST_KEY);
    return normalizeEpaperHost(saved) || DEFAULT_EPAPER_HOST;
  } catch {
    return DEFAULT_EPAPER_HOST;
  }
}

export async function saveEpaperHost(host) {
  const normalized = normalizeEpaperHost(host) || DEFAULT_EPAPER_HOST;
  await AsyncStorage.setItem(HOST_KEY, normalized);
  return normalized;
}

function mapWordToEpaperItem(word, overrides) {
  const gloss = getWordDefinitions(word, overrides).filter(Boolean).join(', ');
  return {
    ja: truncateField(word.headword || ''),
    reading: truncateField(word.reading || ''),
    mn: truncateField(gloss),
  };
}

function mapKanjiToEpaperItem(kanji, overrides) {
  const meanings = getKanjiMeaningsList(kanji, overrides);
  const gloss = meanings[0] || '';
  return {
    ja: truncateField(kanji?.character || ''),
    reading: truncateField(formatKanjiReading(kanji)),
    mn: truncateField(gloss),
  };
}

export function favoritesToEpaperPayload(items, overrides = null) {
  const list = Array.isArray(items) ? items : [];
  const mapped = [];

  for (const item of list) {
    if (mapped.length >= EPAPER_MAX_WORDS) {
      break;
    }

    const row = isKanjiFavorite(item)
      ? mapKanjiToEpaperItem(getKanjiEntry(item.character) || item, overrides)
      : mapWordToEpaperItem(item, overrides);

    if (row.ja) {
      mapped.push(row);
    }
  }

  return {
    mode: 'replace',
    words: mapped,
  };
}

const KANJI_READING_SEP = '、';

function clipReadingLine(prefix, readings, maxLen) {
  const body = Array.isArray(readings)
    ? readings.filter(Boolean).join(KANJI_READING_SEP)
    : String(readings || '');
  const line = body ? `${prefix}${body}` : prefix.trimEnd();
  if (line.length <= maxLen) {
    return line;
  }
  /* Prefer cutting at reading separators so we do not split mid-reading. */
  const cut = line.slice(0, maxLen);
  const lastSep = cut.lastIndexOf(KANJI_READING_SEP);
  if (lastSep > prefix.length) {
    return cut.slice(0, lastSep);
  }
  return cut;
}

/** Two-line reading: 音読み … / 訓読み … (fits WORDBOOK_MAX_FIELD_LEN). */
function formatKanjiReading(kanji) {
  const onBudget = Math.floor((EPAPER_MAX_FIELD_LEN - 1) * 0.55);
  const onLine = clipReadingLine('音読み: ', kanji?.onYomi, onBudget);
  const kunBudget = Math.max(24, EPAPER_MAX_FIELD_LEN - onLine.length - 1);
  const kunLine = clipReadingLine('訓読み: ', kanji?.kunYomi, kunBudget);
  return `${onLine}\n${kunLine}`;
}

/** Map parsed kanji entries to ESP32 POST /words payload. */
export function kanjiToEpaperPayload(kanjiList, overrides = null) {
  const list = Array.isArray(kanjiList) ? kanjiList : [];
  const mapped = list
    .slice(0, EPAPER_MAX_WORDS)
    .map((kanji) => mapKanjiToEpaperItem(
      {
        ...kanji,
        meaningsMnList: getKanjiMeaningsList(kanji, overrides),
      },
      overrides,
    ))
    .filter((word) => word.ja);

  return {
    mode: 'replace',
    words: mapped,
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = EPAPER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function pingEpaper(host) {
  const baseUrl = buildEpaperBaseUrl(host);
  const response = await fetchWithTimeout(`${baseUrl}/`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function postWordsPayload(host, payload, sourceCount) {
  if (!payload.words.length) {
    const error = new Error('NO_WORDS');
    error.code = 'NO_WORDS';
    throw error;
  }

  const baseUrl = buildEpaperBaseUrl(host);
  let response;
  try {
    response = await fetchWithTimeout(`${baseUrl}/words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const wrapped = new Error('NETWORK');
    wrapped.code = 'NETWORK';
    wrapped.cause = error;
    throw wrapped;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.ok) {
    const wrapped = new Error(data?.error || `HTTP ${response.status}`);
    wrapped.code = 'HTTP';
    wrapped.status = response.status;
    wrapped.data = data;
    throw wrapped;
  }

  return {
    count: data.count ?? payload.words.length,
    truncated: sourceCount > EPAPER_MAX_WORDS,
    totalFavorites: sourceCount,
    totalSource: sourceCount,
    sent: payload.words.length,
  };
}

export async function sendWordsToEpaper(host, words, overrides = null) {
  const list = Array.isArray(words) ? words : [];
  return postWordsPayload(host, favoritesToEpaperPayload(list, overrides), list.length);
}

export async function sendKanjiToEpaper(host, kanjiList, overrides = null) {
  const list = Array.isArray(kanjiList) ? kanjiList : [];
  return postWordsPayload(host, kanjiToEpaperPayload(list, overrides), list.length);
}
