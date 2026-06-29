import { tokenizeJapanese } from './kuromojiTokenizer';

const KANJI_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

const segmentCache = new Map();

export function katakanaToHiragana(text) {
  return text.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function parseExample(raw) {
  const colonIndex = raw.indexOf(': ');
  if (colonIndex === -1) {
    return { japanese: raw.trim(), translation: null };
  }

  return {
    japanese: raw.slice(0, colonIndex).trim(),
    translation: raw.slice(colonIndex + 2).trim(),
  };
}

function tokenNeedsFurigana(surface, readingHiragana) {
  if (!KANJI_REGEX.test(surface)) {
    return false;
  }
  if (!readingHiragana) {
    return false;
  }
  return readingHiragana !== surface;
}

export async function getFuriganaSegments(text) {
  if (!text) {
    return [];
  }

  if (segmentCache.has(text)) {
    return segmentCache.get(text);
  }

  const tokens = await tokenizeJapanese(text);
  const segments = tokens.map((token) => {
    const surface = token.surface_form;
    const readingHiragana = token.reading
      ? katakanaToHiragana(token.reading)
      : '';
    const furigana = tokenNeedsFurigana(surface, readingHiragana)
      ? readingHiragana
      : null;

    return { text: surface, furigana };
  });

  segmentCache.set(text, segments);
  return segments;
}
