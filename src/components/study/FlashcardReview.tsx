import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingButtons } from "./RatingButtons";
import type { FlashcardDueDto, ReviewRating } from "@/types";

interface FlashcardReviewProps {
  flashcard: FlashcardDueDto;
  isAnswerVisible: boolean;
  onShowAnswer: () => void;
  onRate: (rating: ReviewRating) => void;
}

export function FlashcardReview({ flashcard, isAnswerVisible, onShowAnswer, onRate }: FlashcardReviewProps) {
  const showAnswerButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus on "Show answer" button when card changes
  useEffect(() => {
    if (!isAnswerVisible && showAnswerButtonRef.current) {
      showAnswerButtonRef.current.focus();
    }
  }, [flashcard.id, isAnswerVisible]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 px-6 py-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Front - always visible */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Question</h3>
            <p className="text-2xl font-medium leading-relaxed">{flashcard.front}</p>
          </div>

          {/* Back - visible after clicking "Show answer" */}
          {isAnswerVisible && (
            <div className="border-t pt-6">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Answer</h3>
              <p className="text-2xl leading-relaxed">{flashcard.back}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* "Show answer" button or rating buttons */}
      {!isAnswerVisible ? (
        <Button ref={showAnswerButtonRef} size="lg" onClick={onShowAnswer} className="min-w-[200px]">
          Show answer
        </Button>
      ) : (
        <div className="w-full max-w-2xl" role="region" aria-live="polite">
          <RatingButtons onRate={onRate} />
        </div>
      )}
    </div>
  );
}
