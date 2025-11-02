# Plan implementacji widoku /library

## 1. Przegląd

Widok `/library` jest centralnym miejscem, w którym użytkownicy mogą przeglądać, filtrować i zarządzać swoimi fiszkami. Widok ma na celu wyświetlenie listy wszystkich fiszek użytkownika w formie siatki, z możliwością paginacji, sortowania i filtrowania. W przypadku braku fiszek, widok wyświetli pomocny komunikat ("empty state") z wezwaniem do działania.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/library`. Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowanego użytkownika, co zostanie zrealizowane poprzez użycie `ProtectedLayout.astro`.

## 3. Struktura komponentów

Komponenty zostaną zorganizowane w następującej hierarchii:

```
/src/pages/library.astro
└── layouts/ProtectedLayout.astro
    ├── components/Navbar.astro
    ├── components/library/LibraryFilters.tsx (React, client-side)
    ├── components/library/FlashcardList.tsx (React, client-side)
    │   ├── components/library/FlashcardCard.tsx (React, client-side)
    │   └── components/library/SkeletonCard.tsx (React, client-side)
    ├── components/library/PaginationControls.tsx (React, client-side)
    └── components/library/EmptyState.astro (Astro, static)
```

## 4. Szczegóły komponentów

### `library.astro` (Strona)

- **Opis**: Główny plik strony Astro, który integruje wszystkie komponenty widoku. Odpowiedzialny za pobranie początkowych danych po stronie serwera (SSR) i przekazanie ich do komponentów React.
- **Główne elementy**: `ProtectedLayout`, `LibraryFilters`, `FlashcardList`, `PaginationControls`, `EmptyState`.
- **Logika**: Wywołuje `flashcardService.getFlashcards` po stronie serwera, aby pobrać pierwszą stronę fiszek. Na podstawie odpowiedzi decyduje, czy renderować `FlashcardList` z danymi, czy `EmptyState`.
- **Propsy (do komponentów potomnych)**:
  - Do `FlashcardList`: `initialData: PaginatedResponse<FlashcardDTO>`
  - Do `LibraryFilters`: `initialFilters: LibraryFiltersViewModel`
  - Do `PaginationControls`: `initialPagination: PaginationMeta`

### `LibraryFilters.tsx`

- **Opis**: Komponent React do filtrowania i sortowania listy fiszek. Zarządza swoim stanem i komunikuje zmiany do komponentu nadrzędnego lub hooka.
- **Główne elementy**: `Select` (dla sortowania), `ToggleGroup` (dla filtrowania AI/Manual/All).
- **Obsługiwane interakcje**: Zmiana opcji sortowania, zmiana filtra `created_by_ai`.
- **Typy**: `LibraryFiltersViewModel`.
- **Propsy**: `onFilterChange: (filters: LibraryFiltersViewModel) => void`.

### `FlashcardList.tsx`

- **Opis**: Wyświetla siatkę fiszek lub szkielety UI podczas ładowania. Zarządza stanem listy fiszek i obsługuje logikę odświeżania danych oraz optymistycznego usuwania.
- **Główne elementy**: `div` (grid container), mapowanie po liście fiszek i renderowanie `FlashcardCard` lub `SkeletonCard`.
- **Obsługiwane interakcje**: Usuwanie fiszki (przekazane z `FlashcardCard`).
- **Typy**: `FlashcardDTO`, `PaginatedResponse<FlashcardDTO>`.
- **Propsy**: `initialData: PaginatedResponse<FlashcardDTO>`.

### `FlashcardCard.tsx`

- **Opis**: Reprezentuje pojedynczą fiszkę w siatce. Wyświetla awers, rewers, metadane i przyciski akcji.
- **Główne elementy**: `Card` (z shadcn/ui), `p` (dla tekstu), `Button` (dla akcji), `Badge` (dla statusu).
- **Obsługiwane interakcje**: Kliknięcie przycisku "Usuń", kliknięcie przycisku "Edytuj".
- **Typy**: `FlashcardDTO`.
- **Propsy**: `flashcard: FlashcardDTO`, `onDelete: (id: string) => void`.

### `PaginationControls.tsx`

- **Opis**: Komponent do nawigacji między stronami listy fiszek.
- **Główne elementy**: `Pagination` (z shadcn/ui) z przyciskami "Previous" i "Next" oraz numerami stron.
- **Obsługiwane interakcje**: Kliknięcie na numer strony, przycisk "Previous" lub "Next".
- **Typy**: `PaginationMeta`.
- **Propsy**: `pagination: PaginationMeta`, `onPageChange: (page: number) => void`.

### `EmptyState.astro`

- **Opis**: Komponent wyświetlany, gdy użytkownik nie ma żadnych fiszek. Zawiera grafikę i wezwania do działania.
- **Główne elementy**: Ilustracja (SVG lub `Image`), `h2` (nagłówek), `p` (opis), `Button` (linki do generatora AI i manualnego dodawania).

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy z `src/types.ts` oraz zdefiniowane zostaną nowe typy ViewModel.

- **`FlashcardDTO`**: (istniejący) Główny obiekt danych dla fiszki.
- **`PaginatedResponse<FlashcardDTO>`**: (istniejący) Struktura odpowiedzi z API zawierająca `data` i `pagination`.
- **`PaginationMeta`**: (istniejący) Metadane paginacji.

- **`LibraryFiltersViewModel` (nowy)**: Obiekt stanu dla filtrów w UI.

  ```typescript
  export interface LibraryFiltersViewModel {
    sort: "created_at" | "updated_at" | "due_date";
    order: "asc" | "desc";
    createdByAi: "all" | "ai" | "manual"; // 'true'/'false' mapowane na 'ai'/'manual'
  }
  ```

- **`LibraryStateViewModel` (nowy)**: Główny obiekt stanu zarządzany przez custom hook.
  ```typescript
  export interface LibraryStateViewModel {
    flashcards: FlashcardDTO[];
    pagination: PaginationMeta;
    filters: LibraryFiltersViewModel;
    status: "idle" | "loading" | "success" | "error";
    error: string | null;
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem po stronie klienta zostanie scentralizowane w custom hooku `useLibraryState.ts`.

### `useLibraryState.ts`

- **Cel**: Abstrakcja logiki pobierania danych, paginacji, filtrowania i optymistycznego usuwania.
- **Stan wewnętrzny**: Będzie zarządzał obiektem `LibraryStateViewModel`.
- **Funkcje eksportowane**:
  - `state: LibraryStateViewModel`: Aktualny stan widoku.
  - `setFilters: (newFilters: Partial<LibraryFiltersViewModel>) => void`: Aktualizuje filtry i wywołuje ponowne pobranie danych.
  - `setPage: (page: number) => void`: Zmienia stronę i wywołuje ponowne pobranie danych.
  - `deleteFlashcard: (id: string) => Promise<void>`: Implementuje optymistyczne usunięcie z możliwością cofnięcia.
- **Logika**: Hook będzie korzystał z `URLSearchParams` do synchronizacji stanu filtrów i paginacji z adresem URL, co zapewni spójność i możliwość udostępniania linków.

## 7. Integracja API

Integracja z backendem będzie opierać się na dwóch głównych endpointach:

1.  **`GET /api/flashcards`**
    - **Cel**: Pobieranie listy fiszek.
    - **Typ żądania**: Parametry query string (`limit`, `offset`, `sort`, `order`, `created_by_ai`). Hook `useLibraryState` będzie mapował `LibraryFiltersViewModel` na te parametry.
    - **Typ odpowiedzi**: `PaginatedResponse<FlashcardDTO>`.

2.  **`DELETE /api/flashcards/{id}`**
    - **Cel**: Usunięcie fiszki.
    - **Typ żądania**: `id` fiszki w ścieżce URL.
    - **Typ odpowiedzi**: `204 No Content`.

Wywołania API będą realizowane za pomocą standardowej funkcji `fetch` opakowanej w helper, który automatycznie dołączy nagłówek autoryzacji i obsłuży błędy.

## 8. Interakcje użytkownika

- **Filtrowanie/Sortowanie**: Użytkownik zmienia wartość w `LibraryFilters`. Wywoływana jest funkcja `setFilters` z hooka, stan URL jest aktualizowany, a dane są pobierane z API z nowymi parametrami.
- **Zmiana strony**: Użytkownik klika na `PaginationControls`. Wywoływana jest funkcja `setPage`, stan URL jest aktualizowany, a dane dla nowej strony są pobierane.
- **Usuwanie fiszki**: Użytkownik klika przycisk "Usuń" na `FlashcardCard`. Wywoływana jest funkcja `deleteFlashcard` z hooka. Fiszka jest natychmiast usuwana z UI (optymistycznie), a w tle wysyłane jest żądanie `DELETE` do API. Pojawia się toast z opcją "Undo". Jeśli użytkownik kliknie "Undo" w ciągu 5 sekund, żądanie API jest anulowane (jeśli to możliwe) lub fiszka jest przywracana do stanu. Jeśli wystąpi błąd API, fiszka wraca na listę, a użytkownik widzi komunikat o błędzie.

## 9. Warunki i walidacja

- **Dostęp do widoku**: Chroniony przez `ProtectedLayout`, który przekieruje niezalogowanych użytkowników na stronę logowania.
- **Pusty stan**: Strona `library.astro` sprawdza, czy `initialData.pagination.total === 0`. Jeśli tak, renderuje `EmptyState.astro` zamiast listy.
- **Stan ładowania**: Hook `useLibraryState` zarządza statusem `loading`. Gdy status jest aktywny, `FlashcardList` wyświetla komponenty `SkeletonCard` zamiast `FlashcardCard`.

## 10. Obsługa błędów

- **Błąd pobierania danych**: Jeśli wywołanie `GET /api/flashcards` zakończy się niepowodzeniem, hook `useLibraryState` ustawi status na `error` i zapisze komunikat błędu. UI wyświetli stosowny komunikat (np. toast lub informację w miejscu listy).
- **Błąd usuwania**: Jeśli żądanie `DELETE` się nie powiedzie, optymistyczna zmiana zostanie cofnięta, a użytkownik zobaczy toast z informacją o niepowodzeniu operacji.
- **Brak wyników po filtracji**: Jeśli po zastosowaniu filtrów lista wyników jest pusta, `FlashcardList` wyświetli komunikat w stylu "Brak wyników spełniających kryteria" zamiast `EmptyState`, ponieważ fiszki jako takie istnieją.

## 11. Kroki implementacji

1.  **Struktura plików**: Utworzyć foldery i puste pliki dla nowych komponentów w `src/components/library/`.
2.  **Typy i Hook**: Zdefiniować typy `LibraryFiltersViewModel` i `LibraryStateViewModel` w `src/types.ts`. Zaimplementować szkielet hooka `useLibraryState.ts`.
3.  **Komponenty statyczne**: Zaimplementować `EmptyState.astro` i `SkeletonCard.tsx` zgodnie z designem.
4.  **Komponenty UI**: Zaimplementować `LibraryFilters.tsx`, `FlashcardCard.tsx` i `PaginationControls.tsx`, początkowo z mockowymi danymi i handlerami zdarzeń.
5.  **Główny komponent listy**: Zaimplementować `FlashcardList.tsx`, integrując go z hookiem `useLibraryState` w celu zarządzania stanem ładowania i wyświetlania fiszek.
6.  **Strona Astro**: Zbudować stronę `library.astro`, zaimplementować logikę pobierania danych po stronie serwera i przekazać `initialData` do `FlashcardList`.
7.  **Integracja API**: W pełni zaimplementować logikę pobierania danych i paginacji w `useLibraryState`, podłączając rzeczywiste wywołania `fetch` do `GET /api/flashcards`.
8.  **Funkcjonalność usuwania**: Dodać logikę optymistycznego usuwania do `useLibraryState` i podłączyć ją do przycisku w `FlashcardCard.tsx`. Zintegrować z systemem toastów dla opcji "Undo".
9.  **Synchronizacja z URL**: Dodać do `useLibraryState` logikę odczytu i zapisu stanu filtrów/paginacji do parametrów URL (`URLSearchParams`).
10. **Styling i Finalizacja**: Dopracować style wszystkich komponentów, upewnić się, że siatka jest responsywna, a wszystkie stany (ładowanie, błąd, pusty) są poprawnie obsługiwane wizualnie.
11. **Testowanie**: Przeprowadzić manualne testy wszystkich interakcji, przypadków brzegowych i responsywności.
