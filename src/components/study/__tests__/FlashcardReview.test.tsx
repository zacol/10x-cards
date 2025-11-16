import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FlashcardReview } from "../FlashcardReview";
import type { FlashcardDueDto } from "@/types";

const mockFlashcard: FlashcardDueDto = {
  id: "1",
  front: "What is the capital of Poland?",
  back: "Warsaw",
  repetition: 0,
  interval: 0,
  efactor: 2.5,
  due_date: new Date().toISOString(),
};

describe("FlashcardReview", () => {
  const onShowAnswerMock = vi.fn();
  const onRateMock = vi.fn();

  it("should render the question and the 'Show answer' button", () => {
    render(
      <FlashcardReview
        flashcard={mockFlashcard}
        isAnswerVisible={false}
        onShowAnswer={onShowAnswerMock}
        onRate={onRateMock}
      />
    );

    expect(screen.getByText("What is the capital of Poland?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument();
    expect(screen.queryByText("Warsaw")).not.toBeInTheDocument();
  });

  it("should call onShowAnswer when 'Show answer' is clicked", () => {
    render(
      <FlashcardReview
        flashcard={mockFlashcard}
        isAnswerVisible={false}
        onShowAnswer={onShowAnswerMock}
        onRate={onRateMock}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
    expect(onShowAnswerMock).toHaveBeenCalledTimes(1);
  });

  it("should render the answer and rating buttons when the answer is visible", () => {
    render(
      <FlashcardReview
        flashcard={mockFlashcard}
        isAnswerVisible={true}
        onShowAnswer={onShowAnswerMock}
        onRate={onRateMock}
      />
    );

    expect(screen.getByText("Warsaw")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Don't know" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I know" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Very easy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show answer" })).not.toBeInTheDocument();
  });

  it("should call onRate with 'good' when 'I know' button is clicked", () => {
    render(
      <FlashcardReview
        flashcard={mockFlashcard}
        isAnswerVisible={true}
        onShowAnswer={onShowAnswerMock}
        onRate={onRateMock}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "I know" }));
    expect(onRateMock).toHaveBeenCalledWith("good");
  });
});
