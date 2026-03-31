const normalizeForDistance = (s: string) =>
  s.replace(/[^a-z0-9]/gi, '').toLowerCase();

export const levenshtein = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
};

export const similarityScore = (a: string, b: string): number => {
  const na = normalizeForDistance(a);
  const nb = normalizeForDistance(b);

  if (!na.length || !nb.length) return 0;

  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
};
