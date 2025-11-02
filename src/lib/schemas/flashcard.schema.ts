import { z } from "zod";

/**
 * Schema for validating the flashcard form.
 * Ensures 'front' and 'back' content are within character limits.
 */
export const flashcardFormSchema = z.object({
  front: z.string().min(1, "Front content cannot be empty.").max(200, "Front content cannot exceed 200 characters."),
  back: z.string().min(1, "Back content cannot be empty.").max(400, "Back content cannot exceed 400 characters."),
});

export type FlashcardForm = z.infer<typeof flashcardFormSchema>;
