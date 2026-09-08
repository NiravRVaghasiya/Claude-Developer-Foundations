import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "@/components/mdx/Callout";
import { RevealAnswer } from "@/components/mdx/RevealAnswer";

/**
 * Global MDX component map. Styles the base HTML elements the MDX compiler
 * emits (headings, tables, lists, links) and registers custom study
 * components (Callout, RevealAnswer) so topic .mdx files can use them.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props: ComponentPropsWithoutRef<"h2">) => (
      <h2
        className="mt-10 scroll-mt-24 border-b border-neutral-200 pb-2 text-2xl font-bold tracking-tight dark:border-neutral-800"
        {...props}
      />
    ),
    h3: (props: ComponentPropsWithoutRef<"h3">) => (
      <h3
        className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight"
        {...props}
      />
    ),
    h4: (props: ComponentPropsWithoutRef<"h4">) => (
      <h4 className="mt-6 scroll-mt-24 text-lg font-semibold" {...props} />
    ),
    p: (props: ComponentPropsWithoutRef<"p">) => (
      <p className="my-4 leading-7 text-neutral-800 dark:text-neutral-200" {...props} />
    ),
    ul: (props: ComponentPropsWithoutRef<"ul">) => (
      <ul className="my-4 list-disc space-y-1.5 pl-6 leading-7" {...props} />
    ),
    ol: (props: ComponentPropsWithoutRef<"ol">) => (
      <ol className="my-4 list-decimal space-y-1.5 pl-6 leading-7" {...props} />
    ),
    li: (props: ComponentPropsWithoutRef<"li">) => (
      <li className="text-neutral-800 dark:text-neutral-200" {...props} />
    ),
    a: (props: ComponentPropsWithoutRef<"a">) => (
      <a
        className="font-medium text-brand-fg underline underline-offset-2 hover:text-brand dark:text-amber-400"
        {...props}
      />
    ),
    strong: (props: ComponentPropsWithoutRef<"strong">) => (
      <strong className="font-semibold text-neutral-900 dark:text-white" {...props} />
    ),
    blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
      <blockquote
        className="my-5 border-l-4 border-brand/50 bg-neutral-50 py-2 pl-4 pr-2 italic text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300"
        {...props}
      />
    ),
    table: (props: ComponentPropsWithoutRef<"table">) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    thead: (props: ComponentPropsWithoutRef<"thead">) => (
      <thead className="bg-neutral-100 dark:bg-neutral-900" {...props} />
    ),
    th: (props: ComponentPropsWithoutRef<"th">) => (
      <th
        className="border-b border-neutral-200 px-3 py-2 text-left font-semibold dark:border-neutral-800"
        {...props}
      />
    ),
    td: (props: ComponentPropsWithoutRef<"td">) => (
      <td
        className="border-b border-neutral-100 px-3 py-2 align-top dark:border-neutral-900"
        {...props}
      />
    ),
    hr: () => <hr className="my-8 border-neutral-200 dark:border-neutral-800" />,
    Callout,
    RevealAnswer,
    ...components,
  };
}
