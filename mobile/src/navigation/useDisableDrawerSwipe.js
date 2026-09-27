/**
 * 【画面遷移・共通】詳細画面などでドロワーの左端スワイプを一時オフにする
 *
 * 戻るジェスチャ（スタックのスワイプバック）とドロワー開閉が競合しないようにする。
 * 戻るボタンがある画面（WordDetail など）で useDisableDrawerSwipe() を呼ぶ。
 */
import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

function findDrawerNavigation(navigation) {
  let parent = navigation?.getParent?.();
  while (parent) {
    if (typeof parent.openDrawer === 'function') {
      return parent;
    }
    parent = parent.getParent?.();
  }
  return null;
}

/**
 * On screens with a back button (⇦), prefer the stack swipe-back gesture
 * over opening the side drawer from the left edge.
 */
export function useDisableDrawerSwipe() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const drawer = findDrawerNavigation(navigation);
      if (!drawer) {
        return undefined;
      }
      drawer.setOptions({ swipeEnabled: false });
      return () => {
        drawer.setOptions({ swipeEnabled: true });
      };
    }, [navigation]),
  );
}
