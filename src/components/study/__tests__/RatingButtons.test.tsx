import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RatingButtons } from "../RatingButtons";

describe("RatingButtons", () => {
  const onRateMock = vi.fn();

  beforeEach(() => {
    onRateMock.mockClear();
  });

  it("should render all three rating buttons", () => {
    render(<RatingButtons onRate={onRateMock} />);
    expect(screen.getByRole("button", { name: "Don't know" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I know" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Very easy" })).toBeInTheDocument();
  });

  it("should call onRate with 'again' when 'Don't know' is clicked", () => {
    render(<RatingButtons onRate={onRateMock} />);
    fireEvent.click(screen.getByRole("button", { name: "Don't know" }));
    expect(onRateMock).toHaveBeenCalledWith("again");
  });

  it("should call onRate with 'good' when 'I know' is clicked", () => {
    render(<RatingButtons onRate={onRateMock} />);
    fireEvent.click(screen.getByRole("button", { name: "I know" }));
    expect(onRateMock).toHaveBeenCalledWith("good");
  });

  it("should call onRate with 'easy' when 'Very easy' is clicked", () => {
    render(<RatingButtons onRate={onRateMock} />);
    fireEvent.click(screen.getByRole("button", { name: "Very easy" }));
    expect(onRateMock).toHaveBeenCalledWith("easy");
  });

  it("should disable all buttons when disabled prop is true", () => {
    render(<RatingButtons onRate={onRateMock} disabled={true} />);
    expect(screen.getByRole("button", { name: "Don't know" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "I know" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Very easy" })).toBeDisabled();
  });
});
