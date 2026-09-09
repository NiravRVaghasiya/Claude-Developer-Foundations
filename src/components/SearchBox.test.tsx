import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBox } from "./SearchBox";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// Provide a small deterministic index for the component.
vi.mock("@content/search-index.json", () => ({
  default: [
    {
      id: "prompt-caching",
      slug: "prompt-caching",
      title: "Prompt Caching",
      summary: "Cache a stable prefix to cut cost.",
      domain: "Applications & Integration",
      body: "cache breakpoint on the last stable block reads at 0.1x.",
    },
    {
      id: "vision",
      slug: "vision",
      title: "Vision / Multimodal Inputs",
      summary: "Image blocks and visual tokens.",
      domain: "Applications & Integration",
      body: "Claude tiles images into 28x28 pixel patches.",
    },
  ],
}));

describe("SearchBox", () => {
  it("shows matching results as the user types", () => {
    render(<SearchBox />);
    const input = screen.getByLabelText(/search topics/i);
    fireEvent.change(input, { target: { value: "cache" } });
    expect(screen.getByText("Prompt Caching")).toBeInTheDocument();
  });

  it("shows a no-results message for unmatched queries", () => {
    render(<SearchBox />);
    const input = screen.getByLabelText(/search topics/i);
    fireEvent.change(input, { target: { value: "zzzznope" } });
    // "No matches" now appears both in the visible dropdown and the sr-only
    // live region; both are acceptable, so assert at least one is present.
    expect(screen.getAllByText(/no matches/i).length).toBeGreaterThan(0);
  });

  it("does not show a dropdown for a single character", () => {
    render(<SearchBox />);
    const input = screen.getByLabelText(/search topics/i);
    fireEvent.change(input, { target: { value: "c" } });
    expect(screen.queryByText("Prompt Caching")).not.toBeInTheDocument();
  });

  it("exposes combobox + listbox semantics", () => {
    render(<SearchBox />);
    const input = screen.getByRole("combobox", { name: /search topics/i });
    fireEvent.change(input, { target: { value: "cache" } });
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox", { name: /search results/i })).toBeInTheDocument();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("announces the result count via a live region", () => {
    render(<SearchBox />);
    const input = screen.getByLabelText(/search topics/i);
    fireEvent.change(input, { target: { value: "cache" } });
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/\d+ result/i);

    fireEvent.change(input, { target: { value: "zzzznope" } });
    expect(screen.getByRole("status").textContent).toMatch(/no matches/i);
  });
});
