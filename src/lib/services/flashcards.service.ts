import type { SupabaseClient } from "@/db/supabase.client";
import type { TablesInsert } from "@/db/database.types";
import type { CreateFlashcardCommand, FlashcardDTO, PaginatedResponse } from "@/types";
import type { GetFlashcardsQuery, UpdateFlashcardBody } from "@/lib/schemas/flashcard.schema";

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

/**
 * Retrieves a paginated, sortable, and filterable list of flashcards for a user.
 *
 * @param userId - ID of the authenticated user
 * @param query - Query parameters for pagination, sorting, and filtering
 * @param client - Supabase client instance (from context.locals)
 * @returns Paginated response with flashcards and metadata
 * @throws Supabase error if query fails
 */
export class FlashcardNotFoundError extends Error {
  constructor(message = "Flashcard not found or access denied") {
    super(message);
    this.name = "FlashcardNotFoundError";
  }
}

/**
 * Deletes a flashcard for the authenticated user.
 *
 * @param id - The UUID of the flashcard to delete
 * @param userId - ID of the authenticated user
 * @param client - Supabase client instance (from context.locals)
 * @throws {FlashcardNotFoundError} If the flashcard does not exist or the user does not own it
 * @throws {Error} If the Supabase query fails for other reasons
 */
export async function deleteFlashcard(id: string, userId: string, client: SupabaseClient): Promise<void> {
  const { error, count } = await client.from("flashcards").delete({ count: "exact" }).match({ id, user_id: userId });

  if (error) {
    throw error;
  }

  if (count === 0) {
    throw new FlashcardNotFoundError();
  }
}

export async function getFlashcards(
  userId: string,
  query: GetFlashcardsQuery,
  client: SupabaseClient
): Promise<PaginatedResponse<FlashcardDTO>> {
  // Extract query parameters with defaults
  const limit = query.limit ?? 50;
  const offset = query.offset ?? 0;
  const sort = query.sort ?? "created_at";
  const order = query.order ?? "desc";

  // Build base query with user filter
  let dataQuery = client.from("flashcards").select("*").eq("user_id", userId);

  let countQuery = client.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", userId);

  // Apply optional filters
  if (query.created_by_ai !== undefined) {
    dataQuery = dataQuery.eq("created_by_ai", query.created_by_ai);
    countQuery = countQuery.eq("created_by_ai", query.created_by_ai);
  }

  if (query.generation_id !== undefined) {
    dataQuery = dataQuery.eq("generation_id", query.generation_id);
    countQuery = countQuery.eq("generation_id", query.generation_id);
  }

  // Apply sorting
  dataQuery = dataQuery.order(sort, { ascending: order === "asc" });

  // Apply pagination
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute both queries in parallel
  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  if (dataResult.error) {
    throw dataResult.error;
  }

  if (countResult.error) {
    throw countResult.error;
  }

  const flashcards = dataResult.data;
  const total = countResult.count ?? 0;

  // Map to DTOs (remove user_id for privacy)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dtos: FlashcardDTO[] = flashcards.map(({ user_id, ...rest }) => rest);

  // Calculate has_more
  const has_more = offset + limit < total;

  return {
    data: dtos,
    pagination: {
      total,
      limit,
      offset,
      has_more,
    },
  };
}

/**
 * Updates a specific flashcard for the authenticated user.
 *
 * @param id - The UUID of the flashcard to update.
 * @param userId - ID of the authenticated user to scope the update.
 * @param payload - The new 'front' and 'back' content for the flashcard.
 * @param client - Supabase client instance.
 * @returns The updated flashcard data if found and updated, otherwise null.
 * @throws Supabase error if the update operation fails.
 */
/**
 * Retrieves a single flashcard by its ID, ensuring it belongs to the specified user.
 *
 * @param id - The UUID of the flashcard to retrieve.
 * @param userId - The ID of the authenticated user.
 * @param client - The Supabase client instance.
 * @returns The flashcard object if found and owned by the user, otherwise null.
 * @throws Throws a Supabase error if the query fails for reasons other than not finding a row.
 */
export async function getFlashcardById(id: string, userId: string, client: SupabaseClient) {
  const { data, error } = await client.from("flashcards").select("*").match({ id, user_id: userId }).single();

  if (error) {
    // PostgREST errors for `.single()` can include PGRST116 (no rows) which we treat as not found.
    if (error.code === "PGRST116") {
      return null;
    }
    // For other unexpected errors, re-throw to be handled by the global error handler.
    throw error;
  }

  return data;
}

export async function updateFlashcard(
  id: string,
  userId: string,
  payload: UpdateFlashcardBody,
  client: SupabaseClient
) {
  const { data, error } = await client
    .from("flashcards")
    .update(payload)
    .match({ id, user_id: userId })
    .select("*")
    .single();

  if (error) {
    // If the error indicates that no rows were found, PostgREST returns a specific error.
    // We can treat this as a "not found" case and return null, letting the caller decide on 404.
    if (error.code === "PGRST116") {
      return null;
    }
    // For all other errors, re-throw to be handled by a generic error handler.
    throw error;
  }

  return data;
}
