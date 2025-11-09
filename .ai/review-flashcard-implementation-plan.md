# API Endpoint Implementation Plan: POST /api/flashcards/{id}/review

## 1. Endpoint Overview
This endpoint is responsible for processing a user's review of a single flashcard. It takes a rating, applies the SM-2 spaced repetition algorithm to update the flashcard's learning metadata (`repetition`, `interval`, `efactor`, `due_date`), and returns the updated flashcard state.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/api/flashcards/{id}/review`
- **Parameters**:
  - **Path (Required)**: `id` (string, uuid) - The unique identifier of the flashcard being reviewed.
  - **Headers (Required)**: `Authorization: Bearer {access_token}` - The JWT for user authentication.
- **Request Body**: The request body must be a JSON object with the following structure:
  ```json
  {
    "rating": "again" | "good" | "easy"
  }
  ```

## 3. Types Used
- **Request Body DTO**: `ReviewCommand` from `src/types.ts` will be used, validated by a new Zod schema.
  ```typescript
  // src/types.ts
  export type ReviewRating = "again" | "good" | "easy";

  export interface ReviewCommand {
    rating: ReviewRating;
  }
  ```
- **Response Body DTO**: A new DTO, `FlashcardReviewResponseDTO`, will be created to represent the successful response payload.
  ```typescript
  // To be added to src/types.ts
  export interface FlashcardReviewResponseDTO {
    id: string;
    repetition: number;
    interval: number;
    efactor: number;
    due_date: string;
    updated_at: string;
  }
  ```

## 4. Data Flow
1.  A `POST` request is sent to `/api/flashcards/{id}/review` with a valid JWT and a JSON body containing the `rating`.
2.  Astro's middleware intercepts the request, validates the JWT, and attaches the user session to `Astro.locals.session`.
3.  The API route handler at `src/pages/api/flashcards/[id]/review.ts` is invoked.
4.  The handler validates the `id` path parameter (must be a UUID) and the request body using a Zod schema.
5.  The handler calls the `FlashcardService.reviewFlashcard()` method, passing the `flashcardId`, `userId` (from the session), and `rating`.
6.  The `FlashcardService` fetches the specified flashcard from the `flashcards` table, ensuring it belongs to the authenticated user (`WHERE id = ? AND user_id = ?`).
7.  The service calculates the new `repetition`, `interval`, and `efactor` using the SM-2 algorithm based on the current values and the provided `rating`.
8.  The `due_date` is updated by adding the new `interval` (in days) to the current date.
9.  The service updates the flashcard record in the database with the new values.
10. The service returns the updated data to the API route handler.
11. The handler formats the data into the `FlashcardReviewResponseDTO` and sends a `200 OK` JSON response.

## 5. Security Considerations
- **Authentication**: The endpoint is protected. All requests must include a valid `Authorization: Bearer` token. This will be enforced by the existing Astro middleware.
- **Authorization**: The primary security measure is to prevent a user from reviewing another user's flashcard. The `FlashcardService` **must** include a `user_id` check in its database query (`WHERE id = :flashcardId AND user_id = :userId`).
- **Input Validation**: Zod schemas will be used to strictly validate the path parameter (`id`) and the request body (`rating`), preventing invalid data from being processed.

## 6. Error Handling
- **400 Bad Request**:
  - If the `id` path parameter is not a valid UUID.
  - If the `rating` field is missing or contains a value other than `"again"`, `"good"`, or `"easy"`.
- **401 Unauthorized**:
  - If the `Authorization` header is missing or the token is invalid (handled by middleware).
- **404 Not Found**:
  - If a flashcard with the specified `id` does not exist for the authenticated user.
- **500 Internal Server Error**:
  - For unexpected database errors or other unhandled exceptions during the SM-2 calculation or database update.

## 7. Performance Considerations
- The database query to fetch and update the flashcard should be indexed on the `id` (primary key) and `user_id` columns for fast lookups.
- The SM-2 algorithm calculation is computationally inexpensive and will not be a bottleneck.
- The overall operation is a single read followed by a single write, which should be highly performant.

## 8. Implementation Steps
1.  **Update Types**: Add the `FlashcardReviewResponseDTO` type to `src/types.ts`.
2.  **Create Zod Schema**: Create a new file `src/lib/schemas/review.schema.ts` to define the Zod schema for validating the `ReviewCommand` DTO.
3.  **Implement Service Logic**:
    - Create a new file `src/lib/services/flashcard.service.ts` if it doesn't exist.
    - Add a new method `reviewFlashcard(command: { flashcardId: string; userId: string; rating: ReviewRating; })`.
    - Inside this method, implement the full data flow logic: fetch, validate ownership, apply SM-2 algorithm, and update the database record.
    - Ensure the SM-2 logic correctly handles all edge cases (e.g., first review, quality < 2).
4.  **Create API Endpoint**:
    - Create the file `src/pages/api/flashcards/[id]/review.ts`.
    - Implement the `POST` handler function.
    - Add `export const prerender = false;`.
    - Use the Zod schema to parse and validate the request body and path parameter.
    - Call the `flashcardService.reviewFlashcard` method with the validated data.
    - Handle success and error responses, returning the appropriate status codes and JSON payloads.
