// Server-side profanity checking utility (for API routes)

// Manual list of prohibited words (same as username check)
const PROHIBITED_WORDS = [
  'sex', 'sexx', 'sexxx', 'sexxxx', 'sexs', 'sexxs', '8itch',
  'bitches', 'bitchesss', 'bitch', 'btch', 'butch', '8ltch', 'p00or',
  'suckmydck', 'dck', 'dick', 'd1ck', 'd1c', 'dik',
  'boobs', 'boob', 'b00bs', 'b00b', 'bo0bs',
  'tits', 'tit', 't1ts', 't1t', 'titties',
  'fuck', 'fck', 'fuk', 'fuc', 'f*ck',
  'ass', 'asshole', 'a$$', 'a55',
  'porn', 'p0rn', 'pr0n',
  'cum', 'c*m', 'c0m',
  'cock', 'c0ck', 'cok',
  'pussy', 'puss', 'p*ssy',
  'slut', 'sl*t', 's1ut',
  'whore', 'wh0re', 'wh*re',
  'nude', 'nud3', 'n*de',
  'naked', 'nak3d', 'n*k*d',
];

// Normalize text by removing common obfuscation characters (same as username normalization)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    // Replace common obfuscation characters with letters
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    // Remove special characters and numbers
    .replace(/[^a-z]/g, '')
    // Remove repeated characters (e.g., "sexxx" -> "sex")
    .replace(/(.)\1{2,}/g, '$1$1');
};

// Check if text contains any prohibited word
// Only matches whole words, not substrings within words
const containsProhibitedWord = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  
  // Split text into words using word boundaries (handles punctuation properly)
  // This ensures we only match whole words, not substrings
  const words = lowerText.split(/\W+/).filter(w => w.length > 0);
  
  for (const word of PROHIBITED_WORDS) {
    const lowerWord = word.toLowerCase();
    const normalizedWord = normalizeText(word);
    
    // Check each word in the text
    for (const wordInText of words) {
      // Skip if word is too short
      if (wordInText.length < 3) continue;
      
      const normalizedWordInText = normalizeText(wordInText);
      
      // Exact match (case-insensitive)
      if (wordInText === lowerWord) {
        return true;
      }
      
      // Check normalized match (for obfuscation like "b00bs" -> "boobs")
      // Only if lengths are similar (within 2 characters to avoid false positives)
      if (Math.abs(normalizedWordInText.length - normalizedWord.length) <= 2) {
        if (normalizedWordInText === normalizedWord) {
          return true;
        }
        
        // Fuzzy match only for similar length words with higher threshold
        if (normalizedWordInText.length >= normalizedWord.length - 1 && 
            normalizedWordInText.length <= normalizedWord.length + 1) {
          const similarity = calculateSimilarity(normalizedWordInText, normalizedWord);
          if (similarity > 0.9) { // Very high threshold to reduce false positives
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

// Calculate similarity
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Levenshtein distance
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Server-side profanity check (without API calls for performance)
export const checkProfanityServer = async (text: string): Promise<boolean> => {
  // Layer 1: Manual prohibited words check
  if (containsProhibitedWord(text)) {
    return false; // Contains profanity
  }
  
  // Layer 2: API check (for server-side)
  try {
    const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
    if (response.ok) {
      const isProfane = await response.json();
      if (isProfane) {
        return false; // Contains profanity
      }
    }
  } catch {
    // Continue if API fails
  }
  
  // Layer 3: Check normalized version
  try {
    const normalized = normalizeText(text);
    if (normalized !== text.toLowerCase()) {
      const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(normalized)}`);
      if (response.ok) {
        const isProfane = await response.json();
        if (isProfane) {
          return false; // Contains profanity
        }
      }
    }
  } catch {
    // Continue if API fails
  }
  
  // Layer 4: Check individual words (whole words only)
  try {
    const words = text.split(/\b/).filter(w => w.trim().length > 2);
    for (const word of words) {
      const cleanWord = word.trim().replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(cleanWord)}`);
        if (response.ok) {
          const isProfane = await response.json();
          if (isProfane) {
            return false; // Contains profanity
          }
        }
      }
    }
  } catch {
    // Continue if API fails
  }
  
  // Layer 5: bad-words library check
  try {
    const { Filter } = await import("bad-words");
    const filter = new Filter();
    if (filter.isProfane(text)) {
      return false; // Contains profanity
    }
    
    const normalized = normalizeText(text);
    if (normalized !== text.toLowerCase() && filter.isProfane(normalized)) {
      return false; // Contains profanity
    }
    
    // Check individual words (whole words only)
    const words = text.split(/\b/).filter(w => w.trim().length > 2);
    for (const word of words) {
      const cleanWord = word.trim().replace(/[^\w]/g, '');
      if (cleanWord.length > 2 && filter.isProfane(cleanWord)) {
        return false; // Contains profanity
      }
    }
  } catch {
    // Continue if library fails
  }
  
  // Layer 6: Final check
  const normalized = normalizeText(text);
  if (containsProhibitedWord(normalized)) {
    return false; // Contains profanity
  }
  
  return true; // Text is clean
};

