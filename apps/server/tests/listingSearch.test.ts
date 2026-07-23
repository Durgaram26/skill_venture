import { describe, it, expect } from '@jest/globals';
import './setup.js';
import { expandSearchTerms, buildListingSearchFilter, institutionNamePattern, mergeListingAndInstitutionFilter } from '../src/utils/listingSearch.js';

describe('listingSearch', () => {
  it('splits webdev into web and dev', () => {
    expect(expandSearchTerms('webdev')).toEqual(['web', 'dev']);
  });

  it('keeps single-word queries', () => {
    expect(expandSearchTerms('react')).toEqual(['react']);
  });

  it('normalizes common typo: artifical', () => {
    expect(expandSearchTerms('artifical')).toEqual(['artificial']);
  });

  it('builds AND filter for shorthand queries', () => {
    const filter = buildListingSearchFilter('webdev');
    expect(filter).toHaveProperty('$and');
    expect((filter as { $and: unknown[] }).$and).toHaveLength(2);
  });

  it('builds OR filter for single terms', () => {
    const filter = buildListingSearchFilter('python');
    expect(filter).toHaveProperty('$or');
  });

  it('uses dedicated AI intent filter for ai query', () => {
    const filter = buildListingSearchFilter('ai') as { $or: Array<Record<string, RegExp>> };
    const regexes = filter.$or
      .map((entry) => Object.values(entry)[0])
      .filter((v): v is RegExp => v instanceof RegExp);

    expect(regexes.some((r) => r.source.includes('AI'))).toBe(true);
    expect(regexes.some((r) => r.source.includes('\\bai\\b'))).toBe(true);
    expect(regexes.some((r) => r.source.includes('learning'))).toBe(false);
  });

  it('uses word boundaries for short art query', () => {
    const filter = buildListingSearchFilter('art') as { $or: Array<Record<string, RegExp>> };
    const descriptionPattern = filter.$or.find((entry) => 'description' in entry)?.description as RegExp;
    expect(descriptionPattern.source).toContain('\\bart\\b');
  });

  it('art query should not match partner substring', () => {
    const filter = buildListingSearchFilter('art') as { $or: Array<Record<string, RegExp>> };
    const descriptionPattern = filter.$or.find((entry) => 'description' in entry)?.description as RegExp;
    expect(descriptionPattern.test('hiring-partner interviews')).toBe(false);
  });

  it('maps artificial intelligence phrase to AI category filter', () => {
    const filter = buildListingSearchFilter('artificial intelligence') as {
      $or: Array<Record<string, RegExp>>;
    };
    expect(filter.$or.some((entry) => entry.category?.source === '^AI$')).toBe(true);
  });

  it('matches institution names with nimbus-style queries', () => {
    const pattern = institutionNamePattern('nimbus');
    expect(pattern).not.toBeNull();
    expect(pattern!.test('Nimbus Skill Labs')).toBe(true);
    expect(pattern!.test('Unrelated Campus')).toBe(false);
  });

  it('merges listing text filter with institution ids', () => {
    const text = buildListingSearchFilter('react');
    const merged = mergeListingAndInstitutionFilter(text, ['abc123']);
    expect(merged).toHaveProperty('$or');
    const onlyInstitution = mergeListingAndInstitutionFilter(null, ['abc123']);
    expect(onlyInstitution).toEqual({ institutionId: { $in: ['abc123'] } });
  });
});
