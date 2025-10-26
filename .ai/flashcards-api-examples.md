# Flashcards API - Przykłady użycia

## POST /api/flashcards

Tworzy nową fiszkę dla zalogowanego użytkownika.

### Request

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "front": "What is TypeScript?",
    "back": "TypeScript is a strongly typed programming language that builds on JavaScript."
  }'
```

### Successful Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "front": "What is TypeScript?",
  "back": "TypeScript is a strongly typed programming language that builds on JavaScript.",
  "created_by_ai": false,
  "generation_id": null,
  "repetition": 0,
  "interval": 0,
  "efactor": 2.5,
  "due_date": "2025-10-26T16:54:00.000Z",
  "created_at": "2025-10-26T16:54:00.000Z",
  "updated_at": "2025-10-26T16:54:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized (brak tokenu)

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Unauthenticated"
  }
}
```

#### 400 Bad Request (walidacja front - za długi)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "_errors": [],
      "front": {
        "_errors": ["Front cannot exceed 200 characters"]
      }
    }
  }
}
```

#### 400 Bad Request (walidacja back - puste)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "_errors": [],
      "back": {
        "_errors": ["Back is required"]
      }
    }
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to create flashcard"
  }
}
```

## Testowanie z Supabase Auth

### 1. Utwórz użytkownika (jeśli nie istnieje)

```bash
curl -X POST https://YOUR_SUPABASE_URL/auth/v1/signup \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Zaloguj się i pobierz token

```bash
curl -X POST https://YOUR_SUPABASE_URL/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Odpowiedź zawiera `access_token`, który należy użyć w nagłówku `Authorization: Bearer`.

### 3. Użyj tokenu w żądaniu

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "front": "Test question",
    "back": "Test answer"
  }'
```

## Edge Cases do przetestowania

1. ✅ Front dokładnie 200 znaków (maksimum)
2. ✅ Back dokładnie 400 znaków (maksimum)
3. ✅ Front i back z 1 znakiem (minimum)
4. ❌ Front pusty string
5. ❌ Back pusty string
6. ❌ Front 201 znaków (przekroczenie limitu)
7. ❌ Back 401 znaków (przekroczenie limitu)
8. ❌ Brak pola front w body
9. ❌ Brak pola back w body
10. ❌ Nieprawidłowy JSON
11. ❌ Brak tokenu autentykacji
12. ❌ Nieprawidłowy token autentykacji
13. ✅ Znaki specjalne w treści (emoji, unicode)
14. ✅ HTML w treści (powinno być traktowane jako tekst)
