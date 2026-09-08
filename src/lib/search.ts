import Fuse, { type IFuseOptions } from "fuse.js";

export interface SearchRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  domain: string;
  body: string;
}

export interface SearchHit {
  record: SearchRecord;
  snippet: string;
}

const FUSE_OPTIONS: IFuseOptions<SearchRecord> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 3 },
    { name: "summary", weight: 2 },
    { name: "body", weight: 1 },
  ],
};

export function createSearch(records: SearchRecord[]): Fuse<SearchRecord> {
  return new Fuse(records, FUSE_OPTIONS);
}

/**
 * Build a short context snippet around the first occurrence of the query in
 * the body. Falls back to the summary when there's no body match.
 */
export function makeSnippet(
  record: SearchRecord,
  query: string,
  radius = 60
): string {
  const q = query.trim().toLowerCase();
  const body = record.body ?? "";
  const idx = q ? body.toLowerCase().indexOf(q) : -1;
  if (idx === -1) {
    return record.summary || body.slice(0, radius * 2);
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(body.length, idx + q.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < body.length ? "…" : "";
  return prefix + body.slice(start, end).trim() + suffix;
}

/** Run a query and return hits with snippets (empty query → no hits). */
export function runSearch(
  fuse: Fuse<SearchRecord>,
  query: string,
  limit = 8
): SearchHit[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return fuse
    .search(trimmed, { limit })
    .map((r) => ({ record: r.item, snippet: makeSnippet(r.item, trimmed) }));
}
