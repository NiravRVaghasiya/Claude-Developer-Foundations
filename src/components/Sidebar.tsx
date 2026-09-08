"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Topic, TopicDomain } from "@/lib/content-types";

export interface SidebarProps {
  groups: Array<{ domain: TopicDomain; topics: Topic[] }>;
  /** Called when a link is clicked (used to close the mobile drawer). */
  onNavigate?: () => void;
}

const PRIMARY_LINKS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/topics", label: "All Topics", icon: "📚" },
  { href: "/flashcards", label: "Flashcards", icon: "🃏" },
  { href: "/quiz", label: "Practice Quiz", icon: "📝" },
];

export function Sidebar({ groups, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-6 p-4">
      <div>
        <Link
          href="/"
          onClick={onNavigate}
          className="block text-lg font-bold tracking-tight text-brand-fg dark:text-amber-400"
        >
          CCDV-F Study
        </Link>
        <p className="mt-0.5 text-xs text-neutral-500">
          Claude Certified Developer: Foundations
        </p>
      </div>

      <ul className="space-y-1">
        {PRIMARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? "bg-brand/15 text-brand-fg dark:text-amber-300"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <span aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Topics
        </p>
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.domain}>
              <p className="px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {group.domain}
              </p>
              <ul className="mt-1 space-y-0.5">
                {group.topics.map((t) => {
                  const href = `/topics/${t.slug}`;
                  return (
                    <li key={t.id}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive(href) ? "page" : undefined}
                        className={`block rounded-md px-3 py-1.5 text-sm transition ${
                          isActive(href)
                            ? "bg-brand/15 font-medium text-brand-fg dark:text-amber-300"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {t.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
