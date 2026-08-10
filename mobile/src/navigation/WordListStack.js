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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
