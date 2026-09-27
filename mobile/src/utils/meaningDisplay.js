/**
 * 【機能】モンゴル語訳と英語訳を並べて表示用セクションに組む
 *
 * 呼び出し元: WordDetailScreen
 */
/**
 * Always show MN then EN when available (word detail).
 * Falls back to whichever exists if one is empty.
 */
export function buildMeaningSections(mnDefs, enDefs) {
  const mn = Array.isArray(mnDefs) ? mnDefs.filter(Boolean) : [];
  const en = Array.isArray(enDefs) ? enDefs.filter(Boolean) : [];
  const sections = [];

  if (mn.length) {
    sections.push({ lang: 'mn', items: mn });
  }
  if (en.length) {
    sections.push({ lang: 'en', items: en });
  }

  return sections;
}
