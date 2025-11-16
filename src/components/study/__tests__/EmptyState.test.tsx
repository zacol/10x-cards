import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("should render the 'no cards due' message", () => {
    render(<EmptyState />);

    expect(screen.getByText("No flashcards due for review")).toBeInTheDocument();
    expect(
      screen.getByText("Great job! You're all caught up. Come back later or add more flashcards.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Library" })).toBeInTheDocument();
  });
});
