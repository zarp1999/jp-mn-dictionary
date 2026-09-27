/**
 * 【機能】JLPT 単語リスト用データの提供
 *
 * 呼び出し元: WordListScreen / WordListByLevelScreen
 */
import jlptVocabMap from '../data/jlpt_vocab_map.json';
import { getAllWords, hydrateWords } from './dictionary';
import { compareWordsForList } from './listSort';

/** JLPT levels shown in the word list menu (easiest first). */
export const JLPT_VOCAB_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

function levelToKey(level) {
  if (level === undefined || level === null || level === '') {
    return '';
  }
  const text = String(level).trim().toUpperCase();
  if (/^N?[1-5]$/.test(text)) {
    return text.replace(/^N/, '');
  }
  return '';
}

export function countWordsByJlpt(level) {
  const key = levelToKey(level);
  if (!key) {
    return 0;
  }
  const ids = jlptVocabMap[key];
  return Array.isArray(ids) ? ids.length : 0;
}

/**
 * Dictionary words for a JLPT level (term_bank matches only).
 * Order: headword length, then headword (ja), then reading — not gojuon-by-reading.
 * Returns light entries; call hydrateWords() before detail / e-Paper send.
 */
export function listWordsByJlpt(level) {
  const key = levelToKey(level);
  if (!key) {
    return [];
  }
  const ids = jlptVocabMap[key];
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const all = getAllWords();
  const words = [];
  for (const id of ids) {
    const word = all[id];
    if (word) {
      words.push(word);
    }
  }
  words.sort(compareWordsForList);
  return words;
}

/** Hydrate a JLPT list (or a slice) for display / send. */
export function hydrateJlptWords(words) {
  return hydrateWords(words);
}
