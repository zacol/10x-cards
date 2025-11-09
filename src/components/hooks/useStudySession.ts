import { useState, useEffect, useCallback } from "react";
import type { StudySessionState, SessionStats, FlashcardDueDto, ReviewRating, GetDueFlashcardsResponse } from "@/types";

interface UseStudySessionReturn {
  // State
  flashcards: FlashcardDueDto[];
  currentFlashcard: FlashcardDueDto | null;
  currentIndex: number;
  isAnswerVisible: boolean;
  sessionStats: SessionStats;
  status: "loading" | "active" | "completed" | "error";
  error: string | null;

  // Actions
  showAnswer: () => void;
  submitRating: (rating: ReviewRating) => Promise<void>;
  exitSession: () => void;
  retryFetch: () => void;
}

const INITIAL_STATS: SessionStats = {
  total: 0,
  reviewed: 0,
  again: 0,
  good: 0,
  easy: 0,
};

export function useStudySession(): UseStudySessionReturn {
  const [state, setState] = useState<StudySessionState>({
    flashcards: [],
    currentIndex: 0,
    isAnswerVisible: false,
    sessionStats: INITIAL_STATS,
    status: "loading",
    error: null,
  });

  // Fetch flashcards for study
  const fetchFlashcards = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    try {
      const response = await fetch("/api/flashcards/due?limit=100");

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }

      const data: GetDueFlashcardsResponse = await response.json();

      // Validate response structure
      if (!Array.isArray(data.data) || typeof data.total_due !== "number") {
        throw new Error("Invalid response format");
      }

      // If no flashcards to study
      if (data.total_due === 0) {
        setState((prev) => ({
          ...prev,
          flashcards: [],
          sessionStats: { ...INITIAL_STATS, total: 0 },
          status: "completed",
        }));
        return;
      }

      // Initialize session with flashcards
      setState((prev) => ({
        ...prev,
        flashcards: data.data,
        sessionStats: { ...INITIAL_STATS, total: data.data.length },
        status: "active",
      }));
    } catch (error) {
      console.error("Failed to load flashcards:", error);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to load flashcards. Please try again.",
      }));
    }
  }, []);

  // Initialize - fetch on mount
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Prevent accidental page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.status === "active" && state.sessionStats.reviewed > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.status, state.sessionStats.reviewed]);

  // Show answer
  const showAnswer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnswerVisible: true,
    }));
  }, []);

  // Rate flashcard and move to next
  const submitRating = useCallback(
    async (rating: ReviewRating) => {
      const currentFlashcard = state.flashcards[state.currentIndex];
      if (!currentFlashcard) return;

      // Optimistic update - immediate transition to next card
      const nextIndex = state.currentIndex + 1;
      const isLastCard = nextIndex >= state.flashcards.length;

      setState((prev) => ({
        ...prev,
        currentIndex: nextIndex,
        isAnswerVisible: false,
        sessionStats: {
          ...prev.sessionStats,
          reviewed: prev.sessionStats.reviewed + 1,
          [rating]: prev.sessionStats[rating] + 1,
        },
        status: isLastCard ? "completed" : "active",
      }));

      // Asynchronous API call (fire-and-forget with error handling)
      try {
        const response = await fetch(`/api/flashcards/${currentFlashcard.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit review");
        }
      } catch (error) {
        console.error("Failed to submit review:", error);
        // Don't interrupt session - continue studying
      }
    },
    [state.flashcards, state.currentIndex]
  );

  // Exit session
  const exitSession = useCallback(() => {
    window.location.href = "/library";
  }, []);

  // Retry fetching flashcards
  const retryFetch = useCallback(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Calculate currentFlashcard
  const currentFlashcard = state.flashcards[state.currentIndex] || null;

  return {
    flashcards: state.flashcards,
    currentFlashcard,
    currentIndex: state.currentIndex,
    isAnswerVisible: state.isAnswerVisible,
    sessionStats: state.sessionStats,
    status: state.status,
    error: state.error,
    showAnswer,
    submitRating,
    exitSession,
    retryFetch,
  };
}
