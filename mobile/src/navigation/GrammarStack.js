/**
 * 【画面遷移】文法まわりのスタック（ナビ）
 *
 * 役割: レベル一覧 → レベル別文法一覧 → 文法詳細
 * 画面本体: screens/GrammarListScreen.js など
 * 機能データ: utils/grammar.js
 * 入口: App.js の Drawer.Screen name="Grammar"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GrammarListScreen from '../screens/GrammarListScreen';
import GrammarListByLevelScreen from '../screens/GrammarListByLevelScreen';
import GrammarDetailScreen from '../screens/GrammarDetailScreen';

const Stack = createNativeStackNavigator();

export default function GrammarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="GrammarListMain" component={GrammarListScreen} />
      <Stack.Screen name="GrammarListByLevel" component={GrammarListByLevelScreen} />
      <Stack.Screen name="GrammarDetail" component={GrammarDetailScreen} />
    </Stack.Navigator>
  );
}
