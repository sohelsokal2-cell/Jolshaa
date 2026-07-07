// Simplified Avro-style phonetic transliteration: converts romanized Bangla
// ("banglish", e.g. "ami valo achi") into Bangla Unicode so searches typed in
// English letters can still match Bangla-script content.

const CONSONANT_MAP = [
  ['bh', 'ভ'], ['ch', 'চ'], ['chh', 'ছ'], ['dh', 'ধ'], ['gh', 'ঘ'],
  ['jh', 'ঝ'], ['kh', 'খ'], ['ph', 'ফ'], ['sh', 'শ'], ['th', 'থ'],
  ['rh', 'ঢ়'], ['ng', 'ং'],
  ['b', 'ব'], ['c', 'চ'], ['d', 'দ'], ['f', 'ফ'], ['g', 'গ'], ['h', 'হ'],
  ['j', 'জ'], ['k', 'ক'], ['l', 'ল'], ['m', 'ম'], ['n', 'ন'], ['p', 'প'],
  ['q', 'ক'], ['r', 'র'], ['s', 'স'], ['t', 'ত'], ['v', 'ভ'], ['w', 'ও'],
  ['x', 'ক্স'], ['y', 'য'], ['z', 'জ'],
];

// Vowels have two forms: an independent letter (word-initial or after another
// vowel) and a vowel sign / matra (attached after a consonant). 'a' is the
// inherent vowel in Bangla, so after a consonant it produces no sign at all.
const VOWEL_MAP = [
  // latin, independent form, matra (sign after consonant)
  ['a', 'আ', 'া'], ['i', 'ই', 'ি'], ['u', 'উ', 'ু'], ['e', 'এ', 'ে'], ['o', 'ও', 'ো'],
];

const CONSONANT_SET = new Set(CONSONANT_MAP.map(([, bangla]) => bangla));

// Sort longer keys first so e.g. "chh" is matched before "ch" before "c".
const SORTED_CONSONANTS = [...CONSONANT_MAP].sort((a, b) => b[0].length - a[0].length);

function transliterate(input) {
  if (!input) return '';
  let out = '';
  let i = 0;
  let prevWasConsonant = false;
  const lower = input.toLowerCase();

  while (i < lower.length) {
    let matched = false;

    for (const [latin, bangla] of SORTED_CONSONANTS) {
      if (lower.startsWith(latin, i)) {
        out += bangla;
        i += latin.length;
        matched = true;
        prevWasConsonant = CONSONANT_SET.has(bangla);
        break;
      }
    }
    if (matched) continue;

    for (const [latin, independent, matra] of VOWEL_MAP) {
      if (lower.startsWith(latin, i)) {
        // After a consonant, a vowel attaches as a matra (or nothing for the
        // inherent 'a'); otherwise it takes its full independent form.
        out += prevWasConsonant ? matra : independent;
        i += latin.length;
        matched = true;
        prevWasConsonant = false;
        break;
      }
    }
    if (matched) continue;

    // Unrecognized char (space, digit, existing Bangla script, punctuation) - keep as-is.
    out += input[i];
    i += 1;
    prevWasConsonant = false;
  }

  return out;
}

// Returns [original, phoneticVariant] deduped, so callers can search with both.
function expandQueryVariants(query) {
  const variants = new Set([query]);
  const isLatin = /^[a-zA-Z\s]+$/.test(query);
  if (isLatin) {
    const transliterated = transliterate(query);
    if (transliterated && transliterated !== query) {
      variants.add(transliterated);
    }
  }
  return Array.from(variants);
}

module.exports = { transliterate, expandQueryVariants };
