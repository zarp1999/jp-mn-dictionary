import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearKanjiOverride,
  clearWordOverride,
  emptyMeaningOverrides,
  getKanjiMeaningsList,
  getWordDefinitions,
  hasKanjiOverride,
  hasWordOverride,
  loadMeaningOverrides,
  setKanjiOverride,
  setWordOverride,
} from '../utils/meaningOverrides';

const MeaningOverridesContext = createContext({
  overrides: emptyMeaningOverrides(),
  getWordDefinitions: () => [],
  getKanjiMeaningsList: () => [],
  hasWordOverride: () => false,
  hasKanjiOverride: () => false,
  saveWordOverride: async () => {},
  resetWordOverride: async () => {},
  saveKanjiOverride: async () => {},
  resetKanjiOverride: async () => {},
});

export function MeaningOverridesProvider({ children }) {
  const [overrides, setOverrides] = useState(emptyMeaningOverrides());

  useEffect(() => {
    loadMeaningOverrides().then(setOverrides);
  }, []);

  const getWordDefs = useCallback(
    (word) => getWordDefinitions(word, overrides),
    [overrides],
  );

  const getKanjiMeanings = useCallback(
    (kanji) => getKanjiMeaningsList(kanji, overrides),
    [overrides],
  );

  const checkWordOverride = useCallback(
    (wordId) => hasWordOverride(wordId, overrides),
    [overrides],
  );

  const checkKanjiOverride = useCallback(
    (character) => hasKanjiOverride(character, overrides),
    [overrides],
  );

  const saveWordOverride = useCallback(async (wordId, meanings) => {
    const next = await setWordOverride(overrides, wordId, meanings);
    setOverrides(next);
  }, [overrides]);

  const resetWordOverride = useCallback(async (wordId) => {
    const next = await clearWordOverride(overrides, wordId);
    setOverrides(next);
  }, [overrides]);

  const saveKanjiOverrideFn = useCallback(async (character, meanings) => {
    const next = await setKanjiOverride(overrides, character, meanings);
    setOverrides(next);
  }, [overrides]);

  const resetKanjiOverride = useCallback(async (character) => {
    const next = await clearKanjiOverride(overrides, character);
    setOverrides(next);
  }, [overrides]);

  const value = useMemo(
    () => ({
      overrides,
      getWordDefinitions: getWordDefs,
      getKanjiMeaningsList: getKanjiMeanings,
      hasWordOverride: checkWordOverride,
      hasKanjiOverride: checkKanjiOverride,
      saveWordOverride,
      resetWordOverride,
      saveKanjiOverride: saveKanjiOverrideFn,
      resetKanjiOverride,
    }),
    [
      overrides,
      getWordDefs,
      getKanjiMeanings,
      checkWordOverride,
      checkKanjiOverride,
      saveWordOverride,
      resetWordOverride,
      saveKanjiOverrideFn,
      resetKanjiOverride,
    ],
  );

  return (
    <MeaningOverridesContext.Provider value={value}>
      {children}
    </MeaningOverridesContext.Provider>
  );
}

export function useMeaningOverrides() {
  return useContext(MeaningOverridesContext);
}
