import slangData from '../data/slang_mn.json';

let _items = null;
let _byId = null;

function normalizeSlangQuery(text) {
  return String(text || '')
    .normalize('NFC')
    .trim()
    .toLowerCase();
}

function getSearchHaystack(item) {
  if (item._haystack) {
    return item._haystack;
  }

  const parts = [
    item.term,
    item.reading,
    item.meaning_mn,
    item.meaning_en,
  ];

  item._haystack = normalizeSlangQuery(parts.filter(Boolean).join('\n'));
  return item._haystack;
}

function compareSlangTerms(a, b) {
  return a.term.localeCompare(b.term, 'ja');
}

export function getAllSlang() {
  if (!_items) {
    _items = slangData.slice().sort(compareSlangTerms);
  }
  return _items;
}

function getSlangByIdMap() {
  if (!_byId) {
    _byId = new Map();
    for (const item of getAllSlang()) {
      _byId.set(item.id, item);
    }
  }
  return _byId;
}

export function getSlangById(id) {
  return getSlangByIdMap().get(id) || null;
}

export function searchSlang(items, query) {
  const q = normalizeSlangQuery(query);
  if (!q) {
    return items;
  }
  return items.filter((item) => getSearchHaystack(item).includes(q));
}

export function searchAllSlang(query, limit = 20) {
  const q = normalizeSlangQuery(query);
  if (!q) {
    return [];
  }
  return searchSlang(getAllSlang(), q).slice(0, limit);
}

export function getSlangMeaning(item) {
  return item.meaning_mn || item.meaning_en || '';
}

export function formatSlangTags(item) {
  return (item.tags || [])
    .map((tag) => String(tag).replace(/_/g, ' ').trim())
    .filter(Boolean);
}
