import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useStudySession } from "@/components/hooks/useStudySession";
import { MinimalHeader } from "./MinimalHeader";
import { ProgressBar } from "./ProgressBar";
import { FlashcardReview } from "./FlashcardReview";
import { SessionSummary } from "./SessionSummary";
import { ExitConfirmModal } from "./ExitConfirmModal";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StudySession() {
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const {
    currentFlashcard,
    isAnswerVisible,
    sessionStats,
    status,
    error,
    showAnswer,
    submitRating,
    exitSession,
    retryFetch,
  } = useStudySession();

  // Exit handler - checks whether to show modal
  const handleExit = () => {
    if (sessionStats.reviewed === 0) {
      exitSession();
    } else {
      setIsExitModalOpen(true);
    }
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    exitSession();
  };

  const handleCancelExit = () => {
    setIsExitModalOpen(false);
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        <MinimalHeader onExit={handleExit} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col">
        <MinimalHeader onExit={handleExit} />
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Error loading flashcards</CardTitle>
              <CardDescription>{error || "An unexpected error occurred"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={retryFetch} className="w-full" size="lg">
                Try again
              </Button>
              <Button onClick={exitSession} variant="outline" className="w-full" size="lg">
                Back to Library
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completed state - no flashcards (EmptyState)
  if (status === "completed" && sessionStats.total === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <MinimalHeader onExit={exitSession} />
        <EmptyState />
      </div>
    );
  }

  // Completed state - session finished (SessionSummary)
  if (status === "completed" && sessionStats.total > 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <MinimalHeader onExit={exitSession} />
        <SessionSummary stats={sessionStats} onBackToLibrary={exitSession} />
      </div>
    );
  }

  // Active state - study session
  return (
    <div className="flex min-h-screen flex-col">
      <MinimalHeader onExit={handleExit} />
      <ProgressBar current={sessionStats.reviewed} total={sessionStats.total} />

      {currentFlashcard && (
        <FlashcardReview
          flashcard={currentFlashcard}
          isAnswerVisible={isAnswerVisible}
          onShowAnswer={showAnswer}
          onRate={submitRating}
        />
      )}

      <ExitConfirmModal isOpen={isExitModalOpen} onConfirm={handleConfirmExit} onCancel={handleCancelExit} />
    </div>
  );
}
