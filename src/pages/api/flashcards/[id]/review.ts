import type { APIContext } from "astro";
import { reviewCommandSchema, flashcardIdParamSchema } from "@/lib/schemas/review.schema";
import { reviewFlashcard, FlashcardNotFoundError } from "@/lib/services/flashcards.service";

export const prerender = false;

/**
 * POST /api/flashcards/{id}/review
 *
 * Reviews a flashcard and applies the SM-2 spaced repetition algorithm.
 * Updates the flashcard's learning metadata (repetition, interval, efactor, due_date).
 *
 * @param params.id - UUID of the flashcard to review
 * @param request.body - JSON object containing rating: "again" | "good" | "easy"
 * @returns 200 OK with updated flashcard metadata
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or user doesn't own it
 * @returns 500 Internal Server Error for unexpected errors
 */
export async function POST({ params, request, locals }: APIContext) {
  const { supabase, user } = locals;

  // 1. Check if user is authenticated
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Authentication required. Please log in to review flashcards.",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Validate the flashcard ID from the URL path
  const idValidation = flashcardIdParamSchema.safeParse(params);
  if (!idValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard ID format.",
          details: idValidation.error.flatten(),
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const flashcardId = idValidation.data.id;

  // 3. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body. Please provide a valid JSON object.",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const bodyValidation = reviewCommandSchema.safeParse(body);
  if (!bodyValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body.",
          details: bodyValidation.error.flatten(),
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { rating } = bodyValidation.data;

  try {
    // 4. Call the service to review the flashcard
    const updatedFlashcard = await reviewFlashcard(flashcardId, user.id, rating, supabase);

    // 5. Return success response with updated metadata
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle specific errors
    if (error instanceof FlashcardNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found or you do not have permission to review it.",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 7. Log unexpected errors and return generic error response
    console.error(`Error reviewing flashcard ${flashcardId}:`, error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing your review.",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
