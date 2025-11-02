import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Flashcard, FlashcardCreateRequestDTO } from "@/types";
import { flashcardFormSchema, type FlashcardForm } from "@/lib/schemas/flashcard.schema";

interface CreateFlashcardModalProps {
  onFlashcardCreated: (newFlashcard: Flashcard) => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  triggerSize?: "default" | "sm" | "lg" | "icon";
}

export function CreateFlashcardModal({
  onFlashcardCreated,
  triggerLabel = "Add flashcard manually",
  triggerVariant = "outline",
  triggerSize = "default",
}: CreateFlashcardModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form with zod resolver
  const form = useForm<FlashcardForm>({
    resolver: zodResolver(flashcardFormSchema),
    defaultValues: {
      front: "",
      back: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FlashcardForm) => {
    setIsSubmitting(true);

    try {
      const requestBody: FlashcardCreateRequestDTO = {
        front: values.front,
        back: values.back,
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Handle API errors
        if (response.status === 400) {
          const errorData = await response.json();
          toast.error(errorData.error?.message || "Błąd walidacji danych.");
          return;
        }

        if (response.status === 500) {
          toast.error("Wystąpił błąd serwera. Spróbuj ponownie później.");
          return;
        }

        toast.error("Nie udało się dodać fiszki. Spróbuj ponownie.");
        return;
      }

      // Success - get the created flashcard from response
      const newFlashcard: Flashcard = await response.json();

      // Close modal and reset form
      setIsOpen(false);
      form.reset();

      // Call the callback to update the parent component
      onFlashcardCreated(newFlashcard);

      // Show success toast
      toast.success("Fiszka została pomyślnie dodana!");
    } catch (error) {
      // Handle network errors
      console.error("Error creating flashcard:", error);
      toast.error("Błąd połączenia. Sprawdź połączenie internetowe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Utwórz nową fiszkę</DialogTitle>
          <DialogDescription>
            Wprowadź treść awersu i rewersu fiszki. Po zapisaniu zostanie ona dodana do Twojej biblioteki.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Front field */}
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Awers <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Np. Co to jest React?" {...field} disabled={isSubmitting} maxLength={200} />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value.length}/200</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Back field */}
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Rewers <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Np. React to biblioteka JavaScript do budowy interfejsów użytkownika..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={400}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value.length}/400</span>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
