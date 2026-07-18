import rawKanjiData from '../data/kanji_bank_1.json';

const KANJI_REGEX = /[\u4e00-\u9fff]/;

/** 部首の表記ゆれをまとめる（表示は先頭、検索は全バリアント） */
const RADICAL_VARIANT_GROUPS = [
  ['水', '氵', '氺'],
  ['艸', '艹'],
  ['金', '釒'],
  ['手', '扌'],
  ['人', '亻'],
  ['心', '忄'],
  ['肉', '⺼'],
  ['刀', '刂', '⺈'],
  ['食', '飠', '𩙿'],
  ['示', '礻'],
  ['衣', '衤'],
  ['糸', '糹', '纟'],
  ['网', '罒', '⺲', '罓'],
  ['辵', '辶', '⻌'],
  ['阜', '阝'],
];

let _indexBuilt = false;
let _strokeIndex = null;
let _radicalPartIndex = null;
let _displayRadicalMap = null;
let _radicalOptions = null;
let _strokeOptions = null;
let _partToDisplay = null;

function parseStrokeNumber(value) {
  if (!value) {
    return null;
  }
  const head = String(value).split('（')[0].split('(')[0].trim().replace(/画/g, '').trim();
  const normalized = head.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
  const num = parseInt(normalized, 10);
  return Number.isFinite(num) ? num : null;
}

function parseRadicalParts(radical) {
  if (!radical) {
    return [];
  }
  const head = String(radical).split('（')[0].split('(')[0].trim();
  return head.split(/\s+/).filter((part) => part && KANJI_REGEX.test(part));
}

function buildPartToDisplayMap() {
  const partToDisplay = new Map();

  for (const group of RADICAL_VARIANT_GROUPS) {
    const display = group[0];
    for (const part of group) {
      partToDisplay.set(part, display);
    }
  }

  return partToDisplay;
}

function buildDisplayRadicalMap(partToDisplay) {
  const displayMap = new Map();

  for (const group of RADICAL_VARIANT_GROUPS) {
    displayMap.set(group[0], {
      display: group[0],
      parts: [...group],
      count: 0,
    });
  }

  for (const part of _radicalPartIndex.keys()) {
    const display = partToDisplay.get(part) || part;
    if (!displayMap.has(display)) {
      displayMap.set(display, {
        display,
        parts: [part],
        count: 0,
      });
    } else {
      const entry = displayMap.get(display);
      if (!entry.parts.includes(part)) {
        entry.parts.push(part);
      }
    }
  }

  for (const entry of displayMap.values()) {
    const characters = new Set();
    for (const part of entry.parts) {
      for (const character of _radicalPartIndex.get(part) || []) {
        characters.add(character);
      }
    }
    entry.count = characters.size;
  }

  return displayMap;
}

function buildKanjiSearchIndex() {
  if (_indexBuilt) {
    return;
  }

  _strokeIndex = new Map();
  _radicalPartIndex = new Map();
  _partToDisplay = buildPartToDisplayMap();

  for (const item of rawKanjiData) {
    const character = item[0];
    if (!character || !KANJI_REGEX.test(character)) {
      continue;
    }

    const metadata = item[5] || {};
    const strokeCount = parseStrokeNumber(metadata['画数'] || metadata['総画'] || '');
    const parts = parseRadicalParts(metadata['部首'] || '');

    if (strokeCount !== null) {
      if (!_strokeIndex.has(strokeCount)) {
        _strokeIndex.set(strokeCount, []);
      }
      _strokeIndex.get(strokeCount).push(character);
    }

    for (const part of parts) {
      if (!_radicalPartIndex.has(part)) {
        _radicalPartIndex.set(part, []);
      }
      _radicalPartIndex.get(part).push(character);
    }
  }

  _displayRadicalMap = buildDisplayRadicalMap(_partToDisplay);
  _radicalOptions = [..._displayRadicalMap.values()]
    .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display, 'ja'));

  _strokeOptions = [..._strokeIndex.keys()].sort((a, b) => a - b);

  _indexBuilt = true;
}

function intersectSets(a, b) {
  const result = new Set();
  for (const value of a) {
    if (b.has(value)) {
      result.add(value);
    }
  }
  return result;
}

function getCharactersForRadicalDisplay(display) {
  buildKanjiSearchIndex();
  const entry = _displayRadicalMap.get(display);
  if (!entry) {
    return new Set(_radicalPartIndex.get(display) || []);
  }

  const result = new Set();
  for (const part of entry.parts) {
    for (const character of _radicalPartIndex.get(part) || []) {
      result.add(character);
    }
  }
  return result;
}

export function getStrokeCountOptions() {
  buildKanjiSearchIndex();
  return _strokeOptions.map((count) => ({
    count,
    size: _strokeIndex.get(count).length,
  }));
}

export function getRadicalSearchOptions() {
  buildKanjiSearchIndex();
  return _radicalOptions.map(({ display, count }) => ({ display, count }));
}

export function searchKanjiByRadicalAndStrokes({ strokeCount = null, radicals = [] } = {}) {
  buildKanjiSearchIndex();

  const selectedRadicals = (radicals || []).filter(Boolean);
  let candidates = null;

  if (strokeCount !== null && strokeCount !== undefined) {
    candidates = new Set(_strokeIndex.get(strokeCount) || []);
  }

  for (const display of selectedRadicals) {
    const radicalSet = getCharactersForRadicalDisplay(display);
    candidates = candidates ? intersectSets(candidates, radicalSet) : radicalSet;
  }

  if (!candidates) {
    return [];
  }

  return [...candidates].sort((a, b) => a.localeCompare(b, 'ja'));
}

export function formatStrokeOptionLabel(count, t) {
  if (typeof t === 'function') {
    return t('strokeCountOption', count);
  }
  return `${count}画`;
}
