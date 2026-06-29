import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FavoritesScreen from '../screens/FavoritesScreen';
import WordDetailScreen from '../screens/WordDetailScreen';

const Stack = createNativeStackNavigator();

export default function FavoritesStack({ favorites, onToggleFavorite }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    </Stack.Navigator>
  );
}
