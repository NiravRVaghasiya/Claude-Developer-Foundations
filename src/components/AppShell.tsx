"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, type SidebarProps } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBox } from "@/components/SearchBox";

/**
 * Responsive application shell:
 * - Desktop (lg+): a persistent left sidebar + content column.
 * - Mobile: a top header with a hamburger that opens the sidebar as a drawer.
 */
export function AppShell({
  groups,
  children,
}: {
  groups: SidebarProps["groups"];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-neutral-200 bg-white/60 backdrop-blur lg:block dark:border-neutral-800 dark:bg-neutral-950/60">
        <Sidebar groups={groups} />
      </aside>

      {/* Mobile drawer + backdrop */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
            <Sidebar groups={groups} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col">
        {/* Top header (mobile shows hamburger + brand; all sizes show theme toggle) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 lg:hidden dark:border-neutral-700"
            >
              ☰
            </button>
            <span className="font-semibold lg:hidden">CCDV-F Study</span>
          </div>
          <div className="flex items-center gap-3">
            <SearchBox />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
