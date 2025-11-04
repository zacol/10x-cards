import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FlashcardDTO } from "@/types";
import { FlashcardForm } from "@/components/forms/FlashcardForm";
import type { FlashcardForm as FlashcardFormType } from "@/lib/schemas/flashcard.schema";

interface EditFlashcardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  flashcard: FlashcardDTO | null;
  onUpdate: (updatedFlashcard: FlashcardDTO) => void;
}

export function EditFlashcardModal({ isOpen, onOpenChange, flashcard, onUpdate }: EditFlashcardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!flashcard) {
    return null;
  }

  const handleSubmit = async (values: FlashcardFormType) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        // Handle API errors
        if (response.status === 400) {
          const errorData = await response.json();
          toast.error(errorData.error?.message || "Validation error.");
          return;
        }

        if (response.status === 500) {
          toast.error("A server error occurred. Please try again later.");
          return;
        }

        toast.error("Failed to update flashcard. Please try again.");
        return;
      }

      const updatedFlashcard: FlashcardDTO = await response.json();
      onUpdate(updatedFlashcard);

      toast.success("Flashcard updated successfully!");
    } catch (error) {
      // Handle network errors
      console.error("Error updating flashcard:", error);
      toast.error("Connection error. Check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Make changes to your flashcard here. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>
        <FlashcardForm
          defaultValues={{ front: flashcard.front, back: flashcard.back }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
