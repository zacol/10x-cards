import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CreateFlashcardModal } from "./CreateFlashcardModal";

export function QuickStartAddButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = () => {
    setIsModalOpen(false);
    window.location.href = "/library";
  };

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4" />
        Add manually
      </Button>
      <CreateFlashcardModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} onCreate={handleCreate} />
    </>
  );
}
