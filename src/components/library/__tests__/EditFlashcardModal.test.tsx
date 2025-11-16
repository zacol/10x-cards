import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";

import { EditFlashcardModal } from "../EditFlashcardModal";
import type { FlashcardForm as FlashcardFormType } from "@/lib/schemas/flashcard.schema";
import type { FlashcardDTO } from "@/types";

// Mock dependencies
const { FlashcardForm } = vi.hoisted(() => ({ FlashcardForm: vi.fn() }));
vi.mock("@/components/forms/FlashcardForm", () => ({ FlashcardForm }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/ui/dialog", async () => {
  const actual = await vi.importActual<object>("@/components/ui/dialog");
  return {
    ...actual,
    Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div role="dialog">{children}</div> : null,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  };
});

global.fetch = vi.fn();

describe("EditFlashcardModal", () => {
  const mockOnUpdate = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockFlashcard: FlashcardDTO = {
    id: "1",
    front: "Old Front",
    back: "Old Back",
    created_at: new Date().toISOString(),
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

  const renderComponent = (isOpen: boolean, flashcard: FlashcardDTO | null = mockFlashcard) => {
    render(
      <EditFlashcardModal
        isOpen={isOpen}
        onOpenChange={mockOnOpenChange}
        flashcard={flashcard}
        onUpdate={mockOnUpdate}
      />
    );
  };

  const getFlashcardFormProps = () => vi.mocked(FlashcardForm).mock.calls.slice(-1)[0][0];

  it("should render null if flashcard is null", () => {
    renderComponent(true, null);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not render if isOpen is false", () => {
    renderComponent(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog and pre-fill the form when open", () => {
    renderComponent(true);
    expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();
    expect(FlashcardForm).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultValues: { front: "Old Front", back: "Old Back" } }),
      undefined
    );
  });

  it("should handle successful form submission", async () => {
    const updatedFlashcard = { ...mockFlashcard, front: "New Front" };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(updatedFlashcard), { status: 200 }));
    renderComponent(true);

    const { onSubmit } = getFlashcardFormProps();
    const formData: FlashcardFormType = { front: "New Front", back: "Old Back" };

    await act(async () => {
      await onSubmit(formData);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/flashcards/${mockFlashcard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    expect(mockOnUpdate).toHaveBeenCalledWith(updatedFlashcard);
    expect(toast.success).toHaveBeenCalledWith("Flashcard updated successfully!");
  });

  it("should handle API errors during submission", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 500 }));
    renderComponent(true);
    const { onSubmit } = getFlashcardFormProps();

    await act(async () => {
      await onSubmit({ front: "Fail", back: "Fail" });
    });

    expect(toast.error).toHaveBeenCalledWith("A server error occurred. Please try again later.");
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it("should handle network errors during submission", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    renderComponent(true);
    const { onSubmit } = getFlashcardFormProps();

    await act(async () => {
      await onSubmit({ front: "Fail", back: "Fail" });
    });

    expect(toast.error).toHaveBeenCalledWith("Connection error. Check your internet connection.");
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
