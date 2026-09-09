import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "./AppShell";
import type { SidebarProps } from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// SearchBox imports the generated search index; provide a stub.
vi.mock("@content/search-index.json", () => ({ default: [] }));

const groups: SidebarProps["groups"] = [
  {
    domain: "Applications & Integration",
    topics: [
      {
        id: "t1",
        slug: "t1",
        title: "Topic One",
        summary: "",
        domain: "Applications & Integration",
        file: "t1.mdx",
        source: "CCDV-F Study Notes.md",
        order: 1,
      },
    ],
  },
];

function renderShell() {
  return render(
    <AppShell groups={groups}>
      <p>Body content</p>
    </AppShell>
  );
}

describe("AppShell — main landmark", () => {
  it("exposes a focusable main landmark with id for skip navigation", () => {
    renderShell();
    const main = document.getElementById("main");
    expect(main).not.toBeNull();
    expect(main?.tagName.toLowerCase()).toBe("main");
    expect(main?.getAttribute("tabindex")).toBe("-1");
  });
});

describe("AppShell — mobile drawer accessibility", () => {
  beforeEach(() => {
    // jsdom has no layout; the drawer logic is independent of viewport.
  });

  it("opens the drawer as a modal dialog and moves focus inside", () => {
    renderShell();
    const toggle = screen.getByRole("button", { name: /open navigation menu/i });
    fireEvent.click(toggle);

    const dialog = screen.getByRole("dialog", { name: /navigation menu/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    // Focus moved into the drawer (not left on the toggle).
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and restores focus to the toggle", () => {
    renderShell();
    const toggle = screen.getByRole("button", { name: /open navigation menu/i });
    fireEvent.click(toggle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(toggle);
  });

  it("sets aria-expanded on the toggle", () => {
    renderShell();
    const toggle = screen.getByRole("button", { name: /open navigation menu/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });
});
