/**
 * 【画面遷移】お気に入りまわりのスタック（ナビ）
 *
 * 役割: お気に入り一覧 → 単語詳細 / 漢字詳細 への遷移
 * 画面本体: screens/FavoritesScreen.js
 * 入口: App.js の Drawer.Screen name="Favorites"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FavoritesScreen from '../screens/FavoritesScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import KanjiDetailScreen from '../screens/KanjiDetailScreen';
import KanjiWordListScreen from '../screens/KanjiWordListScreen';

const Stack = createNativeStackNavigator();

export default function FavoritesStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="FavoritesMain">
        {(props) => (
          <FavoritesScreen
            {...props}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="WordDetail">
        {(props) => (
          <WordDetailScreen
            {...props}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </Stack.Screen>
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
