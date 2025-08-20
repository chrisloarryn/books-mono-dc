export function normalizeRating(r?: any) {
  if (r === undefined || r === null || r === '') return undefined;
  const n = Number(r);
  if (!Number.isFinite(n)) return undefined;
  if (n < 1 || n > 5) throw new Error('Rating must be between 1 and 5');
  return Math.round(n);
}
