import { z } from "zod";

/**
 * Schema for validating the review command.
 * Ensures the rating is one of the three allowed SM-2 quality ratings.
 */
export const reviewCommandSchema = z.object({
  rating: z.enum(["again", "good", "easy"], {
    errorMap: () => ({ message: "Rating must be one of: 'again', 'good', or 'easy'." }),
  }),
});

/**
 * Schema for validating the flashcard ID path parameter.
 * Ensures it is a valid UUID.
 */
export const flashcardIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid flashcard ID format. Must be a valid UUID." }),
});

export type ReviewCommandInput = z.infer<typeof reviewCommandSchema>;
export type FlashcardIdParam = z.infer<typeof flashcardIdParamSchema>;
