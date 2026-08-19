import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jp_mn_search_history';
const MAX_HISTORY = 20;

function toHistoryItem(word) {
  const definitions = Array.isArray(word.definitions)
    ? word.definitions.filter(Boolean).slice(0, 3)
    : [];

  return {
    id: word.id,
    headword: word.headword,
    reading: word.reading || '',
    definitions,
  };
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const items = [];

  for (const entry of value) {
    if (!entry || entry.id == null || !entry.headword) {
      continue;
    }
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);
    items.push({
      id: entry.id,
      headword: String(entry.headword),
      reading: entry.reading ? String(entry.reading) : '',
      definitions: Array.isArray(entry.definitions)
        ? entry.definitions.filter(Boolean).slice(0, 3)
        : [],
    });
    if (items.length >= MAX_HISTORY) {
      break;
    }
  }

  return items;
}

export async function loadSearchHistory() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? normalizeHistory(JSON.parse(json)) : [];
  } catch {
    return [];
  }
}

async function saveSearchHistory(items) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    // 保存失敗は無視（次回起動時にリセットされるだけ）
  }
}

export async function addSearchHistoryItem(word) {
  if (!word || word.id == null || !word.headword) {
    return loadSearchHistory();
  }

  const item = toHistoryItem(word);
  const history = await loadSearchHistory();
  const next = [item, ...history.filter((entry) => entry.id !== item.id)].slice(0, MAX_HISTORY);
  await saveSearchHistory(next);
  return next;
}

export async function removeSearchHistoryItem(id) {
  const history = await loadSearchHistory();
  const next = history.filter((entry) => entry.id !== id);
  await saveSearchHistory(next);
  return next;
}

export async function clearSearchHistory() {
  await saveSearchHistory([]);
  return [];
}
