import type { FilterQuery } from 'mongoose';
import type { ListingDocument } from '../models/Listing.js';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\bartifical\b/g, 'artificial')
    .replace(/\bartifically\b/g, 'artificially');
}

/** Split glued shorthand (webdev → web dev) and multi-word queries into search terms. */
export function expandSearchTerms(query: string): string[] {
  const lower = normalizeQuery(query);
  if (!lower) return [];

  const expanded = lower
    .replace(/(web)(dev)/g, '$1 $2')
    .replace(/(full)(stack)/g, '$1 $2')
    .replace(/(data)(science)/g, '$1 $2')
    .replace(/(machine)(learning)/g, '$1 $2')
    .replace(/(ui)(ux)/g, '$1 $2')
    .replace(/(cloud)(devops)/g, '$1 $2')
    .replace(/(mobile)(app)/g, '$1 $2');

  const terms = expanded.split(/\s+/).filter((t) => t.length >= 2);
  return terms.length > 0 ? [...new Set(terms)] : [lower];
}

/** Exact category shortcuts for common topic searches. */
const CATEGORY_SHORTCUTS: Record<string, string> = {
  ai: 'AI',
  art: 'Design',
  design: 'Design',
};

function wordPattern(term: string): RegExp {
  const escaped = escapeRegex(term);
  if (term === 'dev') return /\bdev(?:elop(?:ment)?|ops)?\b/i;
  if (term.length <= 3) return new RegExp(`\\b${escaped}\\b`, 'i');
  return new RegExp(`\\b${escaped}`, 'i');
}

function fieldClausesForTerm(term: string): FilterQuery<ListingDocument>[] {
  const pattern = wordPattern(term);
  const clauses: FilterQuery<ListingDocument>[] = [
    { title: pattern },
    { description: pattern },
    { category: pattern },
    { slug: pattern },
  ];

  const category = CATEGORY_SHORTCUTS[term];
  if (category) {
    clauses.unshift({ category: new RegExp(`^${escapeRegex(category)}$`, 'i') });
  }

  return clauses;
}

/** Dedicated AI intent — avoids matching Hyderabad, partner, etc. */
function buildAiIntentFilter(): FilterQuery<ListingDocument> {
  return {
    $or: [
      { category: /^AI$/i },
      { title: /\bai\b/i },
      { description: /\bai\b/i },
      { slug: /\bai\b/i },
    ],
  };
}

function buildArtificialIntentFilter(): FilterQuery<ListingDocument> {
  return {
    $or: [
      { category: /^AI$/i },
      { title: /\b(artificial intelligence|artificial|ai engineering|\bai\b)\b/i },
      { description: /\b(artificial intelligence|artificial|ai engineering|\bai\b)\b/i },
      { slug: /\b(artificial|ai-engineering|ai)\b/i },
    ],
  };
}

function isAiShortQuery(normalized: string): boolean {
  return normalized === 'ai';
}

function isArtificialIntelligenceQuery(normalized: string): boolean {
  if (normalized === 'artificial' || normalized === 'artifical') return true;
  if (normalized.includes('artificial intelligence')) return true;
  if (normalized.includes('ai engineering')) return true;
  const terms = normalized.split(/\s+/).filter(Boolean);
  return terms.includes('artificial') && terms.includes('intelligence');
}

/** Flexible listing search — shorthand + typo friendly, without noisy substring hits. */
export function buildListingSearchFilter(query: string): FilterQuery<ListingDocument> | null {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  if (isAiShortQuery(normalized)) return buildAiIntentFilter();
  if (isArtificialIntelligenceQuery(normalized)) return buildArtificialIntentFilter();

  const terms = expandSearchTerms(normalized);
  if (terms.length === 0) return null;

  if (terms.length === 1) {
    return { $or: fieldClausesForTerm(terms[0]) };
  }

  return {
    $and: terms.map((term) => ({ $or: fieldClausesForTerm(term) })),
  };
}

/** Match institution names like "Nimbus Skill Labs" for query "nimbus". */
export function institutionNamePattern(query: string): RegExp | null {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 2) return null;
  const escaped = escapeRegex(normalized);
  if (normalized.length <= 3) return new RegExp(`\\b${escaped}\\b`, 'i');
  return new RegExp(escaped, 'i');
}

/** Combine listing text match with institution-id hits (partner name search). */
export function mergeListingAndInstitutionFilter(
  textFilter: FilterQuery<ListingDocument> | null,
  institutionIds: unknown[],
): FilterQuery<ListingDocument> | null {
  const hasInstitutions = institutionIds.length > 0;
  if (!textFilter && !hasInstitutions) return null;
  if (!hasInstitutions) return textFilter;
  const byInstitution: FilterQuery<ListingDocument> = {
    institutionId: { $in: institutionIds },
  };
  if (!textFilter) return byInstitution;
  return { $or: [textFilter, byInstitution] };
}
