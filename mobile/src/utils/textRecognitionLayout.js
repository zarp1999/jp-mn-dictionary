/**
 * 【機能】OCR ブロックの後処理（画面ではない）
 *
 * 役割:
 *   - 横書き / 縦書きを判定する
 *   - 読み順に並べる（横: 上→下・左→右 / 縦: 右列→左列・列内は上→下）
 *   - 教科書のふりがなっぽいブロックを落とす
 *   - 縦書きでは同じ列の断片を1行に結合する
 *
 * ネイティブ依存は無い。textRecognition.js から呼ばれる。
 */

/** ひらがな・カタカナだけの文字列か（ふりがな判定用） */
const KANA_ONLY_REGEX = /^[\u3040-\u309f\u30a0-\u30ff\u30fc\u30fb\s]+$/;

/** 漢字を含むか（本文の基準サイズを取るため） */
const HAS_KANJI_REGEX = /[\u4e00-\u9fff]/;

/** 横書き: ブロック高さの中央値 × この比率より小さいと「小さい」 */
const FURIGANA_HEIGHT_RATIO = 0.6;

/** 縦書き: 本文幅 × この比率より細いとふりがな候補 */
const FURIGANA_WIDTH_RATIO = 0.65;

/** 隣の本文が取れなくても落とす、より細い閾値 */
const FURIGANA_WIDTH_STRICT_RATIO = 0.5;

/** height/width がこれ以上なら縦書き寄り */
const VERTICAL_ASPECT = 1.3;

/** height/width がこれ以下なら横書き寄り */
const HORIZONTAL_ASPECT = 0.75;

/** 列クラスタの許容幅（中央値幅に対する倍率） */
const COLUMN_GAP_RATIO = 0.6;

/** 行クラスタの許容高さ（中央値高さに対する倍率） */
const ROW_GAP_RATIO = 1.15;

export const WRITING_MODE = {
  horizontal: 'horizontal',
  vertical: 'vertical',
};

/** OCR 画面の「自動 / 横 / 縦」 */
export const WRITING_MODE_PREFERENCE = {
  auto: 'auto',
  horizontal: WRITING_MODE.horizontal,
  vertical: WRITING_MODE.vertical,
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function centerX(block) {
  return (block.x ?? 0) + (block.width ?? 0) / 2;
}

function centerY(block) {
  return (block.y ?? 0) + (block.height ?? 0) / 2;
}

function median(values) {
  const sorted = values
    .filter((value) => isFiniteNumber(value) && value > 0)
    .sort((a, b) => a - b);

  if (!sorted.length) {
    return 0;
  }
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function medianWidth(blocks) {
  return median(blocks.map((block) => block.width));
}

function medianHeight(blocks) {
  return median(blocks.map((block) => block.height));
}

function isKanaOnly(text) {
  return KANA_ONLY_REGEX.test(text || '');
}

function hasKanji(text) {
  return HAS_KANJI_REGEX.test(text || '');
}

/** 2区間の重なりが、短い方の minRatio 以上あるか */
function rangesOverlap(a0, a1, b0, b1, minRatio = 0.2) {
  const overlap = Math.min(a1, b1) - Math.max(a0, b0);
  if (overlap <= 0) {
    return false;
  }
  const shorter = Math.min(a1 - a0, b1 - b0);
  return shorter > 0 && overlap / shorter >= minRatio;
}

/**
 * ふりがなっぽい小さい仮名を除いたブロック。
 * 判定を誤らないよう、レイアウト判定の入力に使う。
 */
function bodyLikeBlocks(blocks) {
  const widthRef = medianWidth(blocks);
  const heightRef = medianHeight(blocks);
  if (!widthRef || !heightRef) {
    return blocks;
  }

  const filtered = blocks.filter((block) => {
    if (!isKanaOnly(block.text)) {
      return true;
    }
    const thin = block.width < widthRef * FURIGANA_WIDTH_RATIO;
    const short = block.height < heightRef * FURIGANA_HEIGHT_RATIO;
    return !(thin || short);
  });

  return filtered.length >= 2 ? filtered : blocks;
}

/**
 * 中心座標で列または行にクラスタする。
 * @param {object[]} blocks
 * @param {(block: object) => number} getCenter
 * @param {number} threshold
 * @param {'asc' | 'desc'} direction  列は右→左なので desc
 */
function clusterByCenter(blocks, getCenter, threshold, direction) {
  const sorted = [...blocks].sort((a, b) => {
    const delta = getCenter(a) - getCenter(b);
    return direction === 'desc' ? -delta : delta;
  });

  const groups = [];
  for (const block of sorted) {
    const center = getCenter(block);
    let best = null;
    let bestDist = Infinity;
    for (const group of groups) {
      const dist = Math.abs(group.center - center);
      if (dist <= threshold && dist < bestDist) {
        best = group;
        bestDist = dist;
      }
    }
    if (best) {
      best.blocks.push(block);
      best.center =
        best.blocks.reduce((sum, item) => sum + getCenter(item), 0) /
        best.blocks.length;
    } else {
      groups.push({ center, blocks: [block] });
    }
  }
  return groups;
}

function columnThreshold(blocks) {
  return Math.max(medianWidth(blocks) * COLUMN_GAP_RATIO, 0.015);
}

function rowThreshold(blocks) {
  return Math.max(medianHeight(blocks) * ROW_GAP_RATIO, 0.012);
}

function clusterColumns(blocks) {
  const groups = clusterByCenter(
    blocks,
    centerX,
    columnThreshold(blocks),
    'desc'
  );
  groups.sort((a, b) => b.center - a.center);
  for (const group of groups) {
    group.blocks.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  }
  return groups;
}

function clusterRows(blocks) {
  const groups = clusterByCenter(
    blocks,
    centerY,
    rowThreshold(blocks),
    'asc'
  );
  groups.sort((a, b) => a.center - b.center);
  for (const group of groups) {
    group.blocks.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
  }
  return groups;
}

/**
 * ブロック形状と配置から横書き / 縦書きを決める。
 * 判断がつかないときは横書き（既存の看板・標識を壊さない）。
 */
export function detectWritingMode(blocks) {
  if (!Array.isArray(blocks) || blocks.length < 2) {
    return WRITING_MODE.horizontal;
  }

  const usable = bodyLikeBlocks(blocks);
  const ratios = usable
    .map((block) => {
      const width = block.width;
      const height = block.height;
      if (!isFiniteNumber(width) || !isFiniteNumber(height) || width <= 0) {
        return null;
      }
      return height / width;
    })
    .filter((ratio) => ratio != null);

  const aspect = median(ratios);
  if (aspect >= VERTICAL_ASPECT) {
    return WRITING_MODE.vertical;
  }
  if (aspect > 0 && aspect <= HORIZONTAL_ASPECT) {
    return WRITING_MODE.horizontal;
  }

  const columns = clusterColumns(usable);
  const rows = clusterRows(usable);
  const avgCol = usable.length / Math.max(columns.length, 1);
  const avgRow = usable.length / Math.max(rows.length, 1);

  // 同じ文字が縦に積まれ、列数が行数より少ない → 縦書き
  const stackedInColumns =
    columns.length < rows.length && avgCol >= avgRow;
  const clearlyColumnar = avgCol > avgRow * 1.15;

  return stackedInColumns || clearlyColumnar
    ? WRITING_MODE.vertical
    : WRITING_MODE.horizontal;
}

function isVerticalFurigana(block, blocks, referenceWidth) {
  if (!isKanaOnly(block.text)) {
    return false;
  }
  if (!(block.width < referenceWidth * FURIGANA_WIDTH_RATIO)) {
    return false;
  }

  const hasBodyLeft = blocks.some((other) => {
    if (other === block) {
      return false;
    }
    const otherWider = other.width >= referenceWidth * 0.85;
    if (!otherWider && !hasKanji(other.text)) {
      return false;
    }
    if (centerX(other) >= centerX(block)) {
      return false;
    }
    const gap = (block.x ?? 0) - ((other.x ?? 0) + (other.width ?? 0));
    if (gap > referenceWidth * 1.8) {
      return false;
    }
    if (
      rangesOverlap(
        block.y ?? 0,
        (block.y ?? 0) + (block.height ?? 0),
        other.y ?? 0,
        (other.y ?? 0) + (other.height ?? 0),
        0.2,
      )
    ) {
      return true;
    }
    // 列末のルビ（例: 強の右の「う」）は y がずれても左列に漢字があれば落とす
    return hasKanji(other.text) && gap <= referenceWidth * 0.5;
  });

  return hasBodyLeft;
}

function dropHorizontalFurigana(blocks) {
  const heightRef = medianHeight(blocks);
  if (!heightRef) {
    return blocks;
  }
  return blocks.filter((block) => {
    const isSmall = block.height < heightRef * FURIGANA_HEIGHT_RATIO;
    return !(isSmall && isKanaOnly(block.text));
  });
}

function dropVerticalFurigana(blocks) {
  const kanjiBlocks = blocks.filter((block) => hasKanji(block.text));
  const referenceWidth = kanjiBlocks.length
    ? medianWidth(kanjiBlocks)
    : medianWidth(blocks);
  if (!referenceWidth) {
    return blocks;
  }
  return blocks.filter((block) => !isVerticalFurigana(block, blocks, referenceWidth));
}

/**
 * 小さい「かなだけ」のブロックを落とす。
 * 落とさないと「勉強べんきょう」のように本文とルビがつながる。
 * @param {object[]} blocks
 * @param {'horizontal' | 'vertical'} [writingMode]
 */
export function dropFuriganaBlocks(blocks, writingMode) {
  if (!Array.isArray(blocks) || blocks.length < 3) {
    return blocks;
  }

  const mode = writingMode || detectWritingMode(blocks);
  const filtered =
    mode === WRITING_MODE.vertical
      ? dropVerticalFurigana(blocks)
      : dropHorizontalFurigana(blocks);

  const hadText = blocks.some((block) => (block.text || '').trim());
  const keptText = filtered.some((block) => (block.text || '').trim());
  if (hadText && !keptText) {
    return blocks;
  }
  return filtered;
}

/**
 * 読み順に並べる。縦書きは列を結合せず、列内の断片順だけ整える。
 */
export function sortBlocksByReadingOrder(blocks, writingMode) {
  if (!Array.isArray(blocks) || blocks.length < 2) {
    return Array.isArray(blocks) ? [...blocks] : [];
  }

  const mode = writingMode || detectWritingMode(blocks);
  if (mode === WRITING_MODE.vertical) {
    return clusterColumns(blocks).flatMap((column) => column.blocks);
  }

  const rows = clusterRows(blocks);
  return rows.flatMap((row) => row.blocks);
}

/**
 * 縦書きの同じ列を1ブロックにまとめる（辞書引き用の「行」にする）。
 */
export function mergeVerticalColumns(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }
  if (blocks.length === 1) {
    return [...blocks];
  }

  return clusterColumns(blocks)
    .map((column) => {
      const items = column.blocks;
      if (items.length === 1) {
        return items[0];
      }

      const texts = items.map((item) => item.text).filter(Boolean);
      const xs = items.map((item) => item.x ?? 0);
      const ys = items.map((item) => item.y ?? 0);
      const rights = items.map((item) => (item.x ?? 0) + (item.width ?? 0));
      const bottoms = items.map((item) => (item.y ?? 0) + (item.height ?? 0));
      const confidences = items
        .map((item) => item.confidence)
        .filter((value) => isFiniteNumber(value));

      return {
        text: texts.join(''),
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...rights) - Math.min(...xs),
        height: Math.max(...bottoms) - Math.min(...ys),
        confidence: confidences.length
          ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
          : undefined,
      };
    })
    .filter((block) => block.text);
}

function resolveWritingMode(blocks, preference) {
  if (
    preference === WRITING_MODE.horizontal ||
    preference === WRITING_MODE.vertical
  ) {
    return preference;
  }
  return detectWritingMode(blocks);
}

function blocksToLines(displayBlocks) {
  if (!Array.isArray(displayBlocks)) {
    return [];
  }
  return displayBlocks.map((block) => block.text).filter(Boolean);
}

/**
 * 認識ブロックを、画面表示用の行に整える。
 * @returns {{ writingMode: string, blocks: object[] }}
 */
export function layoutRecognizedBlocks(
  blocks,
  {
    dropFurigana = true,
    /** 縦書き（小説など）ではデフォルト OFF。教科書ルビ除去は true を渡す */
    dropFuriganaForVertical = false,
    writingModePreference = WRITING_MODE_PREFERENCE.auto,
  } = {},
) {
  const source = Array.isArray(blocks) ? blocks : [];
  const writingMode = resolveWritingMode(source, writingModePreference);
  const shouldDropFurigana =
    dropFurigana &&
    (writingMode !== WRITING_MODE.vertical || dropFuriganaForVertical);

  let working = source;
  if (shouldDropFurigana) {
    working = dropFuriganaBlocks(source, writingMode);
  }

  const ordered = sortBlocksByReadingOrder(working, writingMode);
  const displayBlocks =
    writingMode === WRITING_MODE.vertical
      ? mergeVerticalColumns(ordered)
      : ordered;

  return { writingMode, blocks: displayBlocks };
}

/**
 * 行が空にならないよう、ふりがな OFF・縦横の切替・生ブロックまで試す。
 */
export function layoutRecognizedBlocksWithFallback(blocks, options = {}) {
  const source = Array.isArray(blocks) ? blocks : [];
  if (!source.length) {
    return {
      writingMode: WRITING_MODE.horizontal,
      blocks: [],
      lines: [],
    };
  }

  const preference = options.writingModePreference ?? WRITING_MODE_PREFERENCE.auto;
  const attempts = [];

  const pushUnique = (opts) => {
    const key = JSON.stringify(opts);
    if (!attempts.some((item) => JSON.stringify(item) === key)) {
      attempts.push(opts);
    }
  };

  pushUnique({ ...options, writingModePreference: preference });

  if (preference === WRITING_MODE_PREFERENCE.vertical) {
    pushUnique({
      ...options,
      writingModePreference: WRITING_MODE.vertical,
      dropFurigana: false,
    });
    pushUnique({
      ...options,
      writingModePreference: WRITING_MODE.vertical,
      dropFurigana: true,
      dropFuriganaForVertical: false,
    });
  } else if (preference === WRITING_MODE_PREFERENCE.horizontal) {
    pushUnique({
      ...options,
      writingModePreference: WRITING_MODE.horizontal,
      dropFurigana: false,
    });
  } else {
    pushUnique({ ...options, dropFurigana: false });
    pushUnique({
      ...options,
      writingModePreference: WRITING_MODE.vertical,
      dropFurigana: false,
    });
    pushUnique({
      ...options,
      writingModePreference: WRITING_MODE.horizontal,
      dropFurigana: false,
    });
  }

  for (const attempt of attempts) {
    const layout = layoutRecognizedBlocks(source, attempt);
    const lines = blocksToLines(layout.blocks);
    if (lines.length > 0) {
      return { ...layout, lines };
    }
  }

  const mode = resolveWritingMode(source, preference);
  const ordered = sortBlocksByReadingOrder(source, mode);
  const rawLines = ordered.map((block) => (block.text || '').trim()).filter(Boolean);
  if (rawLines.length > 0) {
    return {
      writingMode: mode,
      blocks: rawLines.map((text) => ({ text })),
      lines: rawLines,
      usedRawFallback: true,
    };
  }

  const anyText = source
    .map((block) => (block.text || '').trim())
    .filter(Boolean);
  if (anyText.length > 0) {
    return {
      writingMode: mode,
      blocks: anyText.map((text) => ({ text })),
      lines: anyText,
      usedRawFallback: true,
    };
  }

  return {
    writingMode: mode,
    blocks: [],
    lines: [],
  };
}
