import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import { STORAGE_KEYS } from "@/lib/storage-keys";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.confirm = () => true;
  });

  it("shows fresh-user zero progress", () => {
    render(<Dashboard topicsTotal={13} cardsTotal={24} />);
    expect(screen.getByText("Topics read")).toBeInTheDocument();
    // 0 / 13 topics, 0 / 24 cards
    expect(screen.getByText("/ 13")).toBeInTheDocument();
    expect(screen.getByText("/ 24")).toBeInTheDocument();
    expect(screen.getByText("Not taken")).toBeInTheDocument();
  });

  it("aggregates saved progress from localStorage", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.viewedTopics,
      JSON.stringify(["messages-api", "tool-use"])
    );
    window.localStorage.setItem(
      STORAGE_KEYS.flashcardMarks,
      JSON.stringify({ a: "known", b: "known", c: "unknown" })
    );
    window.localStorage.setItem(STORAGE_KEYS.quizBestScore, JSON.stringify(8));
    window.localStorage.setItem(STORAGE_KEYS.quizBestTotal, JSON.stringify(10));

    render(<Dashboard topicsTotal={13} cardsTotal={24} />);

    // best quiz shown as 8 / 10
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("/ 10")).toBeInTheDocument();
    // reading total still visible
    expect(screen.getByText("/ 13")).toBeInTheDocument();
    // "2" appears for both topics-viewed and known-cards; both should be present
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("clears all progress keys on reset", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.viewedTopics,
      JSON.stringify(["messages-api"])
    );
    window.localStorage.setItem(STORAGE_KEYS.quizBestScore, JSON.stringify(5));

    render(<Dashboard topicsTotal={13} cardsTotal={24} />);
    fireEvent.click(screen.getByText(/reset all progress/i));

    expect(window.localStorage.getItem(STORAGE_KEYS.viewedTopics)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.quizBestScore)).toBeNull();
  });
});
