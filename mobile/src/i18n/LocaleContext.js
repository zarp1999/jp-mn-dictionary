import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCALES, translations } from './translations';

const STORAGE_KEY = '@jp_mn_locale';

const LocaleContext = createContext({
  locale: LOCALES.ja,
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key, ...args) => key,
  isMongolian: false,
});

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(LOCALES.ja);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === LOCALES.ja || saved === LOCALES.mn) {
          setLocaleState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((next) => {
    if (next !== LOCALES.ja && next !== LOCALES.mn) {
      return;
    }
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === LOCALES.ja ? LOCALES.mn : LOCALES.ja);
  }, [locale, setLocale]);

  const t = useCallback(
    (key, ...args) => {
      const table = translations[locale] || translations.ja;
      const value = table[key] ?? translations.ja[key] ?? key;
      return typeof value === 'function' ? value(...args) : value;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      isMongolian: locale === LOCALES.mn,
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
