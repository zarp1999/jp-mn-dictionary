import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import KanjiListScreen from '../screens/KanjiListScreen';
import KanjiListByLevelScreen from '../screens/KanjiListByLevelScreen';
import KanjiDetailScreen from '../screens/KanjiDetailScreen';
import KanjiWordListScreen from '../screens/KanjiWordListScreen';

const Stack = createNativeStackNavigator();

export default function KanjiListStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KanjiListMain" component={KanjiListScreen} />
      <Stack.Screen name="KanjiListByLevel" component={KanjiListByLevelScreen} />
      <Stack.Screen name="KanjiDetail" component={KanjiDetailScreen} />
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
