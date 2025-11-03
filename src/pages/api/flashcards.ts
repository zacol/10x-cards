import type { APIContext } from "astro";

import { getFlashcardsQuerySchema, flashcardUpsertSchema } from "./flashcards.schema";
import { createFlashcard, getFlashcards } from "@/lib/services/flashcards.service";

export const prerender = false;

/**
 * POST /api/flashcards
 * Creates a new flashcard for the authenticated user.
 *
 * @returns 201 Created with flashcard data
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error on unexpected failure
 */
export async function POST(context: APIContext) {
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

  // Parse and validate request body
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const parsed = flashcardUpsertSchema.safeParse(body);

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

  // Happy path: Create flashcard
  try {
    const flashcard = await createFlashcard(
      {
        userId: user.id,
        front: parsed.data.front,
        back: parsed.data.back,
      },
      supabase
    );

    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("[POST /api/flashcards] Failed to create flashcard:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to create flashcard",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * GET /api/flashcards
 * Retrieves a paginated, sortable, and filterable list of flashcards for the authenticated user.
 *
 * @returns 200 OK with paginated flashcard data
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

  const parsed = getFlashcardsQuerySchema.safeParse(queryParams);

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

  // Happy path: Retrieve flashcards
  try {
    const result = await getFlashcards(user.id, parsed.data, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("[GET /api/flashcards] Failed to retrieve flashcards:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve flashcards",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
