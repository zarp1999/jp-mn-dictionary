import AsyncStorage from '@react-native-async-storage/async-storage';

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

/** Map app favorite words to ESP32 POST /words payload. */
export function favoritesToEpaperPayload(words) {
  const list = Array.isArray(words) ? words : [];
  const mapped = list.slice(0, EPAPER_MAX_WORDS).map((word) => {
    const gloss = Array.isArray(word.definitions)
      ? word.definitions.filter(Boolean).join(', ')
      : '';
    return {
      ja: truncateField(word.headword || ''),
      reading: truncateField(word.reading || ''),
      mn: truncateField(gloss),
    };
  }).filter((word) => word.ja);

  return {
    mode: 'replace',
    words: mapped,
  };
}

function clipReadingLine(prefix, readings, maxLen) {
  const body = Array.isArray(readings)
    ? readings.filter(Boolean).join(' ')
    : String(readings || '');
  const line = body ? `${prefix}${body}` : prefix.trimEnd();
  if (line.length <= maxLen) {
    return line;
  }
  return line.slice(0, maxLen);
}

/** Two-line reading: 音読み … / 訓読み … */
function formatKanjiReading(kanji) {
  const maxLine = Math.floor((EPAPER_MAX_FIELD_LEN - 1) / 2);
  const onLine = clipReadingLine('音読み: ', kanji?.onYomi, maxLine);
  const kunLine = clipReadingLine('訓読み: ', kanji?.kunYomi, maxLine);
  return `${onLine}\n${kunLine}`;
}

function formatKanjiGloss(kanji) {
  if (Array.isArray(kanji?.meaningsMnList)) {
    const first = kanji.meaningsMnList.find((part) => typeof part === 'string' && part.trim());
    if (first) {
      return first.trim();
    }
  }
  if (typeof kanji?.meaningMn === 'string' && kanji.meaningMn.trim()) {
    // Fallback: take only the first sense if joined with ・
    return kanji.meaningMn.split('・')[0].trim();
  }
  return '';
}

/** Map parsed kanji entries to ESP32 POST /words payload. */
export function kanjiToEpaperPayload(kanjiList) {
  const list = Array.isArray(kanjiList) ? kanjiList : [];
  const mapped = list.slice(0, EPAPER_MAX_WORDS).map((kanji) => ({
    ja: truncateField(kanji?.character || ''),
    reading: truncateField(formatKanjiReading(kanji)),
    mn: truncateField(formatKanjiGloss(kanji)),
  })).filter((word) => word.ja);

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

export async function sendWordsToEpaper(host, words) {
  const list = Array.isArray(words) ? words : [];
  return postWordsPayload(host, favoritesToEpaperPayload(list), list.length);
}

export async function sendKanjiToEpaper(host, kanjiList) {
  const list = Array.isArray(kanjiList) ? kanjiList : [];
  return postWordsPayload(host, kanjiToEpaperPayload(list), list.length);
}
