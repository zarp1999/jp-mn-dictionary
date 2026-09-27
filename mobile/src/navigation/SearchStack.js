/**
 * 【画面遷移】検索まわりのスタック（ナビ）
 *
 * 役割: 検索 → 単語詳細 / 漢字詳細 / 文法・スラング詳細などへの遷移だけを定義
 * 画面本体: screens/SearchScreen.js
 * 入口: App.js の Drawer.Screen name="Search"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SearchScreen from '../screens/SearchScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import KanjiDetailScreen from '../screens/KanjiDetailScreen';
import KanjiSearchScreen from '../screens/KanjiSearchScreen';
import KanjiWordListScreen from '../screens/KanjiWordListScreen';
import GrammarDetailScreen from '../screens/GrammarDetailScreen';
import SlangDetailScreen from '../screens/SlangDetailScreen';

const Stack = createNativeStackNavigator();

export default function SearchStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="SearchMain">
        {(props) => (
          <SearchScreen
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
      <Stack.Screen name="KanjiSearch" component={KanjiSearchScreen} />
      <Stack.Screen name="KanjiWordList">
        {(props) => (
          <KanjiWordListScreen
            {...props}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="GrammarDetail" component={GrammarDetailScreen} />
      <Stack.Screen name="SlangDetail" component={SlangDetailScreen} />
    </Stack.Navigator>
  );
}
