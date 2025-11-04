import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FlashcardDTO } from "@/types";
import { FlashcardForm } from "@/components/forms/FlashcardForm";
import type { FlashcardForm as FlashcardFormType } from "@/lib/schemas/flashcard.schema";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (updatedFlashcard: FlashcardDTO) => void;
}

export function CreateFlashcardModal({ isOpen, onOpenChange, onCreate }: CreateFlashcardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: FlashcardFormType) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/flashcards", {
        method: "POST",
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

        toast.error("Failed to create flashcard. Please try again.");
        return;
      }

      const createdFlashcard: FlashcardDTO = await response.json();
      onCreate(createdFlashcard);

      toast.success("Flashcard added successfully!");
    } catch (error) {
      // Handle network errors
      console.error("Error creating flashcard:", error);
      toast.error("Connection error. Check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Flashcard</DialogTitle>
          <DialogDescription>
            Enter the content for the front and back of the flashcard. After saving, it will be added to your library.
          </DialogDescription>
        </DialogHeader>
        <FlashcardForm onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
