import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WRITING_MODE,
  detectWritingMode,
  dropFuriganaBlocks,
  layoutRecognizedBlocks,
  layoutRecognizedBlocksWithFallback,
} from './textRecognitionLayout.js';

test('横書きの看板は上から下の行のまま', () => {
  const blocks = [
    { text: '日本語の看板', x: 0.1, y: 0.1, width: 0.8, height: 0.08 },
    { text: '営業中', x: 0.2, y: 0.28, width: 0.4, height: 0.08 },
  ];

  assert.equal(detectWritingMode(blocks), WRITING_MODE.horizontal);

  const { lines } = linesOf(blocks);
  assert.deepEqual(lines, ['日本語の看板', '営業中']);
});

test('横書きのふりがなを本文から外す', () => {
  const blocks = [
    { text: '勉強', x: 0.1, y: 0.2, width: 0.4, height: 0.12 },
    { text: 'べんきょう', x: 0.1, y: 0.12, width: 0.4, height: 0.05 },
    { text: 'する', x: 0.55, y: 0.2, width: 0.2, height: 0.12 },
  ];

  const kept = dropFuriganaBlocks(blocks, WRITING_MODE.horizontal).map(
    (block) => block.text
  );
  assert.deepEqual(kept, ['勉強', 'する']);
});

test('縦書きは右の列から読み、列を1行にまとめる', () => {
  const blocks = [
    { text: '側', x: 0.38, y: 0.22, width: 0.08, height: 0.09 },
    { text: '本', x: 0.62, y: 0.1, width: 0.08, height: 0.09 },
    { text: '右', x: 0.38, y: 0.1, width: 0.08, height: 0.09 },
    { text: 'が', x: 0.62, y: 0.34, width: 0.08, height: 0.09 },
    { text: '文', x: 0.62, y: 0.22, width: 0.08, height: 0.09 },
  ];

  assert.equal(detectWritingMode(blocks), WRITING_MODE.vertical);

  const { writingMode, lines } = linesOf(blocks);
  assert.equal(writingMode, WRITING_MODE.vertical);
  assert.deepEqual(lines, ['本文が', '右側']);
});

test('縦書きのふりがな（本文の右の細い仮名）を落とす', () => {
  const blocks = [
    { text: '勉', x: 0.4, y: 0.1, width: 0.12, height: 0.1 },
    { text: '強', x: 0.4, y: 0.22, width: 0.12, height: 0.1 },
    { text: 'べ', x: 0.54, y: 0.1, width: 0.04, height: 0.05 },
    { text: 'ん', x: 0.54, y: 0.16, width: 0.04, height: 0.05 },
    { text: 'き', x: 0.54, y: 0.22, width: 0.04, height: 0.05 },
    { text: 'ょ', x: 0.54, y: 0.28, width: 0.04, height: 0.05 },
    { text: 'う', x: 0.54, y: 0.34, width: 0.04, height: 0.05 },
  ];

  const { writingMode, lines } = linesOf(blocks, {
    dropFuriganaForVertical: true,
  });
  assert.equal(writingMode, WRITING_MODE.vertical);
  assert.deepEqual(lines, ['勉強']);
});

test('全部ひらがなの縦書きはふりがなとして落とさない', () => {
  const blocks = [
    { text: 'あ', x: 0.6, y: 0.1, width: 0.1, height: 0.1 },
    { text: 'い', x: 0.6, y: 0.22, width: 0.1, height: 0.1 },
    { text: 'う', x: 0.6, y: 0.34, width: 0.1, height: 0.1 },
    { text: 'え', x: 0.4, y: 0.1, width: 0.1, height: 0.1 },
    { text: 'お', x: 0.4, y: 0.22, width: 0.1, height: 0.1 },
    { text: 'か', x: 0.4, y: 0.34, width: 0.1, height: 0.1 },
  ];

  const { writingMode, lines } = linesOf(blocks);
  assert.equal(writingMode, WRITING_MODE.vertical);
  assert.deepEqual(lines, ['あいう', 'えおか']);
});

test('縦書きでルビ除去が本文を全消しする場合はフォールバックで行を残す', () => {
  const blocks = [
    { text: 'あ', x: 0.6, y: 0.1, width: 0.02, height: 0.04 },
    { text: 'い', x: 0.6, y: 0.16, width: 0.02, height: 0.04 },
    { text: 'う', x: 0.6, y: 0.22, width: 0.02, height: 0.04 },
  ];

  const { lines } = layoutRecognizedBlocksWithFallback(blocks, {
    writingModePreference: WRITING_MODE.vertical,
    dropFurigana: true,
    dropFuriganaForVertical: true,
  });
  assert.ok(lines.length > 0);
});

function linesOf(blocks, options) {
  const layout = layoutRecognizedBlocks(blocks, options);
  return {
    writingMode: layout.writingMode,
    lines: layout.blocks.map((block) => block.text),
  };
}
