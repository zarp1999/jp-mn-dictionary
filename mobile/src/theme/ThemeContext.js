import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColorsForTheme } from '../constants/colors';

export const THEMES = {
  light: 'light',
  dark: 'dark',
};

const STORAGE_KEY = '@jp_mn_theme';

const ThemeContext = createContext({
  theme: THEMES.dark,
  colors: getColorsForTheme(THEMES.dark),
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(THEMES.dark);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === THEMES.light || saved === THEMES.dark) {
          setThemeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((next) => {
    if (next !== THEMES.light && next !== THEMES.dark) {
      return;
    }
    setThemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === THEMES.light ? THEMES.dark : THEMES.light);
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      colors: getColorsForTheme(theme),
      setTheme,
      toggleTheme,
      isDark: theme === THEMES.dark,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
