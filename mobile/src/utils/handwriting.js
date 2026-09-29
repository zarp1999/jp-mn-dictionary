export function insertCandidate(text, selection, candidate) {
  const start = Math.max(0, Math.min(text.length, selection?.start ?? text.length));
  const end = Math.max(start, Math.min(text.length, selection?.end ?? start));
  return { text: text.slice(0, start) + candidate + text.slice(end),
    selection: { start: start + candidate.length, end: start + candidate.length } };
}
export function strokePath(points) {
  if (!points.length) return '';
  // A tiny segment renders a dot for a tap.
  return `M ${points[0].x} ${points[0].y} ` + (points.length === 1
    ? `l 0.1 0.1` : points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' '));
}
