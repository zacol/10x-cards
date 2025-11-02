import { useLibraryState } from "@/components/hooks/useLibraryState";
import { FlashcardCard } from "./FlashcardCard";
import { SkeletonCard } from "./SkeletonCard";
import { LibraryFilters } from "./LibraryFilters";
import { PaginationControls } from "./PaginationControls";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import type { PaginatedResponse, FlashcardDTO, LibraryFiltersViewModel } from "@/types";
import { AlertCircle } from "lucide-react";

interface FlashcardListProps {
  initialData: PaginatedResponse<FlashcardDTO>;
  initialFilters?: Partial<LibraryFiltersViewModel>;
}

export function FlashcardList({ initialData, initialFilters = {} }: FlashcardListProps) {
  const defaultFilters: LibraryFiltersViewModel = {
    sort: "created_at",
    order: "desc",
    createdByAi: "all",
    ...initialFilters,
  };

  const { state, setFilters, setPage, deleteFlashcard, addFlashcard } = useLibraryState({
    initialData,
    initialFilters: defaultFilters,
  });

  const isLoading = state.status === "loading";
  const hasError = state.status === "error";
  const isEmpty = state.flashcards.length === 0 && !isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <LibraryFilters filters={state.filters} onFilterChange={setFilters} />
        <CreateFlashcardModal onFlashcardCreated={addFlashcard} />
      </div>

      {hasError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Failed to load flashcards</p>
            <p className="text-sm opacity-90">{state.error || "An unknown error occurred. Please try again."}</p>
          </div>
        </div>
      )}

      {isEmpty && !hasError && (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No flashcards found matching your filters. Try adjusting your search criteria.
          </p>
        </div>
      )}

      {!isEmpty && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: state.pagination.limit }).map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} />
                ))
              : state.flashcards.map((flashcard) => (
                  <FlashcardCard key={flashcard.id} flashcard={flashcard} onDelete={deleteFlashcard} />
                ))}
          </div>

          {!isLoading && state.pagination.total > 0 && (
            <div className="flex justify-center">
              <PaginationControls pagination={state.pagination} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
