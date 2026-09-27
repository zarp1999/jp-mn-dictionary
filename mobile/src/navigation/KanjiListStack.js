/**
 * 【画面遷移】漢字リストまわりのスタック（ナビ）
 *
 * 役割: レベル一覧 → レベル別漢字 → 漢字詳細 → その漢字を含む語
 * 画面本体: screens/KanjiListScreen.js など
 * 入口: App.js の Drawer.Screen name="KanjiList"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import KanjiListScreen from '../screens/KanjiListScreen';
import KanjiListByLevelScreen from '../screens/KanjiListByLevelScreen';
import KanjiDetailScreen from '../screens/KanjiDetailScreen';
import KanjiWordListScreen from '../screens/KanjiWordListScreen';

const Stack = createNativeStackNavigator();

export default function KanjiListStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="KanjiListMain" component={KanjiListScreen} />
      <Stack.Screen name="KanjiListByLevel" component={KanjiListByLevelScreen} />
      <Stack.Screen name="KanjiDetail">
        {(props) => (
          <KanjiDetailScreen
            {...props}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="KanjiWordList">
        {(props) => (
          <KanjiWordListScreen
            {...props}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
