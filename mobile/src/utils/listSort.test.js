import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareWordsForList,
  parseStrokeCountNumber,
  compareKanjiCharactersForList,
} from './listSort.js';

test('compareWordsForList: shorter headword first, not reading order', () => {
  const short = { headword: '食事', reading: 'しょくじ' };
  const long = { headword: '食べる', reading: 'たべる' };
  assert.ok(compareWordsForList(short, long) < 0);
  assert.ok(compareWordsForList(long, short) > 0);
});

test('parseStrokeCountNumber: fullwidth digits from 画数', () => {
  assert.equal(parseStrokeCountNumber({ 画数: '１画（一１＋０）' }), 1);
  assert.equal(parseStrokeCountNumber({ 画数: '１２画' }), 12);
  assert.equal(parseStrokeCountNumber({}), Number.POSITIVE_INFINITY);
});

test('compareKanjiCharactersForList: stroke count then char', () => {
  const stroke = (ch) => (ch === '一' ? 1 : ch === '語' ? 14 : 99);
  assert.ok(compareKanjiCharactersForList('一', '語', stroke) < 0);
});
