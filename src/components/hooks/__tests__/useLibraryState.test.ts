import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useLibraryState } from "../useLibraryState";
import type { PaginatedResponse, FlashcardDTO, LibraryFiltersViewModel } from "@/types";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.history
const mockReplaceState = vi.fn();
const mockHistoryReplaceState = window.history.replaceState;

beforeEach(() => {
  window.history.replaceState = mockReplaceState;
});

afterEach(() => {
  window.history.replaceState = mockHistoryReplaceState;
});

const mockFlashcard: FlashcardDTO = {
  id: "fc-1",
  front: "Question 1",
  back: "Answer 1",
  created_by_ai: false,
  generation_id: null,
  repetition: 0,
  interval: 1,
  efactor: 2.5,
  due_date: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockInitialData: PaginatedResponse<FlashcardDTO> = {
  data: [mockFlashcard],
  pagination: {
    total: 1,
    limit: 10,
    offset: 0,
    has_more: false,
  },
};

const mockInitialFilters: LibraryFiltersViewModel = {
  sort: "created_at",
  order: "desc",
  createdByAi: "all",
};

describe("useLibraryState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockReplaceState.mockClear();
    // Reset window.location.search
    Object.defineProperty(window, "location", {
      value: { search: "", pathname: "/library" },
      writable: true,
    });
  });

  describe("initialization", () => {
    it("should initialize with provided data", () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      expect(result.current.state.flashcards).toEqual([mockFlashcard]);
      expect(result.current.state.pagination).toEqual(mockInitialData.pagination);
      expect(result.current.state.filters).toEqual(mockInitialFilters);
      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.error).toBeNull();
    });

    it("should parse URL filters on client-side", () => {
      Object.defineProperty(window, "location", {
        value: { search: "?sort=due_date&order=asc&created_by_ai=ai", pathname: "/library" },
        writable: true,
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      expect(result.current.state.filters.sort).toBe("due_date");
      expect(result.current.state.filters.order).toBe("asc");
      expect(result.current.state.filters.createdByAi).toBe("ai");
    });

    it("should ignore invalid URL parameters", () => {
      Object.defineProperty(window, "location", {
        value: { search: "?sort=invalid&order=invalid&created_by_ai=invalid", pathname: "/library" },
        writable: true,
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      // Should fall back to initial filters
      expect(result.current.state.filters).toEqual(mockInitialFilters);
    });
  });

  describe("fetchFlashcards", () => {
    it("should fetch flashcards successfully", async () => {
      const newFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        id: "fc-2",
        front: "Question 2",
      };

      const mockResponse: PaginatedResponse<FlashcardDTO> = {
        data: [newFlashcard],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          has_more: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      // Trigger fetch by changing filters
      act(() => {
        result.current.setFilters({ sort: "updated_at" });
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      expect(result.current.state.flashcards).toEqual([newFlashcard]);
      expect(result.current.state.pagination).toEqual(mockResponse.pagination);
      expect(result.current.state.error).toBeNull();
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      // Trigger fetch by changing filters
      act(() => {
        result.current.setFilters({ sort: "updated_at" });
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
      });

      expect(result.current.state.error).toBe("Failed to fetch flashcards");
    });

    it("should include created_by_ai param when not 'all'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInitialData,
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      act(() => {
        result.current.setFilters({ createdByAi: "ai" });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchCall = mockFetch.mock.calls[0][0] as string;
      expect(fetchCall).toContain("created_by_ai=true");
    });

    it("should not include created_by_ai param when 'all'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInitialData,
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: { ...mockInitialFilters, createdByAi: "ai" },
        })
      );

      act(() => {
        result.current.setFilters({ createdByAi: "all" });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchCall = mockFetch.mock.calls[0][0] as string;
      expect(fetchCall).not.toContain("created_by_ai");
    });
  });

  describe("setFilters", () => {
    it("should update filters and reset pagination to first page", () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      // Set pagination to page 2
      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.state.pagination.offset).toBe(10);

      // Change filters - should reset to page 1
      act(() => {
        result.current.setFilters({ sort: "updated_at" });
      });

      expect(result.current.state.filters.sort).toBe("updated_at");
      expect(result.current.state.pagination.offset).toBe(0);
    });

    it("should partially update filters", () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      act(() => {
        result.current.setFilters({ order: "asc" });
      });

      expect(result.current.state.filters.sort).toBe("created_at"); // unchanged
      expect(result.current.state.filters.order).toBe("asc"); // changed
      expect(result.current.state.filters.createdByAi).toBe("all"); // unchanged
    });
  });

  describe("setPage", () => {
    it("should update pagination offset correctly", () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      act(() => {
        result.current.setPage(1);
      });
      expect(result.current.state.pagination.offset).toBe(0);

      act(() => {
        result.current.setPage(2);
      });
      expect(result.current.state.pagination.offset).toBe(10);

      act(() => {
        result.current.setPage(3);
      });
      expect(result.current.state.pagination.offset).toBe(20);
    });
  });

  describe("deleteFlashcard", () => {
    it("should optimistically delete flashcard and show toast", async () => {
      const { toast } = await import("sonner");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      act(() => {
        result.current.deleteFlashcard("fc-1");
      });

      // Should immediately remove from UI
      expect(result.current.state.flashcards).toHaveLength(0);
      expect(result.current.state.pagination.total).toBe(0);
      expect(toast.success).toHaveBeenCalledWith(
        "Flashcard deleted",
        expect.objectContaining({
          description: "The flashcard has been removed from your library.",
        })
      );
    });

    it("should restore flashcard on undo", async () => {
      const { toast } = await import("sonner");
      let undoCallback: (() => void) | undefined;

      vi.mocked(toast.success).mockImplementation((title, options) => {
        if (options && typeof options === "object" && "action" in options && options.action) {
          const action = options.action as { label: string; onClick: () => void };
          undoCallback = action.onClick;
        }
        return 1;
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      act(() => {
        result.current.deleteFlashcard("fc-1");
      });

      expect(result.current.state.flashcards).toHaveLength(0);

      // Trigger undo
      act(() => {
        undoCallback?.();
      });

      expect(result.current.state.flashcards).toHaveLength(1);
      expect(result.current.state.flashcards[0]).toEqual(mockFlashcard);
      expect(result.current.state.pagination.total).toBe(1);
      expect(toast.info).toHaveBeenCalledWith(
        "Deletion cancelled",
        expect.objectContaining({
          description: "The flashcard has been restored.",
        })
      );
    });

    it("should rollback on API error", async () => {
      const { toast } = await import("sonner");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      act(() => {
        result.current.deleteFlashcard("fc-1");
      });

      // Wait for timeout to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5100));
      });

      // Should restore flashcard after error
      expect(result.current.state.flashcards).toHaveLength(1);
      expect(result.current.state.flashcards[0]).toEqual(mockFlashcard);
      expect(result.current.state.pagination.total).toBe(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to delete flashcard",
        expect.objectContaining({
          description: "Failed to delete flashcard",
        })
      );
    }, 10000); // Increase timeout to 10s

    it("should do nothing if flashcard not found", async () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const initialLength = result.current.state.flashcards.length;

      act(() => {
        result.current.deleteFlashcard("non-existent-id");
      });

      expect(result.current.state.flashcards).toHaveLength(initialLength);
    });
  });

  describe("addFlashcard", () => {
    it("should add flashcard to the beginning of the list", async () => {
      const newFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        id: "fc-2",
        front: "New Question",
      };

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      act(() => {
        result.current.addFlashcard(newFlashcard);
      });

      expect(result.current.state.flashcards).toHaveLength(2);
      expect(result.current.state.flashcards[0]).toEqual(newFlashcard);
      expect(result.current.state.pagination.total).toBe(2);
    });
  });

  describe("updateFlashcard", () => {
    it("should update existing flashcard", async () => {
      const updatedFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        front: "Updated Question",
        back: "Updated Answer",
      };

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      act(() => {
        result.current.updateFlashcard(updatedFlashcard);
      });

      expect(result.current.state.flashcards[0]).toEqual(updatedFlashcard);
    });

    it("should not modify list if flashcard not found", async () => {
      const updatedFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        id: "non-existent",
        front: "Updated Question",
      };

      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      act(() => {
        result.current.updateFlashcard(updatedFlashcard);
      });

      expect(result.current.state.flashcards[0]).toEqual(mockFlashcard);
    });
  });

  describe("URL synchronization", () => {
    it("should update URL when filters change", async () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: mockInitialFilters,
        })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      act(() => {
        result.current.setFilters({ sort: "due_date", order: "asc", createdByAi: "ai" });
      });

      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalled();
      });

      const lastCall = mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      const newUrl = lastCall[2] as string;

      expect(newUrl).toContain("sort=due_date");
      expect(newUrl).toContain("order=asc");
      expect(newUrl).toContain("created_by_ai=ai");
    });

    it("should not include created_by_ai in URL when 'all'", async () => {
      const { result } = renderHook(() =>
        useLibraryState({
          initialData: mockInitialData,
          initialFilters: { ...mockInitialFilters, createdByAi: "ai" },
        })
      );

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      act(() => {
        result.current.setFilters({ createdByAi: "all" });
      });

      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalled();
      });

      const lastCall = mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      const newUrl = lastCall[2] as string;

      expect(newUrl).not.toContain("created_by_ai");
    });
  });
});
