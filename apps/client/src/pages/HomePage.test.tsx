import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

vi.mock('../lib/api', () => ({
  api: {
    listListings: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 }),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the SkillVentures brand and search CTA', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Ventures/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/What skill are you building/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Search/i })).toBeTruthy();
    expect(screen.getByText(/Teach on SkillVentures/i)).toBeTruthy();
  });
});
