export const levenshtein = <T>(s: T[], t: T[]): number => {
  const sLen = s.length;
  const tLen = t.length;
  return levenshteinRecurrence(s, sLen, t, tLen);
}

const levenshteinRecurrence = <T>(s: T[], sLen: number, t: T[], tLen: number): number => {
  // base case: empty strings
  if (sLen == 0) return tLen;
  if (tLen == 0) return sLen;
  // test if last characters of the strings match
  let cost = (s[sLen-1] == t[tLen-1] ? 0 : 1);
  // return minimum of delete char from s, delete char from t, and delete char from both
  return Math.min(levenshteinRecurrence(s, sLen-1, t, tLen)+1,
                  levenshteinRecurrence(s, sLen, t, tLen-1)+1,
                  levenshteinRecurrence(s, sLen-1, t, tLen-1)+cost);
}
