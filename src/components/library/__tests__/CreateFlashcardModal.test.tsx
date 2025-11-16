import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";

import { CreateFlashcardModal } from "../CreateFlashcardModal";
import type { FlashcardForm as FlashcardFormType } from "@/lib/schemas/flashcard.schema";
import type { FlashcardDTO } from "@/types";

// Mock dependencies
const { FlashcardForm } = vi.hoisted(() => ({
  FlashcardForm: vi.fn(),
}));
vi.mock("@/components/forms/FlashcardForm", () => ({ FlashcardForm }));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Dialog components to render their children and prevent context errors
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

describe("CreateFlashcardModal", () => {
  const mockOnCreate = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockFlashcard: FlashcardDTO = {
    id: "1",
    front: "Front",
    back: "Back",
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

  const renderComponent = (isOpen: boolean) => {
    render(<CreateFlashcardModal isOpen={isOpen} onOpenChange={mockOnOpenChange} onCreate={mockOnCreate} />);
  };

  const getFlashcardFormProps = () => {
    return vi.mocked(FlashcardForm).mock.calls.slice(-1)[0][0];
  };

  it("should not render the dialog when isOpen is false", () => {
    renderComponent(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog with the form when isOpen is true", () => {
    renderComponent(true);
    expect(screen.getByText("Create Flashcard")).toBeInTheDocument();
    expect(FlashcardForm).toHaveBeenCalled();
  });

  it("should call onOpenChange with false when the form's onCancel is called", () => {
    renderComponent(true);
    const { onCancel } = getFlashcardFormProps();

    act(() => {
      onCancel();
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should handle successful form submission", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockFlashcard), { status: 200 }));
    renderComponent(true);
    const { onSubmit } = getFlashcardFormProps();
    const formData: FlashcardFormType = { front: "Front", back: "Back" };

    await act(async () => {
      await onSubmit(formData);
    });

    expect(fetch).toHaveBeenCalledWith("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    expect(mockOnCreate).toHaveBeenCalledWith(mockFlashcard);
    expect(toast.success).toHaveBeenCalledWith("Flashcard added successfully!");
  });

  it.each([
    [400, { error: { message: "Validation failed" } }, "Validation failed"],
    [500, {}, "A server error occurred. Please try again later."],
    [404, {}, "Failed to create flashcard. Please try again."],
  ])("should handle API error with status %i", async (status, errorBody, expectedMessage) => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(errorBody), { status }));
    renderComponent(true);
    const { onSubmit } = getFlashcardFormProps();

    await act(async () => {
      await onSubmit({ front: "Test", back: "Test" });
    });

    expect(toast.error).toHaveBeenCalledWith(expectedMessage);
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it("should handle network errors during submission", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    renderComponent(true);
    const { onSubmit } = getFlashcardFormProps();

    await act(async () => {
      await onSubmit({ front: "Test", back: "Test" });
    });

    expect(toast.error).toHaveBeenCalledWith("Connection error. Check your internet connection.");
    expect(mockOnCreate).not.toHaveBeenCalled();
  });
});
