import { z } from "zod";

/**
 * Validation schema for creating a flashcard.
 * - front: 1-200 characters
 * - back: 1-400 characters
 */
export const flashcardCreateSchema = z.object({
  front: z.string().min(1, "Front is required").max(200, "Front cannot exceed 200 characters"),
  back: z.string().min(1, "Back is required").max(400, "Back cannot exceed 400 characters"),
});
