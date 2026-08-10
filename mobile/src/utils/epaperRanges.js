import { EPAPER_MAX_WORDS } from './epaperSync';

/**
 * Build 1-based display ranges of pageSize items.
 * @returns {{ start: number, end: number, from: number, to: number }[]}
 *   start/end = 0-based slice indices [start, end)
 *   from/to = 1-based inclusive labels for UI (e.g. 81–160)
 */
export function buildEpaperRanges(total, pageSize = EPAPER_MAX_WORDS) {
  const n = Number(total) || 0;
  const size = Math.max(1, Number(pageSize) || EPAPER_MAX_WORDS);
  if (n <= 0) {
    return [];
  }

  const ranges = [];
  for (let start = 0; start < n; start += size) {
    const end = Math.min(start + size, n);
    ranges.push({
      start,
      end,
      from: start + 1,
      to: end,
    });
  }
  return ranges;
}

export function sliceByRange(list, range) {
  if (!Array.isArray(list) || !range) {
    return [];
  }
  return list.slice(range.start, range.end);
}
