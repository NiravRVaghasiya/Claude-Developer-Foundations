"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A small localStorage-backed state hook. SSR-safe: it initializes with the
 * provided default on the server and first client render, then hydrates from
 * localStorage in an effect to avoid hydration mismatches. Changes are
 * persisted and broadcast to other hook instances via a custom event.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage after mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed/unavailable storage */
    }
    setHydrated(true);
  }, [key]);

  // Cross-instance sync (same tab custom event + other-tab storage event).
  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail?.key !== key) return;
      try {
        const raw = window.localStorage.getItem(key);
        setValue(raw !== null ? (JSON.parse(raw) as T) : initialValue);
      } catch {
        /* ignore */
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        setValue(e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialValue);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("local-storage", onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("local-storage", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
          window.dispatchEvent(
            new CustomEvent("local-storage", { detail: { key } })
          );
        } catch {
          /* ignore write failures (e.g. private mode) */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue, hydrated];
}
