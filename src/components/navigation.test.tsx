import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import type { Topic } from "@/lib/content-types";

// --- mocks ---
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

let mockTheme = "light";
const setThemeMock = vi.fn((t: string) => {
  mockTheme = t;
});
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mockTheme, setTheme: setThemeMock }),
}));

// next/link renders a plain anchor in tests
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const groups: { domain: any; topics: Topic[] }[] = [
  {
    domain: "Applications & Integration",
    topics: [
      {
        id: "messages-api",
        slug: "messages-api",
        title: "Messages API Mastery",
        summary: "s",
        domain: "Applications & Integration",
        file: "01-messages-api.mdx",
        source: "CCDV-F Study Notes.md",
        order: 1,
      },
    ],
  },
];

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("renders primary links and topic groups", () => {
    render(<Sidebar groups={groups} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("All Topics")).toBeInTheDocument();
    expect(screen.getByText("Flashcards")).toBeInTheDocument();
    expect(screen.getByText("Practice Quiz")).toBeInTheDocument();
    expect(screen.getByText("Applications & Integration")).toBeInTheDocument();
    expect(screen.getByText("Messages API Mastery")).toBeInTheDocument();
  });

  it("marks the active link with aria-current", () => {
    mockPathname = "/topics/messages-api";
    render(<Sidebar groups={groups} />);
    const active = screen.getByText("Messages API Mastery").closest("a");
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("calls onNavigate when a link is clicked", () => {
    const onNavigate = vi.fn();
    render(<Sidebar groups={groups} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("All Topics"));
    expect(onNavigate).toHaveBeenCalled();
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockTheme = "light";
    setThemeMock.mockClear();
  });

  it("toggles from light to dark", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to dark mode/i });
    fireEvent.click(btn);
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
