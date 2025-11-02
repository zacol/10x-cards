# API Endpoint Implementation Plan: Delete Flashcard

## 1. Przegląd punktu końcowego

Ten punkt końcowy interfejsu API REST umożliwia uwierzytelnionym użytkownikom trwałe usunięcie jednej ze swoich fiszek. Usunięcie jest operacją nieodwracalną. Punkt końcowy zapewnia, że użytkownicy mogą usuwać tylko fiszki, których są właścicielami.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/flashcards/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator (UUID) fiszki do usunięcia.
    - `Authorization` (nagłówek): Token dostępu Bearer do uwierzytelnienia użytkownika (`Authorization: Bearer {access_token}`).
- **Request Body**: Brak.

## 3. Wykorzystywane typy

Implementacja nie wymaga tworzenia nowych typów DTO ani modeli. Do walidacji parametru `id` ze ścieżki URL zostanie użyta biblioteka Zod.

- **Walidacja ID fiszki**: `z.string().uuid()`

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Treść**: Brak.
- **Odpowiedzi błędów**:
  - **Kod stanu**: `400 Bad Request`
    - **Treść**: `{"error": "Invalid flashcard ID"}`
  - **Kod stanu**: `401 Unauthorized`
    - **Treść**: `{"error": "User is not authenticated"}`
  - **Kod stanu**: `404 Not Found`
    - **Treść**: `{"error": "Flashcard not found"}`
  - **Kod stanu**: `500 Internal Server Error`
    - **Treść**: `{"error": "An unexpected error occurred"}`

## 5. Przepływ danych

1. Użytkownik wysyła żądanie `DELETE` na adres `/api/flashcards/{id}` z prawidłowym tokenem uwierzytelniającym.
2. Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT i pobiera dane użytkownika z Supabase, a następnie umieszcza je w `context.locals.user`.
3. Handler endpointu (`src/pages/api/flashcards.ts`) jest wywoływany.
4. Handler sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
5. Handler waliduje parametr `{id}` przy użyciu Zod. Jeśli jest nieprawidłowy, zwraca `400 Bad Request`.
6. Handler wywołuje metodę `deleteFlashcard(id, userId)` z serwisu `FlashcardsService` (`src/lib/services/flashcards.service.ts`).
7. Metoda `deleteFlashcard` wykonuje zapytanie `DELETE` do tabeli `flashcards` w Supabase, używając warunków `WHERE id = {id}` AND `user_id = {userId}`.
8. Jeśli zapytanie w Supabase nie znajdzie pasującego rekordu (ponieważ fiszka nie istnieje lub nie należy do użytkownika), zwraca błąd, który jest przechwytywany w serwisie.
9. Serwis `FlashcardsService` zgłasza odpowiedni błąd (np. `FlashcardNotFound`), który jest obsługiwany w handlerze endpointu i mapowany na odpowiedź `404 Not Found`.
10. Jeśli usunięcie w bazie danych powiedzie się, handler endpointu zwraca odpowiedź `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wszystkie żądania do tego punktu końcowego muszą być uwierzytelnione za pomocą ważnego tokena JWT. Middleware jest odpowiedzialne za weryfikację sesji.
- **Autoryzacja**: Autoryzacja jest wymuszana na dwóch poziomach:
  1. **Poziom bazy danych**: Polityki Row-Level Security (RLS) w Supabase zapewniają, że operacje `DELETE` na tabeli `flashcards` mogą być wykonywane tylko przez właściciela rekordu (`auth.uid() = user_id`).
  2. **Poziom aplikacji**: Zapytanie `DELETE` w serwisie `FlashcardsService` będzie zawierać jawny warunek `WHERE user_id = {userId}`, co stanowi dodatkową warstwę ochrony.
- **Walidacja danych wejściowych**: Parametr `id` jest rygorystycznie walidowany jako UUID, aby zapobiec błędom zapytań i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK parametryzuje zapytania).
- **Zapobieganie wyliczaniu zasobów**: Punkt końcowy zwraca `404 Not Found` zarówno w przypadku, gdy fiszka nie istnieje, jak i gdy nie należy do użytkownika, aby uniemożliwić atakującym odgadnięcie istnienia zasobów.

## 7. Rozważania dotyczące wydajności

- Operacja `DELETE` na indeksowanym kluczu głównym (`id`) i kluczu obcym (`user_id`) jest wysoce wydajna w PostgreSQL.
- Oczekuje się minimalnego wpływu na wydajność, ponieważ operacja dotyczy pojedynczego rekordu.
- Należy upewnić się, że na kolumnie `user_id` w tabeli `flashcards` istnieje indeks, aby przyspieszyć wyszukiwanie w ramach autoryzacji.

## 8. Etapy wdrożenia

1.  **Aktualizacja serwisu**: W pliku `src/lib/services/flashcards.service.ts`:
    - Dodaj nową metodę asynchroniczną `deleteFlashcard(id: string, userId: string): Promise<{ error: any }>`.
    - Wewnątrz metody zaimplementuj logikę wywołania `supabase.from('flashcards').delete().match({ id, user_id: userId })`.
    - Dodaj obsługę błędów, w tym sprawdzanie, czy operacja faktycznie usunęła rekord. Jeśli nie, rzuć odpowiedni błąd (np. `FlashcardNotFound`).

2.  **Modyfikacja endpointu API**: W pliku `src/pages/api/flashcards.ts`:
    - W obiekcie `APIHandlers` dodaj nową metodę `DELETE`.
    - Zaimplementuj logikę handlera `DELETE: APIContext => Response`.
    - Sprawdź uwierzytelnienie użytkownika (`context.locals.session?.user`).
    - Zwaliduj parametr `id` z `context.params` za pomocą Zod.
    - Wywołaj metodę `flashcardsService.deleteFlashcard` z `id` i `userId`.
    - Obsłuż błędy zwrócone z serwisu i zwróć odpowiednie odpowiedzi HTTP (`404`, `500`).
    - W przypadku sukcesu zwróć `new Response(null, { status: 204 })`.

3.  **Testowanie (opcjonalne, ale zalecane)**:
    - Utwórz testy jednostkowe dla serwisu `FlashcardsService`, mockując klienta Supabase.
    - Utwórz testy integracyjne dla endpointu `DELETE /api/flashcards/{id}`, aby zweryfikować cały przepływ, w tym uwierzytelnianie, autoryzację i różne scenariusze błędów.
