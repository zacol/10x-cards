import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SessionSummary } from "../SessionSummary";
import type { SessionStats } from "@/types";

const mockStats: SessionStats = {
  total: 20,
  reviewed: 15,
  again: 2,
  good: 10,
  easy: 3,
};

describe("SessionSummary", () => {
  const onBackToLibraryMock = vi.fn();

  it("should render the summary title and description", () => {
    render(<SessionSummary stats={mockStats} onBackToLibrary={onBackToLibraryMock} />);
    expect(screen.getByText("Session Complete!")).toBeInTheDocument();
    expect(screen.getByText("Great job! Here's how you did:")).toBeInTheDocument();
  });

  it("should display all session statistics correctly", () => {
    render(<SessionSummary stats={mockStats} onBackToLibrary={onBackToLibraryMock} />);
    expect(screen.getByText("Total reviewed:").nextSibling?.textContent).toBe("15");
    expect(screen.getByText("Don't know:").nextSibling?.textContent).toBe("2");
    expect(screen.getByText("I know:").nextSibling?.textContent).toBe("10");
    expect(screen.getByText("Very easy:").nextSibling?.textContent).toBe("3");
  });

  it("should render the 'Back to Library' button and call onBackToLibrary on click", () => {
    render(<SessionSummary stats={mockStats} onBackToLibrary={onBackToLibraryMock} />);
    const backButton = screen.getByRole("button", { name: "Back to Library" });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(onBackToLibraryMock).toHaveBeenCalledTimes(1);
  });
});
