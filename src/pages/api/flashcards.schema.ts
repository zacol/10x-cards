import { z } from "zod";

/**
 * Schema for validating query parameters in GET /api/flashcards endpoint.
 * Supports pagination, sorting, and filtering of flashcards.
 */
export const getFlashcardsQuerySchema = z.object({
  // Pagination
  limit: z.coerce.number().int().positive().max(100, "Limit cannot exceed 100").default(50).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),

  // Sorting
  sort: z.enum(["created_at", "updated_at", "due_date"]).default("created_at").optional(),
  order: z.enum(["asc", "desc"]).default("desc").optional(),

  // Filtering
  created_by_ai: z
    .string()
    .transform((val) => val === "true")
    .pipe(z.boolean())
    .optional(),
  generation_id: z.string().uuid("Invalid generation_id format").optional(),
});

export type GetFlashcardsQuery = z.infer<typeof getFlashcardsQuerySchema>;

/**
 * Schema for validating the flashcard ID from path parameters.
 */
export const getFlashcardParamsSchema = z.object({
  id: z.string().uuid("Invalid flashcard ID format"),
});

/**
 * Schema for validating the body when creating or updating a flashcard.
 * Ensures 'front' and 'back' content are within character limits.
 */
export const flashcardUpsertSchema = z.object({
  front: z.string().min(1, "Front content cannot be empty.").max(200, "Front content cannot exceed 200 characters."),
  back: z.string().min(1, "Back content cannot be empty.").max(400, "Back content cannot exceed 400 characters."),
});

export type FlashcardUpsert = z.infer<typeof flashcardUpsertSchema>;
