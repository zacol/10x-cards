import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDTO } from "@/types";
import { flashcardFormSchema, type FlashcardForm } from "@/lib/schemas/flashcard.schema";

interface EditFlashcardFormProps {
  flashcard: FlashcardDTO;
  onCancel: () => void;
  onSuccess: (updatedFlashcard: FlashcardDTO) => void;
}

export function EditFlashcardForm({ flashcard, onCancel, onSuccess }: EditFlashcardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FlashcardForm>({
    resolver: zodResolver(flashcardFormSchema),
    defaultValues: {
      front: flashcard.front,
      back: flashcard.back,
    },
  });

  const onSubmit = async (values: FlashcardForm) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PATCH",
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

        toast.error("Failed to update flashcard. Please try again.");
        return;
      }

      const updatedFlashcard: FlashcardDTO = await response.json();
      onSuccess(updatedFlashcard);

      toast.success("Flashcard updated successfully!");
    } catch (error) {
      // Handle network errors
      console.error("Error updating flashcard:", error);
      toast.error("Connection error. Check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="front"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Front</FormLabel>
              <FormControl>
                <Input placeholder="Enter the front of the flashcard" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="back"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Back</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the back of the flashcard" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
