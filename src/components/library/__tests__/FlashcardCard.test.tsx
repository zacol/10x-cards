import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { FlashcardCard } from "../FlashcardCard";
import type { FlashcardDTO } from "@/types";

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => (
    <div onClick={onSelect} onKeyDown={(e) => e.key === "Enter" && onSelect()} role="button" tabIndex={0}>
      {children}
    </div>
  ),
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("lucide-react", () => ({
  MoreVertical: () => null,
  Pencil: () => null,
  Trash2: () => null,
  Sparkles: () => <span>AI</span>,
  Calendar: () => null,
}));

describe("FlashcardCard", () => {
  const mockOnDelete = vi.fn();
  const mockOnEdit = vi.fn();

  const baseFlashcard: FlashcardDTO = {
    id: "1",
    front: "Test Front",
    back: "Test Back",
    created_at: new Date("2023-01-01").toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "u1",
    efactor: 2.5,
    interval: 1,
    repetition: 0,
    due_date: new Date().toISOString(),
    created_by_ai: false,
    generation_id: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render front and back content", () => {
    render(<FlashcardCard flashcard={baseFlashcard} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    expect(screen.getByText("Test Front")).toBeInTheDocument();
    expect(screen.getByText("Test Back")).toBeInTheDocument();
  });

  it("should show AI badge if created_by_ai is true", () => {
    const aiFlashcard = { ...baseFlashcard, created_by_ai: true };
    render(<FlashcardCard flashcard={aiFlashcard} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("should not show AI badge if created_by_ai is false", () => {
    render(<FlashcardCard flashcard={baseFlashcard} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    expect(screen.queryByText("AI")).not.toBeInTheDocument();
  });

  it.each([
    [-1, "Overdue"],
    [0, "Due today"],
    [1, "Due tomorrow"],
  ])("should show correct due status for diffDays = %i", (diffDays, expectedLabel) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + diffDays);
    const flashcardWithDueDate = { ...baseFlashcard, due_date: dueDate.toISOString() };
    render(<FlashcardCard flashcard={flashcardWithDueDate} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("should call onEdit when edit is clicked", () => {
    render(<FlashcardCard flashcard={baseFlashcard} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(baseFlashcard);
  });

  it("should show delete dialog and call onDelete when confirmed", () => {
    render(<FlashcardCard flashcard={baseFlashcard} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    // Open dialog
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    // Confirm deletion
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[1]); // Click the second delete button (in the dialog)
    expect(mockOnDelete).toHaveBeenCalledWith(baseFlashcard.id);
  });
});
