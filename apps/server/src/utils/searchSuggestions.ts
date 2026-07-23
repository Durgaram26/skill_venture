import { normalizeQuery } from './listingSearch.js';

const KEYWORD_PHRASES = [
  'artificial intelligence',
  'ai engineering',
  'machine learning',
  'data science',
  'web development',
  'full stack web development',
  'react',
  'product design',
  'cloud devops',
  'mobile app development',
  'java backend',
  'business analytics',
  'climate tech hackathon',
  'open source',
  'flutter',
  'bootcamp',
  'hackathon',
  'free courses',
  'hybrid programs',
  'online programs',
];

const CATEGORY_PHRASES = [
  'web development',
  'data science',
  'ai',
  'mobile',
  'design',
  'business',
  'cloud',
];

function scorePhrase(phrase: string, query: string): number {
  const lower = phrase.toLowerCase();
  if (lower.startsWith(query)) return 0;
  if (lower.split(/\s+/).some((word) => word.startsWith(query))) return 1;
  if (lower.includes(query)) return 2;
  return 99;
}

/** Udemy-style keyword autosuggest from curated phrases + categories. */
export function getKeywordSuggestions(query: string, limit = 8): string[] {
  const q = normalizeQuery(query);
  if (q.length < 1) return [];

  const boosted: string[] = [];
  if (q.startsWith('art') || q === 'art') boosted.push('artificial intelligence');
  if (q === 'ai' || q.startsWith('ai')) {
    boosted.push('artificial intelligence', 'ai engineering');
  }
  if (q.startsWith('web')) boosted.push('web development', 'full stack web development');
  if (q.startsWith('data')) boosted.push('data science');
  if (q.startsWith('des')) boosted.push('product design');

  const pool = [...new Set([...boosted, ...KEYWORD_PHRASES, ...CATEGORY_PHRASES])];
  const ranked = pool
    .map((phrase) => ({ phrase, score: scorePhrase(phrase, q) }))
    .filter((item) => item.score < 99)
    .sort((a, b) => a.score - b.score || a.phrase.localeCompare(b.phrase));

  return [...new Set(ranked.map((item) => item.phrase))].slice(0, limit);
}
