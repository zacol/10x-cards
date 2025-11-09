import { Button } from "@/components/ui/button";
import type { ReviewRating } from "@/types";

interface RatingButtonsProps {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
}

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button
        variant="destructive"
        size="lg"
        onClick={() => onRate("again")}
        disabled={disabled}
        className="flex-1 sm:flex-none sm:min-w-[140px]"
      >
        Don&apos;t know
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={() => onRate("good")}
        disabled={disabled}
        className="flex-1 sm:flex-none sm:min-w-[140px]"
      >
        I know
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => onRate("easy")}
        disabled={disabled}
        className="flex-1 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 sm:flex-none sm:min-w-[140px]"
      >
        Very easy
      </Button>
    </div>
  );
}
