import { useState } from "react";
import { useLibraryState } from "@/components/hooks/useLibraryState";
import { FlashcardCard } from "./FlashcardCard";
import { SkeletonCard } from "./SkeletonCard";
import { LibraryFilters } from "./LibraryFilters";
import { PaginationControls } from "./PaginationControls";
import { EditFlashcardModal } from "@/components/library/EditFlashcardModal";
import type { PaginatedResponse, FlashcardDTO, LibraryFiltersViewModel } from "@/types";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateFlashcardModal } from "./CreateFlashcardModal";

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

  const [creatingFlashcard, setCreatingFlashcard] = useState<boolean>(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(null);

  const { state, setFilters, setPage, deleteFlashcard, addFlashcard, updateFlashcard } = useLibraryState({
    initialData,
    initialFilters: defaultFilters,
  });

  const isLoading = state.status === "loading";
  const hasError = state.status === "error";
  const isEmpty = state.flashcards.length === 0 && !isLoading;

  const handleCreate = (createdFlashcard: FlashcardDTO) => {
    addFlashcard(createdFlashcard);
    setCreatingFlashcard(false);
  };

  const handleUpdate = (updatedFlashcard: FlashcardDTO) => {
    updateFlashcard(updatedFlashcard);
    setEditingFlashcard(null);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
        <p className="text-muted-foreground mt-2">
          {`${state.pagination.total} flashcard${state.pagination.total === 1 ? "" : "s"} in your collection`}
        </p>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <LibraryFilters filters={state.filters} onFilterChange={setFilters} />
          <Button variant="outline" onClick={() => setCreatingFlashcard(true)}>
            <Plus className="h-4 w-4" />
            Add flashcard manually
          </Button>
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
                    <FlashcardCard
                      key={flashcard.id}
                      flashcard={flashcard}
                      onDelete={deleteFlashcard}
                      onEdit={setEditingFlashcard}
                    />
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
      <CreateFlashcardModal
        isOpen={creatingFlashcard}
        onOpenChange={(isOpen) => !isOpen && setCreatingFlashcard(false)}
        onCreate={handleCreate}
      />
      <EditFlashcardModal
        isOpen={!!editingFlashcard}
        onOpenChange={(isOpen) => !isOpen && setEditingFlashcard(null)}
        flashcard={editingFlashcard}
        onUpdate={handleUpdate}
      />
    </>
  );
}
