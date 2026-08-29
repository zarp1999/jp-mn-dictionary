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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
