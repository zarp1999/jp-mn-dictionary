/**
 * 【画面遷移】写真から検索まわりのスタック（ナビ）
 *
 * 役割:
 *   - 「どの画面をどの順で開くか」だけを定義する（見た目の中身は各 Screen に任せる）
 *   - OcrMain（写真から検索）→ WordDetail（単語詳細）などへ遷移できる
 *
 * 画面本体: screens/OcrScreen.js
 * ドロワーからの入口: App.js の Drawer.Screen name="Ocr"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OcrScreen from '../screens/OcrScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import KanjiDetailScreen from '../screens/KanjiDetailScreen';
import KanjiWordListScreen from '../screens/KanjiWordListScreen';

const Stack = createNativeStackNavigator();

export default function OcrStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      {/* 最初に出す画面（写真選択・OCR） */}
      <Stack.Screen name="OcrMain" component={OcrScreen} />
      {/* 単語チップから開く詳細。お気に入り操作のため props を渡す */}
      <Stack.Screen name="WordDetail">
        {(props) => (
          <WordDetailScreen
            {...props}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </Stack.Screen>
      {/* 詳細から漢字へ進んだとき用 */}
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
