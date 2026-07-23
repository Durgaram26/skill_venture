export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function uniqueSlug(base: string, suffix?: string): string {
  const root = slugify(base) || 'listing';
  const stamp = suffix ?? Date.now().toString(36);
  return `${root}-${stamp}`;
}

export function parsePagination(query: { page?: number; limit?: number }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 12));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
