import type { SupabaseClient } from "@/db/supabase.client";
import type { TablesInsert } from "@/db/database.types";
import type { CreateFlashcardCommand } from "@/types";

/**
 * Creates a new flashcard for the authenticated user.
 *
 * @param cmd - Command containing userId, front, and back text
 * @param client - Supabase client instance (from context.locals)
 * @returns The created flashcard record
 * @throws Supabase error if insert fails
 */
export async function createFlashcard(cmd: CreateFlashcardCommand, client: SupabaseClient) {
  // Build the insert payload with default values
  const payload: TablesInsert<"flashcards"> = {
    user_id: cmd.userId,
    front: cmd.front,
    back: cmd.back,
    created_by_ai: false,
  };

  // Insert the flashcard and return the created record
  const { data, error } = await client.from("flashcards").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}
