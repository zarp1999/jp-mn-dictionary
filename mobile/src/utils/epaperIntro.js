import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const STORAGE_KEY = '@jp_mn_epaper_has_device';

export const EPAPER_SHOP_URL =
  'https://www.facebook.com/profile.php?id=61593484002866';

export async function openEpaperShop() {
  await Linking.openURL(EPAPER_SHOP_URL);
}

export async function hasAcknowledgedEpaperDevice() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved === '1';
  } catch {
    return false;
  }
}

export async function setAcknowledgedEpaperDevice() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // 保存失敗は無視
  }
}

export async function clearAcknowledgedEpaperDevice() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // 削除失敗は無視
  }
}
