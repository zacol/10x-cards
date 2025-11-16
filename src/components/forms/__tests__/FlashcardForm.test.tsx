import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardForm } from "../FlashcardForm";

// Mock console.error to avoid noise in test output
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Intentionally empty - suppressing console errors in tests
});

describe("FlashcardForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  describe("rendering", () => {
    it("should render form with default empty values", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByLabelText(/front/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/back/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("should render form with provided default values", () => {
      const defaultValues = {
        front: "Test question",
        back: "Test answer",
      };

      render(
        <FlashcardForm
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(screen.getByDisplayValue("Test question")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test answer")).toBeInTheDocument();
    });

    it("should render with custom submit label", () => {
      render(
        <FlashcardForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
          submitLabel="Create flashcard"
        />
      );

      expect(screen.getByRole("button", { name: /create flashcard/i })).toBeInTheDocument();
    });

    it("should render placeholders correctly", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByPlaceholderText("Enter the front of the flashcard")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter the back of the flashcard")).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("should show error when front field is empty", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Front content cannot be empty.")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when back field is empty", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      await user.type(frontInput, "Test question");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Back content cannot be empty.")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when front field exceeds 200 characters", async () => {
      const user = userEvent.setup();
      const longText = "a".repeat(201);

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      const backInput = screen.getByLabelText(/back/i);

      await user.type(frontInput, longText);
      await user.type(backInput, "Valid back content");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Front content cannot exceed 200 characters.")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when back field exceeds 400 characters", async () => {
      const user = userEvent.setup();
      const longText = "a".repeat(401);

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      const backInput = screen.getByLabelText(/back/i);

      await user.type(frontInput, "Valid front content");
      await user.type(backInput, longText);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Back content cannot exceed 400 characters.")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show multiple validation errors when both fields are empty", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Front content cannot be empty.")).toBeInTheDocument();
        expect(screen.getByText("Back content cannot be empty.")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should accept valid values at character limits", async () => {
      const user = userEvent.setup();
      const maxFront = "a".repeat(200);
      const maxBack = "b".repeat(400);

      mockOnSubmit.mockResolvedValue(undefined);

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      const backInput = screen.getByLabelText(/back/i);

      await user.type(frontInput, maxFront);
      await user.type(backInput, maxBack);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          front: maxFront,
          back: maxBack,
        },
        expect.any(Object)
      );
    });
  });

  describe("user interactions", () => {
    it("should allow typing in front field", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      await user.type(frontInput, "New question");

      expect(frontInput).toHaveValue("New question");
    });

    it("should allow typing in back field", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const backInput = screen.getByLabelText(/back/i);
      await user.type(backInput, "New answer");

      expect(backInput).toHaveValue("New answer");
    });

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should call onSubmit with form data when form is valid", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      const backInput = screen.getByLabelText(/back/i);

      await user.type(frontInput, "Question text");
      await user.type(backInput, "Answer text");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          front: "Question text",
          back: "Answer text",
        }),
        expect.anything()
      );
    });

    it("should not call onSubmit when form is invalid", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Front content cannot be empty.")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should update form values when user modifies default values", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      const defaultValues = {
        front: "Old question",
        back: "Old answer",
      };

      render(
        <FlashcardForm
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      const frontInput = screen.getByLabelText(/front/i);
      const backInput = screen.getByLabelText(/back/i);

      await user.clear(frontInput);
      await user.type(frontInput, "Updated question");

      await user.clear(backInput);
      await user.type(backInput, "Updated answer");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          front: "Updated question",
          back: "Updated answer",
        }),
        expect.anything()
      );
    });
  });

  describe("submitting state", () => {
    it("should disable submit button when isSubmitting is true", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />);

      const submitButton = screen.getByRole("button", { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    it("should change submit button text to 'Saving...' when isSubmitting is true", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />);

      expect(screen.getByRole("button", { name: /saving\.\.\./i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
    });

    it("should not disable cancel button when isSubmitting is true", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).not.toBeDisabled();
    });

    it("should use custom submitLabel text with 'Saving...' when isSubmitting", () => {
      render(
        <FlashcardForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
          submitLabel="Create flashcard"
        />
      );

      expect(screen.getByRole("button", { name: /saving\.\.\./i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /create flashcard/i })).not.toBeInTheDocument();
    });
  });

  describe("form submission flow", () => {
    it("should handle successful form submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const frontInput = screen.getByLabelText(/front/i);
      const backInput = screen.getByLabelText(/back/i);

      await user.type(frontInput, "Test front");
      await user.type(backInput, "Test back");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          front: "Test front",
          back: "Test back",
        }),
        expect.anything()
      );
    });

    it("should clear validation errors when user corrects input", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Front content cannot be empty.")).toBeInTheDocument();
      });

      const frontInput = screen.getByLabelText(/front/i);
      await user.type(frontInput, "Valid content");

      await waitFor(() => {
        expect(screen.queryByText("Front content cannot be empty.")).not.toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("should have proper labels for form fields", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByLabelText(/front/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/back/i)).toBeInTheDocument();
    });

    it("should associate validation messages with form fields", async () => {
      const user = userEvent.setup();

      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        const frontError = screen.getByText("Front content cannot be empty.");
        const backError = screen.getByText("Back content cannot be empty.");

        expect(frontError).toBeInTheDocument();
        expect(backError).toBeInTheDocument();
      });
    });

    it("should have proper button types", () => {
      render(<FlashcardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const submitButton = screen.getByRole("button", { name: /save changes/i });

      expect(cancelButton).toHaveAttribute("type", "button");
      expect(submitButton).toHaveAttribute("type", "submit");
    });
  });
});
