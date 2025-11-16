import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { StudySession } from "../StudySession";
import { useStudySession } from "@/components/hooks/useStudySession";
import type { FlashcardDueDto, SessionStats } from "@/types";

// Mock the custom hook
vi.mock("@/components/hooks/useStudySession");

const mockedUseStudySession = useStudySession as Mock;

const mockFlashcard: FlashcardDueDto = {
  id: "1",
  front: "Front of the card",
  back: "Back of the card",
  repetition: 0,
  interval: 0,
  efactor: 2.5,
  due_date: new Date().toISOString(),
};

describe("StudySession", () => {
  const mockExitSession = vi.fn();
  const mockRetryFetch = vi.fn();
  const mockShowAnswer = vi.fn();
  const mockSubmitRating = vi.fn();

  const baseMock = {
    currentFlashcard: null,
    isAnswerVisible: false,
    sessionStats: { total: 0, reviewed: 0, again: 0, good: 0, easy: 0 },
    status: "loading",
    error: null,
    showAnswer: mockShowAnswer,
    submitRating: mockSubmitRating,
    exitSession: mockExitSession,
    retryFetch: mockRetryFetch,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseStudySession.mockReturnValue(baseMock);
  });

  it("should render loading state correctly", () => {
    mockedUseStudySession.mockReturnValue({ ...baseMock, status: "loading" });
    render(<StudySession />);
    expect(screen.getByText("Loading flashcards...")).toBeInTheDocument();
    // The loader icon is decorative, so we can check for its presence via a test-id if we add one, or just trust the text is enough.
    // For now, let's assume the text is sufficient to confirm the loading state.
  });

  it("should render error state correctly and handle retries", () => {
    mockedUseStudySession.mockReturnValue({
      ...baseMock,
      status: "error",
      error: "Failed to fetch",
    });
    render(<StudySession />);
    expect(screen.getByText("Error loading flashcards")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockRetryFetch).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back to Library" }));
    expect(mockExitSession).toHaveBeenCalled();
  });

  it("should render empty state if session is completed with no cards", () => {
    mockedUseStudySession.mockReturnValue({
      ...baseMock,
      status: "completed",
      sessionStats: { total: 0, reviewed: 0, again: 0, good: 0, easy: 0 },
    });
    render(<StudySession />);
    expect(screen.getByText("No flashcards due for review")).toBeInTheDocument();
  });

  it("should render session summary if session is completed with cards", () => {
    const stats: SessionStats = { total: 10, reviewed: 10, again: 1, good: 8, easy: 1 };
    mockedUseStudySession.mockReturnValue({
      ...baseMock,
      status: "completed",
      sessionStats: stats,
    });
    render(<StudySession />);
    expect(screen.getByText("Session Complete!")).toBeInTheDocument();
    const reviewedStat = screen.getByText("Total reviewed:").closest("div");
    expect(reviewedStat).not.toBeNull();
    if (reviewedStat) {
      expect(within(reviewedStat).getByText(stats.reviewed)).toBeInTheDocument();
    }
  });

  it("should render active session correctly", () => {
    const stats: SessionStats = { total: 10, reviewed: 5, again: 1, good: 4, easy: 0 };
    mockedUseStudySession.mockReturnValue({
      ...baseMock,
      status: "active",
      currentFlashcard: mockFlashcard,
      sessionStats: stats,
    });
    render(<StudySession />);
    expect(screen.getByText("5 / 10")).toBeInTheDocument();
    expect(screen.getByText("Front of the card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument();
  });

  it("should open exit modal on exit click if session has started", () => {
    mockedUseStudySession.mockReturnValue({
      ...baseMock,
      status: "active",
      currentFlashcard: mockFlashcard,
      sessionStats: { total: 10, reviewed: 1, again: 1, good: 0, easy: 0 },
    });
    render(<StudySession />);
    fireEvent.click(screen.getByRole("button", { name: "Exit study session" }));
    expect(screen.getByText("Exit session?")).toBeInTheDocument();
    // Confirm exit
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(mockExitSession).toHaveBeenCalled();
  });

  it("should exit directly if session has not started", () => {
    mockedUseStudySession.mockReturnValue({
      ...baseMock,
      status: "active",
      currentFlashcard: mockFlashcard,
      sessionStats: { total: 10, reviewed: 0, again: 0, good: 0, easy: 0 },
    });
    render(<StudySession />);
    fireEvent.click(screen.getByRole("button", { name: "Exit study session" }));
    expect(screen.queryByText("Exit session?")).not.toBeInTheDocument();
    expect(mockExitSession).toHaveBeenCalled();
  });
});
