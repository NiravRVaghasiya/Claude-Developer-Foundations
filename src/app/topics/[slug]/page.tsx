import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllTopicSlugs,
  getTopicBySlug,
  getAdjacentTopics,
} from "@/lib/content";
import { TopicViewTracker } from "@/components/TopicViewTracker";

export function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return { title: "Topic not found — CCDV-F Study" };
  return {
    title: `${topic.title} — CCDV-F Study`,
    description: topic.summary,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  // Dynamically import the topic's MDX by filename (without extension).
  const mod = await import(
    `@content/topics/${topic.file.replace(/\.mdx$/, "")}.mdx`
  ).catch(() => null);

  if (!mod) notFound();
  const MDXContent = mod.default;

  const { prev, next } = getAdjacentTopics(slug);

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <TopicViewTracker topicId={topic.id} />

      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-fg dark:text-amber-400">
          {topic.domain}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {topic.title}
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {topic.summary}
        </p>
      </header>

      <div className="mdx-content">
        <MDXContent />
      </div>

      <nav className="mt-12 flex items-stretch justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        {prev ? (
          <Link
            href={`/topics/${prev.slug}`}
            className="group flex flex-1 flex-col rounded-lg border border-neutral-200 p-4 transition hover:border-brand/50 dark:border-neutral-800"
          >
            <span className="text-xs text-neutral-500">← Previous</span>
            <span className="font-medium group-hover:text-brand-fg dark:group-hover:text-amber-400">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/topics/${next.slug}`}
            className="group flex flex-1 flex-col rounded-lg border border-neutral-200 p-4 text-right transition hover:border-brand/50 dark:border-neutral-800"
          >
            <span className="text-xs text-neutral-500">Next →</span>
            <span className="font-medium group-hover:text-brand-fg dark:group-hover:text-amber-400">
              {next.title}
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </article>
  );
}
