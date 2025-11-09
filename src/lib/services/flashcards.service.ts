import type { SupabaseClient } from "@/db/supabase.client";
import type { TablesInsert } from "@/db/database.types";
import type {
  CreateFlashcardCommand,
  FlashcardDTO,
  PaginatedResponse,
  GetDueFlashcardsResponse,
  FlashcardDueDto,
  FlashcardReviewResponseDTO,
  ReviewRating,
} from "@/types";
import type { GetFlashcardsQuery, FlashcardUpsert } from "@/pages/api/flashcards.schema";

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

export async function updateFlashcard(id: string, userId: string, payload: FlashcardUpsert, client: SupabaseClient) {
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

/**
 * Retrieves flashcards that are currently due for review for a user.
 * Executes two queries in parallel:
 * - Count query: Total number of due flashcards
 * - Data query: Limited list of due flashcards ordered by due_date
 *
 * @param userId - ID of the authenticated user
 * @param limit - Maximum number of flashcards to return (1-100)
 * @param client - Supabase client instance (from context.locals)
 * @returns Response containing list of due flashcards and total count
 * @throws Supabase error if query fails
 */
export async function getDueFlashcards(
  userId: string,
  limit: number,
  client: SupabaseClient
): Promise<GetDueFlashcardsResponse> {
  const now = new Date().toISOString();

  // Build parallel queries for count and data
  const countQuery = client
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("due_date", now);

  const dataQuery = client
    .from("flashcards")
    .select("id, front, back, repetition, interval, efactor, due_date")
    .eq("user_id", userId)
    .lte("due_date", now)
    .order("due_date", { ascending: true })
    .limit(limit);

  // Execute both queries in parallel for performance
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  // Handle errors
  if (countResult.error) {
    throw countResult.error;
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const total_due = countResult.count ?? 0;
  const flashcards = dataResult.data as FlashcardDueDto[];

  return {
    data: flashcards,
    total_due,
  };
}

/**
 * SM-2 Algorithm Implementation
 * Maps user rating to quality factor and calculates new spaced repetition values
 */

/**
 * Maps user-friendly rating to SM-2 quality (0-5 scale)
 * - "again" = 0 (complete failure)
 * - "good" = 3 (correct response with moderate difficulty)
 * - "easy" = 5 (perfect response)
 */
function mapRatingToQuality(rating: ReviewRating): number {
  switch (rating) {
    case "again":
      return 0;
    case "good":
      return 3;
    case "easy":
      return 5;
  }
}

/**
 * Applies the SM-2 spaced repetition algorithm to calculate new learning parameters.
 *
 * Algorithm rules:
 * - If quality < 3 (failure): reset repetition to 0, interval to 1 day
 * - If quality >= 3 (success):
 *   - repetition increases by 1
 *   - interval calculated based on repetition count:
 *     - repetition 1: 1 day
 *     - repetition 2: 6 days
 *     - repetition 3+: previous interval * efactor
 *   - efactor updated: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *   - efactor minimum clamped to 1.3
 *
 * @param currentRepetition - Current repetition count
 * @param currentInterval - Current interval in days
 * @param currentEfactor - Current easiness factor
 * @param quality - SM-2 quality (0-5 scale)
 * @returns Updated SM-2 parameters
 */
function calculateSM2(
  currentRepetition: number,
  currentInterval: number,
  currentEfactor: number,
  quality: number
): { repetition: number; interval: number; efactor: number } {
  let newRepetition: number;
  let newInterval: number;
  let newEfactor = currentEfactor;

  // Quality < 3: Failed review - reset progress
  if (quality < 3) {
    newRepetition = 0;
    newInterval = 1;
    // efactor stays the same on failure
  } else {
    // Quality >= 3: Successful review - advance progress
    newRepetition = currentRepetition + 1;

    // Calculate new interval based on repetition count
    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEfactor);
    }

    // Update efactor using SM-2 formula
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEfactor = currentEfactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Clamp efactor to minimum of 1.3
    if (newEfactor < 1.3) {
      newEfactor = 1.3;
    }
  }

  return {
    repetition: newRepetition,
    interval: newInterval,
    efactor: newEfactor,
  };
}

/**
 * Reviews a flashcard and updates its learning metadata using the SM-2 algorithm.
 *
 * @param flashcardId - UUID of the flashcard to review
 * @param userId - ID of the authenticated user (for authorization)
 * @param rating - User's rating: "again" | "good" | "easy"
 * @param client - Supabase client instance (from context.locals)
 * @returns Updated flashcard review metadata
 * @throws {FlashcardNotFoundError} If flashcard doesn't exist or user doesn't own it
 * @throws {Error} If database operation fails
 */
export async function reviewFlashcard(
  flashcardId: string,
  userId: string,
  rating: ReviewRating,
  client: SupabaseClient
): Promise<FlashcardReviewResponseDTO> {
  // Fetch the flashcard, ensuring it belongs to the user
  const flashcard = await getFlashcardById(flashcardId, userId, client);

  if (!flashcard) {
    throw new FlashcardNotFoundError();
  }

  // Map rating to SM-2 quality
  const quality = mapRatingToQuality(rating);

  // Apply SM-2 algorithm to calculate new values
  const { repetition, interval, efactor } = calculateSM2(
    flashcard.repetition,
    flashcard.interval,
    flashcard.efactor,
    quality
  );

  // Calculate new due_date by adding interval (in days) to current date
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval);

  // Update the flashcard in the database
  const { data, error } = await client
    .from("flashcards")
    .update({
      repetition,
      interval,
      efactor,
      due_date: dueDate.toISOString(),
      updated_at: now.toISOString(),
    })
    .match({ id: flashcardId, user_id: userId })
    .select("id, repetition, interval, efactor, due_date, updated_at")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new FlashcardNotFoundError();
  }

  return data as FlashcardReviewResponseDTO;
}
