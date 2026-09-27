/**
 * 【画面遷移】単語リスト（JLPT）まわりのスタック（ナビ）
 *
 * 役割: レベル一覧 → レベル別単語一覧 → 単語詳細
 * 画面本体: screens/WordListScreen.js / WordListByLevelScreen.js
 * 入口: App.js の Drawer.Screen name="WordList"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WordListScreen from '../screens/WordListScreen';
import WordListByLevelScreen from '../screens/WordListByLevelScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import KanjiDetailScreen from '../screens/KanjiDetailScreen';
import KanjiWordListScreen from '../screens/KanjiWordListScreen';

const Stack = createNativeStackNavigator();

export default function WordListStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="WordListMain" component={WordListScreen} />
      <Stack.Screen name="WordListByLevel">
        {(props) => (
          <WordListByLevelScreen
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
