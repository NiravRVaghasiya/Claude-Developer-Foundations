"use client";

import { useEffect } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Invisible tracker: records that a topic has been viewed (once) in
 * localStorage so the progress dashboard can report reading coverage.
 */
export function TopicViewTracker({ topicId }: { topicId: string }) {
  const [viewed, setViewed, hydrated] = useLocalStorage<string[]>(
    STORAGE_KEYS.viewedTopics,
    []
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!viewed.includes(topicId)) {
      setViewed((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
    }
  }, [hydrated, topicId, viewed, setViewed]);

  return null;
}
