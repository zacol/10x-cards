import type { APIContext } from "astro";

import { getDueFlashcardsQuerySchema } from "../flashcards.schema";
import { getDueFlashcards } from "@/lib/services/flashcards.service";

export const prerender = false;

/**
 * GET /api/flashcards/due
 * Retrieves flashcards that are currently due for review for the authenticated user.
 *
 * @returns 200 OK with due flashcards data and total count
 * @returns 400 Bad Request if query validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error on unexpected failure
 */
export async function GET(context: APIContext) {
  const { supabase, user } = context.locals;

  // Guard: Check authentication
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Unauthenticated",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse and validate query parameters
  const url = new URL(context.request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const parsed = getDueFlashcardsQuerySchema.safeParse(queryParams);

  // Guard: Validate input
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: parsed.error.format(),
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Happy path: Retrieve due flashcards
  try {
    const result = await getDueFlashcards(user.id, parsed.data.limit, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("[GET /api/flashcards/due] Failed to retrieve due flashcards:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve due flashcards",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
