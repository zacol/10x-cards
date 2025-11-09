# API Endpoint Implementation Plan: Get Due Flashcards

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /api/flashcards/due` REST API endpoint. Its purpose is to retrieve a list of flashcards that are currently due for review for the authenticated user, based on the SM-2 spaced repetition algorithm's `due_date` field. The endpoint also returns the total count of all due flashcards, which can be used for UI elements like notification badges.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/flashcards/due`
- **Headers**:
  - `Authorization: Bearer {access_token}` (Handled by Astro middleware)
- **Query Parameters**:
  - **Optional**: `limit`
    - **Description**: The maximum number of flashcard records to return.
    - **Type**: `integer`
    - **Default**: `20`
    - **Constraints**: Must be between `1` and `100`.

## 3. Types to be Used
- **`GetDueFlashcardsQuery` (Zod Schema)**: To validate and parse the `limit` query parameter.
  ```typescript
  import { z } from 'zod';

  export const GetDueFlashcardsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });
  ```
- **`FlashcardDueDto` (Interface/Type)**: To define the structure of flashcard objects in the response. This will be added to `src/types.ts`.
  ```typescript
  export interface FlashcardDueDto {
    id: string;
    front: string;
    back: string;
    repetition: number;
    interval: number;
    efactor: number;
    due_date: string;
  }
  ```
- **`GetDueFlashcardsResponse` (Interface/Type)**: To define the final response payload structure. This will be added to `src/types.ts`.
  ```typescript
  export interface GetDueFlashcardsResponse {
    data: FlashcardDueDto[];
    total_due: number;
  }
  ```

## 4. Response Details
- **Success (200 OK)**: Returned when the request is successful.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "What is the capital of France?",
        "back": "Paris",
        "repetition": 2,
        "interval": 3,
        "efactor": 2.6,
        "due_date": "2024-01-03T00:00:00Z"
      }
    ],
    "total_due": 15
  }
  ```
- **Error (4xx/5xx)**: See the Error Handling section for details on different error codes.

## 5. Data Flow
1. A `GET` request is sent to `/api/flashcards/due`.
2. Astro's routing invokes the corresponding API route file (`src/pages/api/flashcards/due.ts`).
3. The authentication middleware runs, validating the user's session from the `access_token`. If invalid, it returns a `401 Unauthorized` response. If valid, it attaches the user's session info to `Astro.locals`.
4. The API route handler parses the `limit` query parameter using the `GetDueFlashcardsQuery` Zod schema. If validation fails, a `400 Bad Request` response is returned.
5. The handler calls the `FlashcardService.getDueFlashcards` method, passing the `userId` from `Astro.locals` and the validated `limit`.
6. The `FlashcardService` executes two parallel queries against the Supabase `flashcards` table:
   a. **Count Query**: `SELECT COUNT(*) FROM flashcards WHERE user_id = :userId AND due_date <= NOW()`.
   b. **Data Query**: `SELECT id, front, back, repetition, interval, efactor, due_date FROM flashcards WHERE user_id = :userId AND due_date <= NOW() ORDER BY due_date ASC LIMIT :limit`.
7. The service method returns an object containing the list of flashcards (`data`) and the total count (`total_due`).
8. The API route handler receives the data from the service and constructs the final `200 OK` JSON response.

## 6. Security Considerations
- **Authentication**: The endpoint is protected. All access must be authenticated. Astro middleware will verify the JWT `access_token` and extract the user session.
- **Authorization**: Data access is segregated per user. All database queries **must** include a `WHERE user_id = :userId` clause to ensure users can only access their own flashcards. This will be reinforced by Supabase's Row Level Security (RLS) policies.
- **Input Validation**: The `limit` parameter will be strictly validated to prevent potential abuse (e.g., requesting an extremely large number of records) and ensure it's a valid integer.

## 7. Error Handling
- **`400 Bad Request`**:
  - **Trigger**: The `limit` query parameter is invalid (e.g., not a number, less than 1, or greater than 100).
  - **Response**: A JSON object with an error message explaining the validation failure.
- **`401 Unauthorized`**:
  - **Trigger**: The request lacks a valid `access_token`, or the token is expired/invalid.
  - **Response**: Handled by the authentication middleware, typically with a `{ "message": "Unauthorized" }` body.
- **`500 Internal Server Error`**:
  - **Trigger**: A database query fails, or any other unexpected exception occurs on the server.
  - **Response**: A generic JSON error message. The detailed error will be logged on the server for debugging.

## 8. Performance Considerations
- **Database Indexing**: To ensure fast query performance, an index should exist on the `flashcards` table for the `(user_id, due_date)` columns. This will significantly speed up filtering and sorting.
- **Parallel Queries**: The query for the total count and the query for the data will be executed in parallel (e.g., using `Promise.all`) to minimize latency.
- **Pagination**: While this endpoint only implements a `limit`, it's designed with future pagination in mind. The separation of total count from the data list is a key part of this.

## 9. Implementation Steps
1.  **Update Types**: Add the `FlashcardDueDto` and `GetDueFlashcardsResponse` interfaces to `src/types.ts`.
2.  **Create Zod Schema**: Create a new file `src/lib/schemas/flashcard.schemas.ts` (if not existing) and add the `GetDueFlashcardsQuery`.
3.  **Create Service**: Create a new file `src/lib/services/flashcard.service.ts`.
    - Implement a `FlashcardService` class.
    - Add a static method `getDueFlashcards(userId: string, limit: number)`.
    - Inside this method, implement the two Supabase queries (count and data fetch) using `Promise.all`.
    - The method should return an object matching the `GetDueFlashcardsResponse` type.
4.  **Create API Route**: Create the API route file at `src/pages/api/flashcards/due.ts`.
    - Use `Astro.locals` to get the authenticated user's ID. Return 401 if not available.
    - Use the `GetDueFlashcardsQuery` to parse and validate `Astro.url.searchParams`. Return 400 on failure.
    - Call the `FlashcardService.getDueFlashcards` method with the user ID and validated limit.
    - Wrap the service call in a `try...catch` block to handle potential server errors and return a 500 response.
    - On success, return a `200 OK` JSON response with the data from the service.
5.  **Add Database Index**: Create a new SQL migration file in `supabase/migrations/` to add a composite index on the `flashcards` table.
    ```sql
    CREATE INDEX IF NOT EXISTS idx_flashcards_user_due_date ON public.flashcards (user_id, due_date);
    ```
6.  **Testing**: Write integration tests to verify:
    - Correct data is returned for an authenticated user.
    - An empty array is returned when no cards are due.
    - The `total_due` count is accurate.
    - The `limit` parameter works correctly.
    - A `401` is returned for unauthenticated requests.
    - A `400` is returned for invalid `limit` values.
