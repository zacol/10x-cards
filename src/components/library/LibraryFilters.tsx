import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LibraryFiltersViewModel } from "@/types";
import { ArrowDownAZ, ArrowUpAZ, Sparkles, PenLine, Library } from "lucide-react";

interface LibraryFiltersProps {
  filters: LibraryFiltersViewModel;
  onFilterChange: (filters: Partial<LibraryFiltersViewModel>) => void;
}

export function LibraryFilters({ filters, onFilterChange }: LibraryFiltersProps) {
  const handleSortChange = (value: string) => {
    const [sort, order] = value.split("-") as [LibraryFiltersViewModel["sort"], LibraryFiltersViewModel["order"]];
    onFilterChange({ sort, order });
  };

  const handleCreatedByAiChange = (value: string) => {
    if (value && (value === "all" || value === "ai" || value === "manual")) {
      onFilterChange({ createdByAi: value as LibraryFiltersViewModel["createdByAi"] });
    }
  };

  const currentSortValue = `${filters.sort}-${filters.order}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
        <ToggleGroup
          type="single"
          value={filters.createdByAi}
          onValueChange={handleCreatedByAiChange}
          className="justify-start"
        >
          <ToggleGroupItem value="all" aria-label="Show all flashcards" className="gap-2">
            <Library className="h-4 w-4" />
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="ai" aria-label="Show AI-generated flashcards" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI
          </ToggleGroupItem>
          <ToggleGroupItem value="manual" aria-label="Show manually created flashcards" className="gap-2">
            <PenLine className="h-4 w-4" />
            Manual
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
        <Select value={currentSortValue} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                Newest first
              </div>
            </SelectItem>
            <SelectItem value="created_at-asc">
              <div className="flex items-center gap-2">
                <ArrowUpAZ className="h-4 w-4" />
                Oldest first
              </div>
            </SelectItem>
            <SelectItem value="updated_at-desc">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                Recently updated
              </div>
            </SelectItem>
            <SelectItem value="due_date-asc">
              <div className="flex items-center gap-2">
                <ArrowUpAZ className="h-4 w-4" />
                Due date (soonest)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
