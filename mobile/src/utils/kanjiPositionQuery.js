import { normalizeSearchText } from './translationLookup';

export const KANJI_WORD_POSITION = {
  prefix: 'prefix',
  middle: 'middle',
  suffix: 'suffix',
};

const MIDDLE_PATTERN = /^_([\u4e00-\u9fff])_$/;
const PREFIX_PATTERN = /^([\u4e00-\u9fff])_$/;
const SUFFIX_PATTERN = /^_([\u4e00-\u9fff])$/;

export function parseKanjiPositionQuery(query) {
  const trimmed = normalizeSearchText(query);
  if (!trimmed) {
    return null;
  }

  let match = trimmed.match(MIDDLE_PATTERN);
  if (match) {
    return { kanji: match[1], position: KANJI_WORD_POSITION.middle };
  }

  match = trimmed.match(PREFIX_PATTERN);
  if (match) {
    return { kanji: match[1], position: KANJI_WORD_POSITION.prefix };
  }

  match = trimmed.match(SUFFIX_PATTERN);
  if (match) {
    return { kanji: match[1], position: KANJI_WORD_POSITION.suffix };
  }

  return null;
}
