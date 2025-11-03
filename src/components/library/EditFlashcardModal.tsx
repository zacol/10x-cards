import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FlashcardDTO } from "@/types";
import { EditFlashcardForm } from "@/components/forms/EditFlashcardForm";

interface EditFlashcardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  flashcard: FlashcardDTO | null;
  onUpdate: (updatedFlashcard: FlashcardDTO) => void;
}

export function EditFlashcardModal({ isOpen, onOpenChange, flashcard, onUpdate }: EditFlashcardModalProps) {
  if (!flashcard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Make changes to your flashcard here. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>
        <EditFlashcardForm flashcard={flashcard} onCancel={() => onOpenChange(false)} onSuccess={onUpdate} />
      </DialogContent>
    </Dialog>
  );
}
