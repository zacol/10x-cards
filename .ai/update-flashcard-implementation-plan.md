# API Endpoint Implementation Plan: Update Flashcard

## 1. Endpoint Overview

This document outlines the implementation plan for the `PATCH /api/flashcards/{id}` endpoint. Its purpose is to allow an authenticated user to update the `front` and `back` content of a specific flashcard they own.

## 2. Request Details

- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/flashcards/{id}`
- **Parameters**:
  - **Path (Required)**: `id` (string, UUID format) - The unique identifier of the flashcard to update.
- **Headers**:
  - **Required**: `Authorization: Bearer {access_token}` - The JWT for user authentication.
- **Request Body**: The body must be a JSON object with the following structure:
  ```json
  {
    "front": "Updated front content of the flashcard",
    "back": "Updated back content of the flashcard"
  }
  ```

## 3. Utilized Types

- **`UpdateFlashcardDto` (Zod Schema)**: A new schema will be created in `src/lib/schemas/flashcards.schemas.ts` to validate the request body. It will enforce that `front` is a string between 1 and 200 characters, and `back` is a string between 1 and 400 characters.
- **`FlashcardDTO` (from `src/types.ts`)**: This existing type will be used for the successful response payload, representing the updated flashcard.

## 4. Data Flow

1.  A `PATCH` request is sent to `/api/flashcards/{id}` with a valid JWT.
2.  Astro's middleware intercepts the request, validates the token, and attaches the user session and Supabase client to `context.locals`.
3.  The API route handler (`src/pages/api/flashcards/[id].ts`) receives the request.
4.  The handler validates the `id` path parameter (must be a UUID) and the request body using the `UpdateFlashcardDto` Zod schema.
5.  If validation passes, the handler calls the `flashcardsService.updateFlashcard` method, passing the `userId` (from `context.locals.user`), the `flashcardId`, and the validated request body.
6.  The `updateFlashcard` service method constructs and executes a Supabase query to update the flashcard in the `flashcards` table. The query will include a `WHERE` clause to match both `id` and `user_id` to ensure the user owns the flashcard.
7.  If the update is successful and one row is affected, the service fetches the updated flashcard data and returns it.
8.  The API route handler receives the updated flashcard data from the service, formats it as a `FlashcardDTO`, and sends it back to the client with a `200 OK` status.

## 5. Security Considerations

- **Authentication**: Access to this endpoint will be protected by the existing authentication middleware, which verifies the user's JWT. Requests without a valid token will be rejected with a `401 Unauthorized` error.
- **Authorization**: This is the most critical security aspect. The database update operation **must** be scoped to the authenticated user. The `UPDATE` query in the service layer will strictly enforce this by matching both the `flashcard.id` and the `user_id` from the session (`context.locals.user.id`). This prevents a user from modifying another user's flashcards, even if they guess a valid flashcard ID.
- **Input Validation**: All incoming data (`id` parameter and request body) will be rigorously validated using Zod to prevent malformed data, oversized content, and potential injection vectors. This enforces the constraints defined in the database schema.

## 6. Error Handling

- **`400 Bad Request`**: Returned if:
  - The `{id}` path parameter is not a valid UUID.
  - The request body fails validation (e.g., missing fields, empty strings, content exceeds length limits).
- **`401 Unauthorized`**: Returned by the middleware if the user is not authenticated.
- **`404 Not Found`**: Returned if the `updateFlashcard` service method does not find a matching flashcard for the given `id` and `user_id`. This correctly obscures whether the card doesn't exist or belongs to another user.
- **`500 Internal Server Error`**: Returned for any unexpected database errors or other server-side exceptions. A detailed error will be logged for debugging purposes.

## 7. Performance Considerations

- The database query is a simple indexed lookup (`PRIMARY KEY` on `id` and a likely index on `user_id`), so it should be highly performant.
- The payload size is small, so network latency is not a major concern.
- No significant performance bottlenecks are anticipated for this endpoint.

## 8. Implementation Steps

1.  **Create Zod Schema**: In `src/lib/schemas/flashcards.schemas.ts`, define and export `UpdateFlashcardDtoSchema` for validating the request body.
2.  **Update Service Layer**: In `src/lib/services/flashcards.service.ts`, add a new public method `updateFlashcard(command: { userId: string; flashcardId: string; data: UpdateFlashcardCommand }): Promise<Flashcard | null>`.
    - This method will use the Supabase client to run an `update` query on the `flashcards` table.
    - The query must use `.eq('id', flashcardId)` and `.eq('user_id', userId)`.
    - It should use `.select()` to return the updated record.
    - If the query returns data, the updated flashcard is returned; otherwise, `null` is returned.
3.  **Create API Route**: Create a new file at `src/pages/api/flashcards/[id].ts`.
4.  **Implement `PATCH` Handler**: In the new API route file, export an async function `PATCH({ params, request, context }: APIContext)`.
    - Ensure `export const prerender = false;` is set.
    - Get the `supabase` client and `user` from `context.locals`.
    - Validate the `id` from `params` is a UUID.
    - Parse and validate the request body using `UpdateFlashcardDtoSchema`.
    - Call `flashcardsService.updateFlashcard` with the required parameters.
    - If the service returns a flashcard, respond with `200 OK` and the `FlashcardDTO`.
    - If the service returns `null`, respond with `404 Not Found`.
    - Wrap the logic in a `try...catch` block to handle validation and server errors, returning appropriate `400` or `500` responses.
