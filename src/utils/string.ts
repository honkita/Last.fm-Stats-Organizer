/**
 * String length similarity
 * Might use (?)
 * @param a
 * @param b
 * @returns
 */
export const lengthSimilarity = (a: string, b: string) => {
  const lenA = a.length;
  const lenB = b.length;
  return Math.min(lenA, lenB) / Math.max(lenA, lenB);
};
