# API Endpoint Implementation Plan: Get Single Flashcard

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest pobranie szczegółów pojedynczej fiszki na podstawie jej unikalnego identyfikatora (`id`). Punkt końcowy musi zapewnić, że tylko właściciel fiszki może uzyskać do niej dostęp, co jest kluczowym wymogiem bezpieczeństwa.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/flashcards/{id}`
- **Parametry**:
  - **Wymagane**: `id` (parametr ścieżki) - unikalny identyfikator fiszki w formacie UUID.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **`Flashcard`**: Typ encji reprezentujący strukturę danych fiszki, zgodny z tabelą `flashcards` w bazie danych. Zdefiniowany w `src/types.ts`.
- **`GetFlashcardParams`**: Schemat Zod do walidacji parametru `id` ze ścieżki URL. Zapewni, że `id` jest poprawnym ciągiem znaków w formacie UUID.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON z pełnymi danymi fiszki, zgodnie z typem `Flashcard`.

  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
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
  ```

- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli `id` nie jest prawidłowym UUID.
  - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Jeśli fiszka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do punktu końcowego Astro `/api/flashcards/[id].ts`.
2.  Middleware Astro weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`.
3.  Handler API weryfikuje parametr `id` przy użyciu schematu Zod `GetFlashcardParams`.
4.  Jeśli walidacja `id` nie powiedzie się, zwracany jest błąd `400 Bad Request`.
5.  Handler wywołuje funkcję `getFlashcardById(id, userId, supabase)` z serwisu `flashcards.service.ts`.
6.  Funkcja serwisowa wykonuje zapytanie do bazy danych Supabase, aby pobrać fiszkę z tabeli `flashcards`, używając klauzuli `WHERE`, aby dopasować zarówno `id`, jak i `user_id`.
7.  Jeśli zapytanie nie zwróci żadnych wyników, serwis zwraca `null`, a handler API odpowiada `404 Not Found`.
8.  Jeśli zapytanie się powiedzie, funkcja serwisowa zwraca pełny obiekt fiszki.
9.  Handler API zwraca obiekt fiszki w odpowiedzi JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony przez middleware Astro, który weryfikuje token JWT i udostępnia sesję użytkownika oraz klienta Supabase w `context.locals`.
- **Autoryzacja**: Kluczowym elementem jest zapewnienie, że użytkownicy mogą pobierać tylko własne fiszki. Zapytanie do bazy danych musi zawierać warunek `eq('user_id', userId)`, aby zapobiec nieautoryzowanemu dostępowi do danych innych użytkowników.
- **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom (np. SQL injection, chociaż Supabase ORM zapewnia ochronę).

## 7. Rozważania dotyczące wydajności

- Zapytanie do bazy danych jest proste i wykorzystuje klucz główny (`id`) oraz indeksowany klucz obcy (`user_id`), co zapewnia wysoką wydajność. Nie przewiduje się wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 8. Etapy wdrożenia

1.  **Aktualizacja serwisu fiszek**:
    - W pliku `src/lib/services/flashcards.service.ts` utwórz nową funkcję asynchroniczną `getFlashcardById(id: string, userId: string, client: SupabaseClient): Promise<Flashcard | null>`.
    - Implementacja powinna wykonywać zapytanie `SELECT` do tabeli `flashcards` z warunkami `id` i `user_id`.
    - Użyj `.single()` do pobrania pojedynczego rekordu.
    - W przypadku błędu zapytania, rzuć błąd. Jeśli nie znaleziono rekordu, zwróć `null`.

2.  **Utworzenie schematu walidacji Zod**:
    - W pliku `src/lib/schemas/flashcard.schema.ts` dodaj nowy schemat `GetFlashcardParams`.
    - Schemat powinien definiować `id` jako `z.string().uuid()`.

3.  **Implementacja punktu końcowego API**:
    - Utwórz nowy plik `src/pages/api/flashcards/[id].ts`.
    - Zdefiniuj `export const prerender = false;`.
    - Zaimplementuj handler `GET({ params, locals }: APIContext)`.
    - Pobierz `supabase` i `session` z `locals`.
    - Sprawdź, czy sesja istnieje; jeśli nie, zwróć `401 Unauthorized`.
    - Sparsuj i zwaliduj `params` przy użyciu schematu `GetFlashcardParams`.
    - W przypadku błędu walidacji zwróć `400 Bad Request` z informacjami o błędach Zod.
    - Wywołaj funkcję `getFlashcardById` z serwisu, przekazując `id` z parametrów oraz `userId` z sesji.
    - Jeśli funkcja zwróci `null`, odpowiedz `404 Not Found`.
    - Jeśli funkcja zwróci fiszkę, odpowiedz `200 OK` z obiektem fiszki w formacie JSON.
    - Dodaj obsługę błędów `try...catch` do przechwytywania błędów z serwisu i zwracania `500 Internal Server Error`.
