// Censor profane words like Roblox - replace middle letters with asterisks but keep first and last letter

const PROFANE_WORDS = [
  'fuck', 'fck', 'fuk', 'fuc',
  'shit', 'sht',
  'ass', 'asshole',
  'bitch', 'btch',
  'damn', 'damm',
  'hell',
  'piss',
  'crap',
  'dick', 'dck',
  'cock', 'cok',
  'pussy', 'puss',
  'slut',
  'whore',
  'nude',
  'naked',
  'sex',
  'porn',
  'cum',
  'boobs', 'boob',
  'tits', 'tit',
];

// Normalize text for matching (remove obfuscation)
const normalizeWord = (word: string): string => {
  return word
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/[*]/g, '')
    .replace(/[^a-z]/g, '');
};

// Check if a word matches any profane word
const isProfaneWord = (word: string): boolean => {
  if (word.length < 3) return false;
  
  const normalized = normalizeWord(word);
  
  // Check against each profane word
  for (const profane of PROFANE_WORDS) {
    const normalizedProfane = normalizeWord(profane);
    
    // Exact match
    if (normalized === normalizedProfane) {
      return true;
    }
    
    // Check if normalized word contains profane word (for compound words)
    if (normalized.length >= normalizedProfane.length && normalized.includes(normalizedProfane)) {
      return true;
    }
  }
  
  return false;
};

// Censor a word (keep first and last letter, replace middle with asterisks)
const censorWord = (word: string): string => {
  if (word.length <= 2) return word;
  if (word.length === 3) return word[0] + '*' + word[2];
  
  const first = word[0];
  const last = word[word.length - 1];
  const middle = '*'.repeat(word.length - 2);
  return first + middle + last;
};

// Main censoring function
export const censorText = (text: string): string => {
  // Use word boundary regex to split while preserving spaces
  return text.replace(/\b\w+\b/g, (word) => {
    // Check if word is profane
    if (isProfaneWord(word)) {
      return censorWord(word);
    }
    return word;
  });
};

