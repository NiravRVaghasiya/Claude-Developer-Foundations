"use client";

import { useState, type ReactNode } from "react";

/**
 * A collapsible "reveal answer" block used for scenario challenges and
 * quick-recall prompts. Renders a prompt/question up top and hides the
 * answer behind a toggle to support active recall.
 */
export function RevealAnswer({
  title,
  prompt,
  children,
}: {
  title?: string;
  prompt?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
      <div className="bg-neutral-50 p-4 dark:bg-neutral-900/50">
        {title ? (
          <p className="m-0 mb-1 text-sm font-semibold text-brand-fg dark:text-amber-400">
            {title}
          </p>
        ) : null}
        {prompt ? (
          <p className="m-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {prompt}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand-fg transition hover:bg-brand/20 dark:text-amber-300"
        >
          <span aria-hidden>{open ? "▾" : "▸"}</span>
          {open ? "Hide answer" : "Reveal answer"}
        </button>
      </div>
      {open ? (
        <div className="reveal-body border-t border-neutral-200 p-4 text-sm leading-relaxed dark:border-neutral-800 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default RevealAnswer;
