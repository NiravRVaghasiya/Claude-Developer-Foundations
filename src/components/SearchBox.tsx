"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  createSearch,
  runSearch,
  type SearchRecord,
  type SearchHit,
} from "@/lib/search";
import searchIndex from "@content/search-index.json";

export function SearchBox() {
  const records = searchIndex as SearchRecord[];
  const fuse = useMemo(() => createSearch(records), [records]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hits: SearchHit[] = useMemo(
    () => runSearch(fuse, query),
    [fuse, query]
  );

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const showResults = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search topics…"
        aria-label="Search topics"
        className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand/60 dark:border-neutral-700"
      />

      {showResults ? (
        <div className="absolute left-0 right-0 z-40 mt-1 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          {hits.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul>
              {hits.map((hit) => (
                <li key={hit.record.id}>
                  <Link
                    href={`/topics/${hit.record.slug}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="block border-b border-neutral-100 p-3 transition last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
                  >
                    <span className="block text-sm font-medium text-brand-fg dark:text-amber-400">
                      {hit.record.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {hit.snippet}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
