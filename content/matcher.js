// matcher.js
export function computeSimilarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();

  // Simple ratio: number of matching characters / average length
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }

  return (matches / ((a.length + b.length) / 2)) * 100;
}

export function findBestMatch(fieldLabel, storedData) {
  let bestMatch = { key: null, value: null, score: 0 };

  for (const [key, value] of Object.entries(storedData)) {
    const normalizedKey = key.toLowerCase().replace(/[^\w\s]|_/g, "").trim();
    const similarity = computeSimilarity(fieldLabel, normalizedKey);
    if (similarity > bestMatch.score) {
      bestMatch = { key, value, score: similarity };
    }
  }

  return bestMatch;
}
