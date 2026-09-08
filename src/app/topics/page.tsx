import Link from "next/link";
import type { Metadata } from "next";
import { getTopicsByDomain } from "@/lib/content";

export const metadata: Metadata = {
  title: "All Topics — CCDV-F Study",
  description:
    "Browse every CCDV-F study topic, grouped by exam domain.",
};

export default function TopicsIndexPage() {
  const groups = getTopicsByDomain();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Topics</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Every study topic, grouped by exam domain. Work top to bottom, or jump
          to whatever needs the most drilling.
        </p>
      </header>

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.domain}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-fg dark:text-amber-400">
              {group.domain}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {group.topics.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/topics/${t.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-neutral-200 p-4 transition hover:border-brand/50 hover:shadow-sm dark:border-neutral-800"
                  >
                    <span className="font-semibold group-hover:text-brand-fg dark:group-hover:text-amber-400">
                      {t.title}
                    </span>
                    <span className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {t.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
