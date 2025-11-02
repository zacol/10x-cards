import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

/**
 * ---------------------------------------------------------------------------
 * Entity Types derived from the database schema
 * ---------------------------------------------------------------------------
 */
export type Flashcard = Tables<"flashcards">;
export type Generation = Tables<"generations">;

/**
 * ---------------------------------------------------------------------------
 * Data Transfer Objects (response shapes)
 * ---------------------------------------------------------------------------
 */

/**
 * Public representation of a flashcard. `user_id` is omitted for privacy,
 * but kept optional to support responses (e.g. create) that still return it.
 */
export type FlashcardDTO = Omit<Flashcard, "user_id"> & {
  user_id?: Flashcard["user_id"];
};

/** Public representation of a generation (user_id omitted). */
export type GenerationDTO = Omit<Generation, "user_id">;

/** Flashcard proposal object embedded in generation responses. */
export interface FlashcardProposalDTO {
  index: number;
  front: string;
  back: string;
}

/** Generic pagination metadata wrapper used by list endpoints. */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/** Generic paginated response wrapper combining data array with pagination metadata. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/** Detailed statistics returned by `/api/stats`. */
export interface UserStatisticsDTO {
  flashcards: {
    total: number;
    ai_generated: number;
    manual: number;
    ai_utilization_rate: number;
  };
  learning: {
    total_reviews: number;
    cards_due_today: number;
    cards_mastered: number;
  };
  generations: {
    total_generations: number;
    total_cost: number;
    average_generation_time_ms: number;
    ai_acceptance_rate: number;
  };
}

/** Response returned after accepting a generation. */
export interface AcceptGenerationResponse {
  generation_id: string;
  flashcards_created: number;
  flashcard_ids: string[];
}

/**
 * ---------------------------------------------------------------------------
 * Command Models (request bodies)
 * ---------------------------------------------------------------------------
 */

/** Register / Login payload. Supabase Auth will handle validation. */
export interface AuthCommand {
  email: string;
  password: string;
}

/** Request DTO for creating a flashcard (from client). */
export type FlashcardCreateRequestDTO = Pick<TablesInsert<"flashcards">, "front" | "back">;

/** Internal command for creating a flashcard (includes userId from auth context). */
export interface CreateFlashcardCommand {
  userId: string;
  front: string;
  back: string;
}

/** Update flashcard content (front/back only). */
export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;

/** Rating values accepted by SM-2 review endpoint. */
export type ReviewRating = "again" | "good" | "easy";

/** Submit a review result for a single flashcard. */
export interface ReviewCommand {
  rating: ReviewRating;
}

/** Payload for AI flashcard generation. */
export type GenerateFlashcardsCommand = Pick<TablesInsert<"generations">, "source_text" | "context">;

/** Edit an existing generation proposal. */
export interface EditProposalCommand {
  front: string;
  back: string;
}

/**
 * ---------------------------------------------------------------------------
 * Error Handling
 * ---------------------------------------------------------------------------
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "AI_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface ErrorResponse<Details = unknown> {
  error: {
    code: ErrorCode;
    message: string;
    details?: Details;
  };
}

/**
 * ---------------------------------------------------------------------------
 * View Models (frontend state management)
 * ---------------------------------------------------------------------------
 */

/** State object for library filters in the UI. */
export interface LibraryFiltersViewModel {
  sort: "created_at" | "updated_at" | "due_date";
  order: "asc" | "desc";
  createdByAi: "all" | "ai" | "manual"; // maps to true/false in API
}

/** Main state object managed by useLibraryState hook. */
export interface LibraryStateViewModel {
  flashcards: FlashcardDTO[];
  pagination: PaginationMeta;
  filters: LibraryFiltersViewModel;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}
