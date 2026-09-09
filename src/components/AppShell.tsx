"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sidebar, type SidebarProps } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBox } from "@/components/SearchBox";

/** Focusable elements within a container, for the drawer focus trap. */
function focusableWithin(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  return Array.from(
    el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
}

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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const closeDrawer = () => setOpen(false);

  // Focus management for the mobile drawer: focus in on open, trap Tab, close on
  // Escape, and restore focus to the toggle button on close.
  useEffect(() => {
    if (!open) return;

    const drawer = drawerRef.current;
    // Capture the trigger now so cleanup restores focus to the correct node
    // even if the ref changes later (react-hooks/exhaustive-deps).
    const trigger = toggleRef.current;
    const first = focusableWithin(drawer)[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = focusableWithin(drawerRef.current);
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to the trigger (captured above) when the drawer closes.
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-neutral-200 bg-white/60 backdrop-blur lg:block dark:border-neutral-800 dark:bg-neutral-950/60">
        <Sidebar groups={groups} />
      </aside>

      {/* Mobile drawer + backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
            aria-hidden
          />
          <div
            ref={drawerRef}
            className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <Sidebar groups={groups} onNavigate={closeDrawer} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col">
        {/* Top header (mobile shows hamburger + brand; all sizes show theme toggle) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <button
              ref={toggleRef}
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={open}
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

        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
