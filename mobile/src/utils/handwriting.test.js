import test from 'node:test';
import assert from 'node:assert/strict';
import { insertCandidate, strokePath } from './handwriting.js';
test('candidate inserts at caret and replaces selection', () => {
  assert.deepEqual(insertCandidate('日本', { start: 1, end: 1 }, '語'), { text: '日語本', selection: { start: 2, end: 2 } });
  assert.equal(insertCandidate('日本', { start: 0, end: 2 }, '木').text, '木');
  assert.equal(insertCandidate('日', null, '本').text, '日本');
});
test('selection is clamped and supplementary kanji preserved', () => {
  assert.equal(insertCandidate('', { start: 99, end: 99 }, '𠮷').selection.start, 2);
  assert.equal(insertCandidate('木', { start: -4, end: -1 }, '大').text, '大木');
});
test('empty, dot and multi-point paths', () => {
  assert.equal(strokePath([]), '');
  assert.match(strokePath([{ x: 1, y: 2 }]), /l 0.1 0.1/);
  assert.equal(strokePath([{ x: 1, y: 2 }, { x: 3, y: 4 }]), 'M 1 2 L 3 4');
});
