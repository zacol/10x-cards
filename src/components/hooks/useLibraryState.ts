import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { LibraryFiltersViewModel, LibraryStateViewModel, PaginatedResponse, FlashcardDTO } from "@/types";

interface UseLibraryStateProps {
  initialData: PaginatedResponse<FlashcardDTO>;
  initialFilters: LibraryFiltersViewModel;
}

export function useLibraryState({ initialData, initialFilters }: UseLibraryStateProps) {
  const getInitialClientFilters = () => {
    if (typeof window === "undefined") {
      return initialFilters;
    }

    const params = new URLSearchParams(window.location.search);
    const urlFilters: Partial<LibraryFiltersViewModel> = {};

    const sort = params.get("sort");
    if (sort === "created_at" || sort === "updated_at" || sort === "due_date") {
      urlFilters.sort = sort;
    }

    const order = params.get("order");
    if (order === "asc" || order === "desc") {
      urlFilters.order = order;
    }

    const createdByAi = params.get("created_by_ai");
    if (createdByAi === "ai" || createdByAi === "manual" || createdByAi === "all") {
      urlFilters.createdByAi = createdByAi;
    }

    return { ...initialFilters, ...urlFilters };
  };

  const [state, setState] = useState<LibraryStateViewModel>(() => ({
    flashcards: initialData.data,
    pagination: initialData.pagination,
    filters: getInitialClientFilters(),
    status: "idle",
    error: null,
  }));

  // Fetch flashcards from API
  const fetchFlashcards = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading" }));

    try {
      const params = new URLSearchParams({
        limit: state.pagination.limit.toString(),
        offset: state.pagination.offset.toString(),
        sort: state.filters.sort,
        order: state.filters.order,
      });

      // Only add created_by_ai if not 'all'
      if (state.filters.createdByAi !== "all") {
        params.append("created_by_ai", state.filters.createdByAi === "ai" ? "true" : "false");
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }

      const data: PaginatedResponse<FlashcardDTO> = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: data.data,
        pagination: data.pagination,
        status: "success",
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, [state.pagination.limit, state.pagination.offset, state.filters]);

  // Update filters and trigger refetch
  const setFilters = useCallback((newFilters: Partial<LibraryFiltersViewModel>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, offset: 0 }, // Reset to first page
    }));
  }, []);

  // Change page and trigger refetch
  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        offset: (page - 1) * prev.pagination.limit,
      },
    }));
  }, []);

  // Optimistic delete with undo functionality
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteFlashcard = useCallback(
    async (id: string) => {
      const deletedFlashcard = state.flashcards.find((f) => f.id === id);
      if (!deletedFlashcard) return;

      let isUndone = false;

      // Optimistic update - remove from UI immediately
      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.filter((f) => f.id !== id),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
        },
      }));

      // Show toast with undo option
      toast.success("Flashcard deleted", {
        description: "The flashcard has been removed from your library.",
        action: {
          label: "Undo",
          onClick: () => {
            isUndone = true;
            // Clear the delete timeout
            if (deleteTimeoutRef.current) {
              clearTimeout(deleteTimeoutRef.current);
            }
            // Restore the flashcard
            setState((prev) => ({
              ...prev,
              flashcards: [...prev.flashcards, deletedFlashcard].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ),
              pagination: {
                ...prev.pagination,
                total: prev.pagination.total + 1,
              },
            }));
            toast.info("Deletion cancelled", {
              description: "The flashcard has been restored.",
            });
          },
        },
        duration: 5000,
      });

      // Wait for undo period before actually deleting
      deleteTimeoutRef.current = setTimeout(async () => {
        if (isUndone) return;

        try {
          const response = await fetch(`/api/flashcards/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete flashcard");
          }
        } catch (error) {
          // Rollback on error
          setState((prev) => ({
            ...prev,
            flashcards: [...prev.flashcards, deletedFlashcard].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total + 1,
            },
            error: error instanceof Error ? error.message : "Failed to delete flashcard",
          }));
          toast.error("Failed to delete flashcard", {
            description: error instanceof Error ? error.message : "An unknown error occurred",
          });
        }
      }, 5000);
    },
    [state.flashcards]
  );

  // Update URL when filters change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    params.set("sort", state.filters.sort);
    params.set("order", state.filters.order);
    if (state.filters.createdByAi !== "all") {
      params.set("created_by_ai", state.filters.createdByAi);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [state.filters]);

  // Refetch when filters or pagination changes, skip initial render
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    fetchFlashcards();
  }, [fetchFlashcards, state.filters, state.pagination.offset]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  // Add a new flashcard to the list (optimistic update)
  const addFlashcard = useCallback((newFlashcard: FlashcardDTO) => {
    setState((prev) => ({
      ...prev,
      flashcards: [newFlashcard, ...prev.flashcards],
      pagination: {
        ...prev.pagination,
        total: prev.pagination.total + 1,
      },
    }));
  }, []);

  // Update a flashcard in the list (optimistic update)
  const updateFlashcard = useCallback((updatedFlashcard: FlashcardDTO) => {
    setState((prev) => ({
      ...prev,
      flashcards: prev.flashcards.map((f) => (f.id === updatedFlashcard.id ? updatedFlashcard : f)),
    }));
  }, []);

  return {
    state,
    setFilters,
    setPage,
    deleteFlashcard,
    addFlashcard,
    updateFlashcard,
  };
}
