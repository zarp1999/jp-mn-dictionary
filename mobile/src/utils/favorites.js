import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jp_mn_favorites';
export const KANJI_FAVORITE_PREFIX = 'kanji:';

export async function loadFavorites() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

export async function saveFavorites(favMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favMap));
  } catch {
    // 保存失敗は無視（次回起動時にリセットされるだけ）
  }
}

export function kanjiFavoriteId(character) {
  return `${KANJI_FAVORITE_PREFIX}${character || ''}`;
}

export function isKanjiFavorite(item) {
  if (!item) {
    return false;
  }
  if (item.kind === 'kanji') {
    return true;
  }
  return String(item.id || '').startsWith(KANJI_FAVORITE_PREFIX);
}

export function toKanjiFavorite(kanji) {
  const character = kanji?.character || '';
  return {
    id: kanjiFavoriteId(character),
    kind: 'kanji',
    character,
  };
}

export async function toggleFavorite(favMap, item) {
  if (!item || item.id == null || item.id === '') {
    return favMap;
  }

  const newMap = { ...favMap };
  if (newMap[item.id]) {
    delete newMap[item.id];
  } else {
    newMap[item.id] = isKanjiFavorite(item) ? toKanjiFavorite(item) : item;
  }
  await saveFavorites(newMap);
  return newMap;
}
