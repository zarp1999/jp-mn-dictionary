import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SlangListScreen from '../screens/SlangListScreen';
import SlangDetailScreen from '../screens/SlangDetailScreen';

const Stack = createNativeStackNavigator();

export default function SlangStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SlangListMain" component={SlangListScreen} />
      <Stack.Screen name="SlangDetail" component={SlangDetailScreen} />
    </Stack.Navigator>
  );
}
