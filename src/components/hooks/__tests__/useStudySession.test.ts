import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useStudySession } from "../useStudySession";
import type { FlashcardDueDto, GetDueFlashcardsResponse } from "@/types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to avoid noise in test output
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Intentionally empty - suppressing console errors in tests
});

const mockFlashcardDue: FlashcardDueDto = {
  id: "fc-1",
  front: "Question 1",
  back: "Answer 1",
  repetition: 0,
  interval: 1,
  efactor: 2.5,
  due_date: "2024-01-01T00:00:00Z",
};

const mockFlashcardDue2: FlashcardDueDto = {
  id: "fc-2",
  front: "Question 2",
  back: "Answer 2",
  repetition: 1,
  interval: 3,
  efactor: 2.6,
  due_date: "2024-01-01T00:00:00Z",
};

const mockDueFlashcardsResponse: GetDueFlashcardsResponse = {
  data: [mockFlashcardDue, mockFlashcardDue2],
  total_due: 2,
};

describe("useStudySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("initialization", () => {
    it("should start with loading status and fetch flashcards", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      const { result } = renderHook(() => useStudySession());

      expect(result.current.status).toBe("loading");
      expect(result.current.flashcards).toEqual([]);

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      expect(result.current.flashcards).toEqual(mockDueFlashcardsResponse.data);
      expect(result.current.currentFlashcard).toEqual(mockFlashcardDue);
      expect(result.current.sessionStats.total).toBe(2);
    });

    it("should set completed status when no flashcards are due", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total_due: 0 }),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("completed");
      });

      expect(result.current.flashcards).toEqual([]);
      expect(result.current.sessionStats.total).toBe(0);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("error");
      });

      expect(result.current.error).toBe("Failed to load flashcards. Please try again.");
      expect(mockConsoleError).toHaveBeenCalledWith("Failed to load flashcards:", expect.any(Error));
    });

    it("should handle invalid response format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "format" }),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("error");
      });

      expect(result.current.error).toBe("Failed to load flashcards. Please try again.");
    });
  });

  describe("showAnswer", () => {
    it("should reveal the answer", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      expect(result.current.isAnswerVisible).toBe(false);

      act(() => {
        result.current.showAnswer();
      });

      expect(result.current.isAnswerVisible).toBe(true);
    });
  });

  describe("submitRating", () => {
    it("should move to next card and update stats", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      act(() => {
        result.current.showAnswer();
      });

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentFlashcard).toEqual(mockFlashcardDue2);
      expect(result.current.isAnswerVisible).toBe(false);
      expect(result.current.sessionStats.reviewed).toBe(1);
      expect(result.current.sessionStats.good).toBe(1);
      expect(result.current.status).toBe("active");
    });

    it("should complete session on last card", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockFlashcardDue], total_due: 1 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      act(() => {
        result.current.showAnswer();
      });

      await act(async () => {
        await result.current.submitRating("easy");
      });

      expect(result.current.status).toBe("completed");
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.sessionStats.reviewed).toBe(1);
      expect(result.current.sessionStats.easy).toBe(1);
    });

    it("should continue session even if API call fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      await act(async () => {
        await result.current.submitRating("again");
      });

      // Session should continue despite API error
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.sessionStats.reviewed).toBe(1);
      expect(result.current.sessionStats.again).toBe(1);
      expect(result.current.status).toBe("active");
      expect(mockConsoleError).toHaveBeenCalledWith("Failed to submit review:", expect.any(Error));
    });

    it("should handle all rating types correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockFlashcardDue, mockFlashcardDue2, { ...mockFlashcardDue, id: "fc-3" }],
          total_due: 3,
        }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      // Rate first card as "again"
      await act(async () => {
        await result.current.submitRating("again");
      });

      expect(result.current.sessionStats.again).toBe(1);

      // Rate second card as "good"
      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.sessionStats.good).toBe(1);

      // Rate third card as "easy"
      await act(async () => {
        await result.current.submitRating("easy");
      });

      expect(result.current.sessionStats.easy).toBe(1);
      expect(result.current.sessionStats.reviewed).toBe(3);
    });
  });

  describe("exitSession", () => {
    it("should redirect to library", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      const originalLocation = window.location.href;
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      act(() => {
        result.current.exitSession();
      });

      expect(window.location.href).toBe("/library");

      Object.defineProperty(window, "location", {
        value: { href: originalLocation },
        writable: true,
      });
    });
  });

  describe("retryFetch", () => {
    it("should retry fetching flashcards", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("error");
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      act(() => {
        result.current.retryFetch();
      });

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      expect(result.current.flashcards).toEqual(mockDueFlashcardsResponse.data);
    });
  });

  describe("beforeunload handler", () => {
    it("should prevent page refresh when session is active and cards reviewed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      // Review one card
      await act(async () => {
        await result.current.submitRating("good");
      });

      // Create and dispatch beforeunload event
      const event = new Event("beforeunload") as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should not prevent page refresh when no cards reviewed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDueFlashcardsResponse,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      // Create and dispatch beforeunload event
      const event = new Event("beforeunload") as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("should not prevent page refresh when session is completed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockFlashcardDue], total_due: 1 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      // Complete session
      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.status).toBe("completed");

      // Create and dispatch beforeunload event
      const event = new Event("beforeunload") as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe("currentFlashcard", () => {
    it("should return null when no flashcards", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total_due: 0 }),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("completed");
      });

      expect(result.current.currentFlashcard).toBeNull();
    });

    it("should return null after completing session", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockFlashcardDue], total_due: 1 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.status).toBe("active");
      });

      expect(result.current.currentFlashcard).toEqual(mockFlashcardDue);

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.currentFlashcard).toBeNull();
    });
  });
});
