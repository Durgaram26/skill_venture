import { describe, it, expect } from '@jest/globals';
import './setup.js';
import { getKeywordSuggestions } from '../src/utils/searchSuggestions.js';

describe('searchSuggestions', () => {
  it('suggests artificial intelligence when typing art', () => {
    const suggestions = getKeywordSuggestions('art');
    expect(suggestions[0]).toBe('artificial intelligence');
  });

  it('suggests ai phrases when typing ai', () => {
    const suggestions = getKeywordSuggestions('ai');
    expect(suggestions).toContain('artificial intelligence');
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
