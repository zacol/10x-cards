import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FlashcardDTO } from "@/types";
import { CreateFlashcardForm } from "@/components/forms/CreateFlashcardForm";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (updatedFlashcard: FlashcardDTO) => void;
}

export function CreateFlashcardModal({ isOpen, onOpenChange, onCreate }: CreateFlashcardModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Flashcard</DialogTitle>
          <DialogDescription>
            Enter the content for the front and back of the flashcard. After saving, it will be added to your library.
          </DialogDescription>
        </DialogHeader>
        <CreateFlashcardForm onCancel={() => onOpenChange(false)} onSuccess={onCreate} />
      </DialogContent>
    </Dialog>
  );
}
