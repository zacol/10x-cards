import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  const handleBackToLibrary = () => {
    window.location.href = "/library";
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-36 text-center">
      <div className="mb-6 rounded-full bg-muted p-6" aria-hidden="true">
        <CheckCircle className="h-16 w-16 text-muted-foreground" />
      </div>

      <h2 className="mb-2 text-2xl font-semibold tracking-tight">No flashcards due for review</h2>

      <p className="mb-8 max-w-md text-muted-foreground">
        Great job! You&apos;re all caught up. Come back later or add more flashcards.
      </p>

      <Button onClick={handleBackToLibrary} size="lg">
        Back to Library
      </Button>
    </div>
  );
}
