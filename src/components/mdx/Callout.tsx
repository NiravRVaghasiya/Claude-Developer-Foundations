import type { ReactNode } from "react";

export type CalloutType = "trap" | "tip" | "pattern" | "note";

const STYLES: Record<
  CalloutType,
  { icon: string; label: string; className: string }
> = {
  trap: {
    icon: "⚠️",
    label: "Trap",
    className:
      "border-red-400/60 bg-red-50 dark:border-red-500/40 dark:bg-red-950/30",
  },
  tip: {
    icon: "💡",
    label: "Pro tip",
    className:
      "border-amber-400/60 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30",
  },
  pattern: {
    icon: "🔁",
    label: "Pattern",
    className:
      "border-blue-400/60 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-950/30",
  },
  note: {
    icon: "📌",
    label: "Note",
    className:
      "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50",
  },
};

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const style = STYLES[type] ?? STYLES.note;
  return (
    <div
      className={`my-5 rounded-lg border p-4 ${style.className}`}
      role="note"
    >
      <p className="m-0 mb-1 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden>{style.icon}</span>
        <span>{title ?? style.label}</span>
      </p>
      <div className="callout-body text-sm leading-relaxed [&>p]:my-1 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

export default Callout;
