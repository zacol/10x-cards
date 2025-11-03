import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FlashcardDTO } from "@/types";
import { MoreVertical, Pencil, Trash2, Sparkles, Calendar } from "lucide-react";

interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onDelete: (id: string) => void;
  onEdit: (flashcard: FlashcardDTO) => void;
}

export function FlashcardCard({ flashcard, onDelete, onEdit }: FlashcardCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete(flashcard.id);
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDueStatus = () => {
    if (!flashcard.due_date) return null;

    const now = new Date();
    const dueDate = new Date(flashcard.due_date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Overdue", variant: "destructive" as const };
    if (diffDays === 0) return { label: "Due today", variant: "default" as const };
    if (diffDays === 1) return { label: "Due tomorrow", variant: "secondary" as const };
    return null;
  };

  const dueStatus = getDueStatus();

  return (
    <>
      <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
        <CardContent className="flex-1 space-y-4">
          <div className="flex space-x-2 items-center">
            {flashcard.created_by_ai && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </Badge>
            )}

            {dueStatus && (
              <Badge variant={dueStatus.variant} className="gap-1">
                <Calendar className="h-3 w-3" />
                {dueStatus.label}
              </Badge>
            )}

            <span className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Open menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(flashcard)} className="flex cursor-pointer items-center">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">Front</h3>
            <p className="line-clamp-3 text-sm">{flashcard.front}</p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">Back</h3>
            <p className="line-clamp-3 text-sm text-muted-foreground">{flashcard.back}</p>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(flashcard.created_at)}</span>
          </div>
          {flashcard.due_date && (
            <div className="flex items-center gap-1">
              <span>Due {formatDate(flashcard.due_date)}</span>
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the flashcard from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
