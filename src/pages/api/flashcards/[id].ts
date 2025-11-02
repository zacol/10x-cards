import type { APIContext } from "astro";
import { getFlashcardParamsSchema, flashcardUpsertSchema } from "../flashcards.schema";
import { getFlashcardById, updateFlashcard } from "@/lib/services/flashcards.service";

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  const { supabase, user } = locals;

  // 1. Check if user is authenticated
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // 2. Validate the flashcard ID from the URL
  const idValidation = getFlashcardParamsSchema.safeParse(params);
  if (!idValidation.success) {
    return new Response(JSON.stringify({ error: "Invalid flashcard ID format" }), { status: 400 });
  }
  const flashcardId = idValidation.data.id;

  try {
    // 3. Fetch the flashcard using the service
    const flashcard = await getFlashcardById(flashcardId, user.id, supabase);

    // 4. Handle response
    if (!flashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(flashcard), { status: 200 });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(`Error fetching flashcard ${flashcardId}:`, error);
    return new Response(JSON.stringify({ error: "An internal server error occurred" }), { status: 500 });
  }
}

export async function PATCH({ params, request, locals }: APIContext) {
  const { supabase, user } = locals;

  // User must be authenticated
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // 1. Validate path parameter
  const idValidation = getFlashcardParamsSchema.safeParse(params);
  if (!idValidation.success) {
    return new Response(JSON.stringify({ error: "Invalid flashcard ID format" }), { status: 400 });
  }
  const flashcardId = idValidation.data.id;

  // 2. Validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const bodyValidation = flashcardUpsertSchema.safeParse(body);
  if (!bodyValidation.success) {
    return new Response(JSON.stringify({ error: "Invalid request body", details: bodyValidation.error.flatten() }), {
      status: 400,
    });
  }

  try {
    // 3. Call the service to update the flashcard
    const updatedFlashcard = await updateFlashcard(flashcardId, user.id, bodyValidation.data, supabase);

    // 4. Handle response
    if (!updatedFlashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found or you do not have permission to edit it" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), { status: 200 });
  } catch {
    // In a real application, you would log this error to a monitoring service.
    return new Response(JSON.stringify({ error: "An internal server error occurred" }), { status: 500 });
  }
}
