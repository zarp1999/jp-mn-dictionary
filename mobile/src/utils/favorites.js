import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jp_mn_favorites';

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

export async function toggleFavorite(favMap, word) {
  const newMap = { ...favMap };
  if (newMap[word.id]) {
    delete newMap[word.id];
  } else {
    newMap[word.id] = word;
  }
  await saveFavorites(newMap);
  return newMap;
}
