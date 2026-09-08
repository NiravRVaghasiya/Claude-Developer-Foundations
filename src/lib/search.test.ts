import { describe, it, expect } from "vitest";
import { createSearch, runSearch, makeSnippet, type SearchRecord } from "./search";

const records: SearchRecord[] = [
  {
    id: "prompt-caching",
    slug: "prompt-caching",
    title: "Prompt Caching",
    summary: "Cache a stable prefix to cut cost.",
    domain: "Applications & Integration",
    body: "The cache key is a cumulative hash of everything up to and including the cache_control block, so a cache breakpoint on a stable prefix reads at 0.1x.",
  },
  {
    id: "streaming",
    slug: "streaming",
    title: "Streaming",
    summary: "Server-Sent Events and delta accumulation.",
    domain: "Applications & Integration",
    body: "Streaming sends the response incrementally as SSE; accumulate content_block_delta chunks.",
  },
];

describe("runSearch", () => {
  const fuse = createSearch(records);

  it("finds the prompt-caching topic for 'cache breakpoint'", () => {
    const hits = runSearch(fuse, "cache breakpoint");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].record.id).toBe("prompt-caching");
  });

  it("matches on title", () => {
    const hits = runSearch(fuse, "streaming");
    expect(hits[0].record.id).toBe("streaming");
  });

  it("returns nothing for a too-short query", () => {
    expect(runSearch(fuse, "a")).toEqual([]);
    expect(runSearch(fuse, "")).toEqual([]);
  });
});

describe("makeSnippet", () => {
  it("returns context around a body match", () => {
    const snip = makeSnippet(records[0], "cache_control");
    expect(snip).toContain("cache_control");
  });

  it("falls back to summary when no body match", () => {
    const snip = makeSnippet(records[0], "zzz-not-present");
    expect(snip).toBe(records[0].summary);
  });
});
