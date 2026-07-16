import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'react-native';

import SearchStack from './src/navigation/SearchStack';
import FavoritesStack from './src/navigation/FavoritesStack';
import SettingsScreen from './src/screens/SettingsScreen';
import DrawerContent from './src/components/DrawerContent';
import { loadFavorites, toggleFavorite, saveFavorites } from './src/utils/favorites';
import { initKuromoji } from './src/utils/kuromojiTokenizer';
import { warmUpDictionarySearch } from './src/utils/dictionary';
import { COLORS } from './src/constants/colors';
import { LocaleProvider } from './src/i18n/LocaleContext';

const Drawer = createDrawerNavigator();

function AppNavigator() {
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    loadFavorites().then(setFavorites);
    initKuromoji().catch((error) => {
      console.warn('Failed to initialize Kuromoji', error);
    });
    warmUpDictionarySearch().catch((error) => {
      console.warn('Failed to warm up dictionary search', error);
    });
  }, []);

  const handleToggleFavorite = useCallback(async (word) => {
    const newMap = await toggleFavorite(favorites, word);
    setFavorites(newMap);
  }, [favorites]);

  const handleClearFavorites = useCallback(async () => {
    await saveFavorites({});
    setFavorites({});
  }, []);

  const favoritesCount = Object.keys(favorites).length;

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Drawer.Navigator
        drawerContent={(props) => (
          <DrawerContent {...props} favoritesCount={favoritesCount} />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: {
            width: 260,
            backgroundColor: COLORS.white,
          },
          overlayColor: COLORS.overlay,
        }}
      >
        <Drawer.Screen name="Search">
          {() => (
            <SearchStack
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </Drawer.Screen>

        <Drawer.Screen name="Favorites">
          {() => (
            <FavoritesStack
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </Drawer.Screen>

        <Drawer.Screen name="Settings">
          {() => (
            <SettingsScreen
              favoritesCount={favoritesCount}
              onClearFavorites={handleClearFavorites}
            />
          )}
        </Drawer.Screen>
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AppNavigator />
    </LocaleProvider>
  );
}
