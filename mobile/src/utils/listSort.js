/**
 * JLPT 単語・漢字リストの並び（五十音／読み順ではない）
 */

function primaryHeadword(headword) {
  if (!headword) {
    return '';
  }
  const first = headword.split(';').map((p) => p.trim()).find(Boolean);
  return first || headword;
}

/** 表記の短い順 → 表記の辞書順 → 読み */
export function compareWordsForList(a, b) {
  const aH = primaryHeadword(a.headword);
  const bH = primaryHeadword(b.headword);

  if (aH.length !== bH.length) {
    return aH.length - bH.length;
  }

  const byHead = aH.localeCompare(bH, 'ja');
  if (byHead !== 0) {
    return byHead;
  }

  return (a.reading || '').localeCompare(b.reading || '', 'ja');
}

const FULLWIDTH_DIGIT_OFFSET = '０'.charCodeAt(0) - '0'.charCodeAt(0);

export function parseStrokeCountNumber(metadata) {
  const raw = metadata?.['画数'] || metadata?.['総画'] || '';
  if (!raw) {
    return Number.POSITIVE_INFINITY;
  }

  const match = String(raw).match(/[0-9０-９]+/);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const digits = match[0].replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - FULLWIDTH_DIGIT_OFFSET),
  );
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

/** 画数の少ない順 → 文字の Unicode 順 */
export function compareKanjiCharactersForList(aChar, bChar, strokeForChar) {
  const aStroke = strokeForChar(aChar);
  const bStroke = strokeForChar(bChar);
  if (aStroke !== bStroke) {
    return aStroke - bStroke;
  }
  return aChar.localeCompare(bChar, 'ja');
}
