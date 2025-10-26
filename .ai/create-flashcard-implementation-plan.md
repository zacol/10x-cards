# API Endpoint Implementation Plan: Create Flashcard

## 1. Endpoint Overview
Create a new flashcard for the authenticated user. Supports only manual creation; AI-generated cards are handled elsewhere.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL**: `/api/flashcards`
- **Headers**:
  - `Authorization: Bearer <access_token>` – Supabase JWT
  - `Content-Type: application/json`
- **Body (JSON)**
```json
{
  "front": "string (1 – 200 chars)",
  "back": "string (1 – 400 chars)"
}
```
- **Required parameters**: `front`, `back`
- **Optional parameters**: none

## 3. Data Types
- **FlashcardCreateRequestDTO**
```ts
{
  front: string;
  back: string;
}
```
- **CreateFlashcardCommand** (internal)
```ts
{
  userId: string;
  front: string;
  back: string;
}
```
- **FlashcardResponseDTO** (mirrors `public.flashcards.Row`)

## 4. Response Details
- **201 Created**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "front": "...",
  "back": "...",
  "created_by_ai": false,
  "generation_id": null,
  "repetition": 0,
  "interval": 0,
  "efactor": 2.5,
  "due_date": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```
- **Error Codes**
  - 400 Bad Request – validation errors
  - 401 Unauthorized – missing/invalid token
  - 500 Server Error – unexpected failure

## 5. Data Flow
1. **Request** hits `src/pages/api/flashcards.ts` (Astro endpoint).
2. Extract Supabase client: `const { supabase, user } = Astro.locals`.
3. Verify `user`; if absent → 401.
4. Parse & validate body with `flashcardCreateSchema` (zod).
5. Build `CreateFlashcardCommand` and pass to `FlashcardsService.create()`.
6. Service executes `supabase.from('flashcards').insert({...}).select('*').single()`.
7. On success ⇒ return 201 with row as `FlashcardResponseDTO`.
8. On error ⇒ map Supabase error to 500 and log.

## 6. Security Considerations
- **Auth**: Supabase JWT via cookies/header; rely on `Astro.locals.user`.
- **RLS**: DB policies ensure row isolation; include `user_id` in insert.
- **Validation**: reject over-length or empty strings early.
- **Rate limiting** (future): integrate middleware to throttle abusive clients.

## 7. Error Handling
| Scenario | HTTP | Message |
|----------|------|---------|
| Missing token | 401 | `Unauthenticated` |
| Invalid body shape | 400 | zod error details |
| DB insert failure | 500 | `Unable to create flashcard` |

Errors are logged with request id & user id; severe errors forwarded to Sentry.

## 8. Performance Considerations
- Insert is single-row & indexed on `user_id`; negligible impact.
- Keep response body minimal (single record) to reduce payload.
- Future batching (bulk create) could be added if needed.

## 9. Implementation Steps
1. **Types**
   - Append DTOs to `src/types.ts`.
2. **Validation Schema** `src/pages/api/flashcards.schema.ts`
```ts
import { z } from 'zod';
export const flashcardCreateSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(400),
});
```
3. **Service** `src/lib/services/flashcards.service.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { TablesInsert } from '@/db/database.types';
export class FlashcardsService {
  static async create(cmd: CreateFlashcardCommand, client: SupabaseClient) {
    const payload: TablesInsert<'flashcards'> = {
    //   user_id: cmd.userId,
      front: cmd.front,
      back: cmd.back,
      created_by_ai: false,
    };
    const { data, error } = await client.from('flashcards').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  }
}
```
4. **API Route** `src/pages/api/flashcards.ts`
```ts
import { flashcardCreateSchema } from './flashcards.schema';
import { FlashcardsService } from '@/lib/services/flashcards.service';
export const prerender = false;
export async function POST(context) {
  const { supabase, user } = context.locals;
  if (!user) return new Response('Unauthenticated', { status: 401 });
  const body = await context.request.json();
  const parsed = flashcardCreateSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error), { status: 400 });
  try {
    const flashcard = await FlashcardsService.create({ ...parsed.data, userId: user.id }, supabase);
    return new Response(JSON.stringify(flashcard), { status: 201 });
  } catch (e) {
    console.error('Create flashcard failed', e);
    return new Response('Unable to create flashcard', { status: 500 });
  }
}
```
5. **Middleware**: ensure auth & rate-limit (optional).
6. **Unit Tests**: zod schema, service, API route using mocked Supabase.
7. **Documentation**: link this plan in project wiki.
8. **Review & Merge** via pull request.
