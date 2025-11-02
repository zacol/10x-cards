# API Endpoint Implementation Plan: List Flashcards

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest dostarczenie paginowanej, sortowalnej i filtrowalnej listy fiszek należących do uwierzytelnionego użytkownika. Umożliwi to klientom (np. interfejsowi webowemu) wyświetlanie biblioteki fiszek użytkownika w zorganizowany sposób.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/flashcards`
- **Parametry zapytania (Query)**:
  - **Wymagane**: Brak
  - **Opcjonalne**:
    - `limit` (number): Liczba elementów na stronę. Domyślnie: `50`, Maksymalnie: `100`.
    - `offset` (number): Liczba elementów do pominięcia. Domyślnie: `0`.
    - `sort` (string): Pole do sortowania. Dozwolone wartości: `"created_at"`, `"updated_at"`, `"due_date"`. Domyślnie: `"created_at"`.
    - `order` (string): Kierunek sortowania. Dozwolone wartości: `"asc"`, `"desc"`. Domyślnie: `"desc"`.
    - `created_by_ai` (boolean): Filtruj według fiszek wygenerowanych przez AI. Wartości: `"true"` lub `"false"`.
    - `generation_id` (string): Filtruj według konkretnego ID generacji (format UUID).
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **`GetFlashcardsQuery` (Nowy schemat Zod)**: Do walidacji i parsowania parametrów zapytania. Zapewni poprawne typy, wartości domyślne i ograniczenia (np. `limit <= 100`).
- **`FlashcardDTO` (Istniejący w `src/types.ts`)**: Obiekt transferu danych dla pojedynczej fiszki w odpowiedzi.
- **`PaginationMeta` (Istniejący w `src/types.ts`)**: Obiekt z metadanymi paginacji (`total`, `limit`, `offset`, `has_more`).
- **`PaginatedResponse<T>` (Nowy typ generyczny)**: Struktura odpowiedzi łącząca dane (`data: T[]`) z metadanymi paginacji (`pagination: PaginationMeta`).

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt `PaginatedResponse<FlashcardDTO>`.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "What is the capital of France?",
        "back": "Paris",
        "created_by_ai": false,
        "generation_id": null,
        "repetition": 2,
        "interval": 3,
        "efactor": 2.6,
        "due_date": "2024-01-05T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-03T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "has_more": true
    }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Błąd serwera podczas przetwarzania żądania.

## 5. Przepływ danych

1. Żądanie `GET` trafia do endpointu `/api/flashcards`.
2. Middleware Astro weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. Jeśli jest prawidłowy, dane użytkownika i klient Supabase są dostępne w `context.locals`.
3. Endpoint API parsuje i waliduje parametry zapytania przy użyciu schematu Zod `GetFlashcardsQuery`.
4. Endpoint wywołuje funkcję `getFlashcards(userId, query)` z nowego serwisu `flashcardService`.
5. `flashcardService` konstruuje dynamiczne zapytanie do Supabase, uwzględniając filtry (`user_id`, `created_by_ai`, `generation_id`) i opcje sortowania (`sort`, `order`).
6. Serwis wykonuje dwa zapytania do bazy danych:
   - Jedno do pobrania listy fiszek z `limit` i `offset`.
   - Drugie (`COUNT`) do uzyskania całkowitej liczby pasujących rekordów (`total`).
7. Serwis mapuje wyniki z bazy na `FlashcardDTO` i oblicza `has_more`.
8. Serwis zwraca obiekt `PaginatedResponse<FlashcardDTO>` do endpointu.
9. Endpoint zwraca odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony. Middleware Astro będzie odpowiedzialny za weryfikację tokena Bearer i zapewnienie, że tylko zalogowani użytkownicy mogą uzyskać dostęp.
- **Autoryzacja**: Każde zapytanie do bazy danych musi być ściśle ograniczone do danych zalogowanego użytkownika. Zostanie to osiągnięte przez:
  1. **Filtrowanie po `user_id`**: Serwis `flashcardService` jawnie doda warunek `where('user_id', '=', userId)` do każdego zapytania.
  2. **Row-Level Security (RLS)**: Polityka RLS w tabeli `flashcards` zapewni na poziomie bazy danych, że użytkownik może odczytywać (`SELECT`) tylko własne rekordy.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania będą rygorystycznie walidowane przy użyciu Zod, aby zapobiec atakom (np. SQL Injection, chociaż Supabase client parametryzuje zapytania) i zapewnić spójność danych.

## 7. Obsługa błędów

- **Błędy walidacji (400)**: Jeśli walidacja Zod nie powiedzie się, endpoint zwróci odpowiedź `400 Bad Request` z szczegółami błędu.
- **Błędy autoryzacji (401)**: Obsługiwane przez middleware Astro przed dotarciem żądania do logiki endpointu.
- **Błędy serwera (500)**: Wszelkie nieoczekiwane błędy (np. błąd połączenia z bazą danych) będą przechwytywane w bloku `try...catch`. Zostanie zalogowany szczegółowy błąd po stronie serwera, a do klienta zostanie wysłana generyczna odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- **Paginacja**: Kluczowa dla wydajności. Zapobiega ładowaniu tysięcy rekordów naraz. Maksymalny `limit` zostanie ustawiony na 100, aby uniknąć nadmiernego obciążenia.
- **Indeksowanie bazy danych**: Aby zapewnić szybkie wykonywanie zapytań, należy upewnić się, że następujące kolumny w tabeli `flashcards` są zindeksowane:
  - `user_id` (kluczowe dla filtrowania per użytkownik)
  - `created_at`, `updated_at`, `due_date` (używane do sortowania)
  - `generation_id` (używane do filtrowania)
- **Dwa zapytania**: Wykonanie osobnego zapytania `COUNT` jest standardową praktyką w paginacji opartej na offsecie i jest ogólnie wydajne, o ile kolumny w klauzuli `WHERE` są zindeksowane.

## 9. Etapy wdrożenia

1.  **Aktualizacja typów (`src/types.ts`)**:
    - Dodać generyczny typ `PaginatedResponse<T>`.

2.  **Utworzenie schematu walidacji (`src/lib/schemas/flashcard.schema.ts`)**:
    - Zdefiniować nowy plik i w nim schemat Zod `GetFlashcardsQuery` dla parametrów zapytania GET.

3.  **Implementacja serwisu (`src/lib/services/flashcardService.ts`)**:
    - Utworzyć nowy plik serwisu (jeśli nie istnieje).
    - Dodać funkcję `getFlashcards(userId: string, query: GetFlashcardsQuery, supabase: SupabaseClient): Promise<PaginatedResponse<FlashcardDTO>>`.
    - Zaimplementować w niej logikę budowania i wykonywania zapytań do Supabase.

4.  **Implementacja endpointu API (`src/pages/api/flashcards/index.astro` lub `.../flashcards.ts`)**:
    - Utworzyć plik dla endpointu `GET`.
    - Dodać `export const prerender = false;`.
    - Zaimplementować logikę `GET({ request, locals })`, która:
      - Pobiera parametry z `request.url`.
      - Waliduje je przy użyciu `GetFlashcardsQuery.safeParse()`.
      - Wywołuje serwis `flashcardService.getFlashcards()`.
      - Zwraca odpowiedź JSON lub błąd.

5.  **Weryfikacja polityk RLS**:
    - Sprawdzić w panelu Supabase, czy dla tabeli `flashcards` istnieje i jest włączona polityka RLS dla operacji `SELECT`, która ogranicza dostęp do rekordów właściciela.

6.  **Testowanie (manualne)**:
    - Przetestować endpoint przy użyciu narzędzia API (np. Postman, Insomnia) z różnymi kombinacjami parametrów (sortowanie, filtrowanie, paginacja), aby zweryfikować poprawność działania i obsługę błędów.
