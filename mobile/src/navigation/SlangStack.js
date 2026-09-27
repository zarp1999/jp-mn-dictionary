/**
 * 【画面遷移】スラングまわりのスタック（ナビ）
 *
 * 役割: スラング一覧 → スラング詳細
 * 画面本体: screens/SlangListScreen.js / SlangDetailScreen.js
 * 機能データ: utils/slang.js
 * 入口: App.js の Drawer.Screen name="Slang"
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SlangListScreen from '../screens/SlangListScreen';
import SlangDetailScreen from '../screens/SlangDetailScreen';

const Stack = createNativeStackNavigator();

export default function SlangStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="SlangListMain" component={SlangListScreen} />
      <Stack.Screen name="SlangDetail" component={SlangDetailScreen} />
    </Stack.Navigator>
  );
}
