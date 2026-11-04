// Normalizers for phone, email and names, plus the name/location/property matching used to find duplicate leads.

// Digits only, keeping the last 10 (drops +91 and leading 0 for Indian numbers).
export function normalizePhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits.slice(-10) : null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const cleaned = (email ?? "").trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

// ---- Name and text matching (plain TypeScript, no library) ----

const TITLES = new Set(["mr", "mrs", "ms", "miss", "dr", "shri", "smt", "sri"]);
// Words that say nothing about which property someone wants.
const PROPERTY_STOP_WORDS = new Set([
  "the", "and", "for", "with", "near", "ready", "move", "flat", "apartment", "house", "home", "new", "want", "need",
]);

// "Mr. Rahul  Kumar" -> ["rahul", "kumar"]
export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !TITLES.has(token));
}

// How many single-letter edits turn a into b (the classic Levenshtein distance).
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

// 1 = same word, 0.9 = one is the start of the other ("k" and "kumar"), otherwise how close the spelling is.
function tokenScore(a: string, b: string): number {
  if (a === b) return 1;
  if (a.startsWith(b) || b.startsWith(a)) return 0.9;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

// Name similarity from 0 to 1. Each word of the shorter name is matched to its best word in the
// other name, so word order does not matter ("Kumar Rahul" = "Rahul Kumar").
export function nameSimilarity(a: string, b: string): number {
  const first = nameTokens(a);
  const second = nameTokens(b);
  if (first.length === 0 || second.length === 0) return 0;
  const [short, long] = first.length <= second.length ? [first, second] : [second, first];
  const total = short.reduce((sum, token) => sum + Math.max(...long.map((other) => tokenScore(token, other))), 0);
  return total / short.length;
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/(\d)\s*bhk/g, "$1bhk") // "2 BHK" and "2BHK" become the same word
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);
}

function shareAWord(a: string[], b: string[]): boolean {
  return a.some((word) => b.includes(word));
}

export function sameLocation(a: string, b: string): boolean {
  return shareAWord(wordsOf(a).filter((w) => w.length >= 3), wordsOf(b).filter((w) => w.length >= 3));
}

export function overlappingProperty(a: string, b: string): boolean {
  const keep = (text: string) => wordsOf(text).filter((w) => !PROPERTY_STOP_WORDS.has(w));
  return shareAWord(keep(a), keep(b));
}
