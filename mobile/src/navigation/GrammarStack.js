import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GrammarListScreen from '../screens/GrammarListScreen';
import GrammarListByLevelScreen from '../screens/GrammarListByLevelScreen';
import GrammarDetailScreen from '../screens/GrammarDetailScreen';

const Stack = createNativeStackNavigator();

export default function GrammarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GrammarListMain" component={GrammarListScreen} />
      <Stack.Screen name="GrammarListByLevel" component={GrammarListByLevelScreen} />
      <Stack.Screen name="GrammarDetail" component={GrammarDetailScreen} />
    </Stack.Navigator>
  );
}
