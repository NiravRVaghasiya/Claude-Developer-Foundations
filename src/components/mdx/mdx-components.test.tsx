import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Callout } from "./Callout";
import { RevealAnswer } from "./RevealAnswer";

describe("Callout", () => {
  it("renders a trap callout with icon and default label", () => {
    render(<Callout type="trap">Body text here</Callout>);
    expect(screen.getByText("Trap")).toBeInTheDocument();
    expect(screen.getByText("Body text here")).toBeInTheDocument();
  });

  it("uses a custom title when provided", () => {
    render(
      <Callout type="tip" title="Watch out">
        content
      </Callout>
    );
    expect(screen.getByText("Watch out")).toBeInTheDocument();
  });
});

describe("RevealAnswer", () => {
  it("hides the answer until toggled", () => {
    render(
      <RevealAnswer title="Scenario 1" prompt="What happens?">
        The hidden answer.
      </RevealAnswer>
    );
    expect(screen.getByText("Scenario 1")).toBeInTheDocument();
    expect(screen.getByText("What happens?")).toBeInTheDocument();
    // answer hidden initially
    expect(screen.queryByText("The hidden answer.")).not.toBeInTheDocument();

    // reveal
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText("The hidden answer.")).toBeInTheDocument();

    // hide again
    fireEvent.click(screen.getByRole("button", { name: /hide answer/i }));
    expect(screen.queryByText("The hidden answer.")).not.toBeInTheDocument();
  });
});
