import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MinimalHeaderProps {
  onExit: () => void;
}

export function MinimalHeader({ onExit }: MinimalHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div className="text-xl font-bold">10xCards</div>
      <Button variant="outline" size="sm" onClick={onExit} aria-label="Exit study session">
        <X className="h-4 w-4" />
        <span className="ml-2">Exit</span>
      </Button>
    </header>
  );
}
