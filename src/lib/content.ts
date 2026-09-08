import { topics } from "@content/topics.index";
import type { Topic, TopicDomain } from "@/lib/content-types";

/** All topics, sorted by their declared display order. */
export function getAllTopics(): Topic[] {
  return [...topics].sort((a, b) => a.order - b.order);
}

/** Look up a topic by slug (or id). Returns undefined if not found. */
export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug || t.id === slug);
}

/** Look up a topic by id. */
export function getTopicById(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

/** Every slug, for static path generation. */
export function getAllTopicSlugs(): string[] {
  return getAllTopics().map((t) => t.slug);
}

/** The previous/next topic relative to a slug, for in-page navigation. */
export function getAdjacentTopics(slug: string): {
  prev?: Topic;
  next?: Topic;
} {
  const ordered = getAllTopics();
  const idx = ordered.findIndex((t) => t.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? ordered[idx - 1] : undefined,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : undefined,
  };
}

/** Topics grouped by domain, preserving order within each group. */
export function getTopicsByDomain(): Array<{
  domain: TopicDomain;
  topics: Topic[];
}> {
  const ordered = getAllTopics();
  const groups = new Map<TopicDomain, Topic[]>();
  for (const t of ordered) {
    const list = groups.get(t.domain) ?? [];
    list.push(t);
    groups.set(t.domain, list);
  }
  return Array.from(groups.entries()).map(([domain, list]) => ({
    domain,
    topics: list,
  }));
}
