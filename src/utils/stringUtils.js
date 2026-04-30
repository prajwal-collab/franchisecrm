/**
 * Normalizes a string by converting to lowercase, trimming, 
 * and removing common suffixes like "District" or "Dist".
 */
export const normalizeName = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+district$/i, '')
    .replace(/\s+dist\.?$/i, '')
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' '); // Normalize spaces
};

/**
 * Calculates Dice's Coefficient (0 to 1) between two strings.
 */
export const getSimilarity = (str1, str2) => {
  const s1 = normalizeName(str1).replace(/\s+/g, '');
  const s2 = normalizeName(str2).replace(/\s+/g, '');
  
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Set();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substring(i, i + 2));
  }

  let intersect = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    if (bigrams1.has(bigram)) {
      intersect++;
    }
  }

  return (2 * intersect) / (s1.length + s2.length - 2);
};

/**
 * Finds the best match for an input string in a list of targets.
 * @param {string} input - The string to match.
 * @param {Array} targets - List of target objects or strings.
 * @param {string} [key] - If targets are objects, the key to match against.
 * @param {number} [threshold=0.6] - Minimum similarity score.
 */
export const findBestMatch = (input, targets, key, threshold = 0.6) => {
  if (!input || !targets || targets.length === 0) return null;

  let bestMatch = null;
  let highestScore = -1;

  const normalizedInput = normalizeName(input);

  for (const target of targets) {
    const targetName = key ? target[key] : target;
    const normalizedTarget = normalizeName(targetName);

    // 1. Exact match (after normalization)
    if (normalizedInput === normalizedTarget) {
      return { target, score: 1, exact: true };
    }

    // 2. Substring match
    if (normalizedTarget.includes(normalizedInput) || normalizedInput.includes(normalizedTarget)) {
      const score = Math.min(normalizedInput.length, normalizedTarget.length) / Math.max(normalizedInput.length, normalizedTarget.length);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = target;
      }
    }

    // 3. Fuzzy match
    const fuzzyScore = getSimilarity(normalizedInput, normalizedTarget);
    if (fuzzyScore > highestScore) {
      highestScore = fuzzyScore;
      bestMatch = target;
    }
  }

  if (highestScore >= threshold) {
    return { target: bestMatch, score: highestScore, exact: false };
  }

  return null;
};
