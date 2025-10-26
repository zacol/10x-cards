import type { APIContext } from "astro";

import { flashcardCreateSchema } from "./flashcards.schema";
import { createFlashcard } from "@/lib/services/flashcards.service";

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

  const parsed = flashcardCreateSchema.safeParse(body);

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
