import grammarData from '../data/grammar_mn.json';

export const GRAMMAR_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const GRAMMAR_OTHER_LEVEL = 'other';

let _items = null;
let _byId = null;
let _byLevel = null;

function normalizeLevel(level) {
  if (!level || level === GRAMMAR_OTHER_LEVEL) {
    return GRAMMAR_OTHER_LEVEL;
  }
  const text = String(level).trim().toUpperCase();
  if (GRAMMAR_LEVELS.includes(text)) {
    return text;
  }
  return GRAMMAR_OTHER_LEVEL;
}

function normalizeGrammarQuery(text) {
  return String(text || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[〜～~]/g, '');
}

function getSearchHaystack(item) {
  if (item._haystack) {
    return item._haystack;
  }

  const parts = [item.pattern, ...(item.aliases || [])];
  for (const headword of item.headwords || []) {
    if (headword.kanji) {
      parts.push(headword.kanji);
    }
    if (headword.furigana) {
      parts.push(headword.furigana);
    }
  }

  item._haystack = normalizeGrammarQuery(parts.join('\n'));
  return item._haystack;
}

function getAllGrammar() {
  if (!_items) {
    _items = grammarData.map((item) => ({
      ...item,
      level: normalizeLevel(item.level),
    }));
  }
  return _items;
}

function getGrammarByIdMap() {
  if (!_byId) {
    _byId = new Map();
    for (const item of getAllGrammar()) {
      _byId.set(item.id, item);
    }
  }
  return _byId;
}

function getGrammarByLevelMap() {
  if (!_byLevel) {
    _byLevel = new Map();
    for (const item of getAllGrammar()) {
      const list = _byLevel.get(item.level);
      if (list) {
        list.push(item);
      } else {
        _byLevel.set(item.level, [item]);
      }
    }
  }
  return _byLevel;
}

export function countGrammarByLevel(level) {
  const key = normalizeLevel(level);
  return getGrammarByLevelMap().get(key)?.length || 0;
}

export function listGrammarByLevel(level) {
  const key = normalizeLevel(level);
  return getGrammarByLevelMap().get(key) || [];
}

export function getGrammarById(id) {
  return getGrammarByIdMap().get(id) || null;
}

export function searchGrammar(items, query) {
  const q = normalizeGrammarQuery(query);
  if (!q) {
    return items;
  }
  return items.filter((item) => getSearchHaystack(item).includes(q));
}

export function searchAllGrammar(query, limit = 20) {
  const q = normalizeGrammarQuery(query);
  if (!q) {
    return [];
  }
  return searchGrammar(getAllGrammar(), q).slice(0, limit);
}

export function getGrammarMeaning(item, isMongolian) {
  if (isMongolian) {
    return item.meaning_mn || item.meaning_jp || '';
  }
  return item.meaning_jp || item.meaning_mn || '';
}

export function getGrammarNote(item, isMongolian) {
  if (isMongolian) {
    return item.note_mn || item.note_jp || '';
  }
  return item.note_jp || item.note_mn || '';
}

export function getGrammarHeadwordLine(item) {
  const readings = (item.headwords || [])
    .map((headword) => headword.furigana)
    .filter((reading) => reading && reading !== item.pattern);
  return [...new Set(readings)].join(' / ');
}
