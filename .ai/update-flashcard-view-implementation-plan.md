# Plan implementacji widoku: Edycja Fiszki

## 1. Przegląd

Celem jest implementacja funkcjonalności edycji istniejącej fiszki przez użytkownika. Proces ten będzie realizowany za pomocą okna modalnego (`EditFlashcardModal`), które pojawi się w widoku `/library` po kliknięciu przycisku "Edit" przy wybranej fiszce. Modal będzie zawierał formularz z aktualną treścią awersu i rewersu, umożliwiając użytkownikowi ich modyfikację i zapisanie zmian poprzez wywołanie odpowiedniego endpointu API.

## 2. Routing widoku

Funkcjonalność będzie zintegrowana z istniejącym widokiem biblioteki fiszek, dostępnym pod ścieżką:
- `/library`

## 3. Struktura komponentów

Komponenty będą zorganizowane w następującej hierarchii. Nowy komponent `EditFlashcardModal` zostanie dodany jako element podrzędny `LibraryView`, który zarządza stanem i logiką modala.

```
/src/pages/library.astro
└── /src/components/views/LibraryView.tsx (React Client Component)
    ├── FlashcardList.tsx (istniejący lub nowy komponent)
    │   └── FlashcardItem.tsx (z przyciskiem "Edit")
    └── /src/components/modals/EditFlashcardModal.tsx (Nowy komponent)
        ├── Shadcn Dialog
        └── EditFlashcardForm.tsx (Nowy komponent)
            ├── Shadcn Form
            ├── Shadcn Input (dla awersu)
            ├── Shadcn Textarea (dla rewersu)
            └── Shadcn Button (do zapisu)
```

## 4. Szczegóły komponentów

### EditFlashcardModal.tsx

- **Opis komponentu**: Główny komponent okna modalnego. Będzie renderował komponent `Dialog` z Shadcn/ui i zarządzał jego stanem (otwarty/zamknięty). Wewnątrz dialogu umieszczony zostanie formularz `EditFlashcardForm`.
- **Główne elementy**: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` z Shadcn/ui.
- **Obsługiwane interakcje**: Otwieranie i zamykanie modala.
- **Obsługiwana walidacja**: Brak (delegowana do formularza).
- **Typy**: `FlashcardDTO`.
- **Propsy**:
  - `isOpen: boolean`: Stan określający, czy modal jest widoczny.
  - `onOpenChange: (isOpen: boolean) => void`: Funkcja do zmiany stanu widoczności modala.
  - `flashcard: FlashcardDTO | null`: Obiekt fiszki do edycji lub `null`, jeśli żadna nie jest wybrana.
  - `onUpdate: (updatedFlashcard: FlashcardDTO) => void`: Callback wywoływany po pomyślnej aktualizacji fiszki.

### EditFlashcardForm.tsx

- **Opis komponentu**: Formularz do edycji treści fiszki, zbudowany z użyciem `react-hook-form` i komponentów `Form` z Shadcn/ui.
- **Główne elementy**: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Textarea`, `Button`.
- **Obsługiwane interakcje**: Wprowadzanie zmian w polach tekstowych, walidacja na bieżąco (on change/on blur), obsługa wysłania formularza (submit).
- **Obsługiwana walidacja**:
  - `front`: Pole wymagane, minimalna długość 1 znak, maksymalna długość 200 znaków.
  - `back`: Pole wymagane, minimalna długość 1 znak, maksymalna długość 400 znaków.
- **Typy**: `FlashcardDTO`, `UpdateFlashcardFormViewModel`.
- **Propsy**:
  - `flashcard: FlashcardDTO`: Obiekt fiszki do edycji (wymagany).
  - `onSuccess: (updatedFlashcard: FlashcardDTO) => void`: Callback wywoływany po pomyślnym zapisaniu zmian.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy oraz zdefiniowany zostanie nowy typ dla formularza.

- **`FlashcardDTO` (istniejący)**: Używany do przekazywania danych fiszki do modala i formularza oraz jako typ odpowiedzi z API.
  ```typescript
  export type FlashcardDTO = Omit<Flashcard, "user_id"> & {
    user_id?: Flashcard["user_id"];
  };
  ```
- **`UpdateFlashcardCommand` (istniejący)**: Typ danych wysyłanych w ciele żądania `PATCH`.
  ```typescript
  export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;
  ```
- **`UpdateFlashcardFormViewModel` (nowy)**: Typ definiujący strukturę danych formularza edycji. Zapewnia ścisłą walidację pól, które są wymagane w kontekście UI.
  ```typescript
  export interface UpdateFlashcardFormViewModel {
    front: string; // Walidacja: min(1), max(200)
    back: string;  // Walidacja: min(1), max(400)
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane na poziomie komponentu `LibraryView.tsx`.

- **`editingFlashcard: FlashcardDTO | null`**: Zmienna stanu przechowująca obiekt aktualnie edytowanej fiszki. Wartość `null` oznacza, że modal jest zamknięty.
- **`isModalOpen: boolean`**: Stan kontrolujący widoczność modala, synchronizowany z `editingFlashcard`.

Logika będzie następująca:
1.  Użytkownik klika "Edit" -> wywoływana jest funkcja `handleEditClick(flashcard)`.
2.  `handleEditClick` ustawia stan `setEditingFlashcard(flashcard)`, co powoduje otwarcie modala i przekazanie do niego danych fiszki.
3.  Gdy modal jest zamykany (przez przycisk, overlay), wywoływana jest funkcja `setEditingFlashcard(null)`.
4.  Po pomyślnej aktualizacji, callback `onUpdate` z modala przekazuje zaktualizowaną fiszkę. Komponent `LibraryView` aktualizuje swoją lokalną listę fiszek, aby natychmiastowo odzwierciedlić zmianę bez konieczności ponownego pobierania całej listy z serwera.

## 7. Integracja API

Integracja z backendem będzie polegać na wysłaniu żądania do zdefiniowanego endpointu.

- **Endpoint**: `PATCH /api/flashcards/{id}`
- **Metoda**: `PATCH`
- **Nagłówki**: `Authorization: Bearer {access_token}` (obsługiwane przez wrapper klienta API).
- **Typ żądania (Request Body)**: `UpdateFlashcardCommand`
  ```json
  {
    "front": "Nowa treść awersu",
    "back": "Nowa treść rewersu"
  }
  ```
- **Typ odpowiedzi (Success Response)**: `FlashcardDTO`

Logika wywołania API zostanie zaimplementowana wewnątrz funkcji `onSubmit` w komponencie `EditFlashcardForm.tsx`.

## 8. Interakcje użytkownika

1.  **Inicjacja edycji**: Użytkownik klika przycisk "Edit" na elemencie listy fiszek w `/library`.
2.  **Otwarcie modala**: Na ekranie pojawia się okno modalne z formularzem wypełnionym danymi klikniętej fiszki.
3.  **Edycja treści**: Użytkownik modyfikuje tekst w polach "Front" i/lub "Back". Walidacja (limity znaków) jest wyświetlana na bieżąco.
4.  **Zapisanie zmian**: Użytkownik klika przycisk "Save". Przycisk jest aktywny tylko wtedy, gdy formularz jest poprawny.
5.  **Zamknięcie modala i aktualizacja widoku**: Po pomyślnym zapisie modal zamyka się, a lista fiszek w tle odświeża się, pokazując zaktualizowaną treść.
6.  **Anulowanie edycji**: Użytkownik klika przycisk "Cancel", klawisz `Esc` lub obszar poza modalem. Modal zamyka się bez zapisywania zmian.

## 9. Warunki i walidacja

- **Przycisk "Save" w formularzu**: Będzie nieaktywny (`disabled`), jeśli:
  - Pole `front` jest puste lub przekracza 200 znaków.
  - Pole `back` jest puste lub przekracza 400 znaków.
  - Treść formularza nie zmieniła się w stosunku do oryginalnych danych fiszki.
- **Komunikaty walidacyjne**: Będą wyświetlane pod odpowiednimi polami formularza, informując o błędach (np. "Pole jest wymagane", "Treść jest zbyt długa").

## 10. Obsługa błędów

- **Błąd walidacji (400)**: Komunikaty o błędach z API (jeśli wystąpią) powinny być mapowane i wyświetlane pod odpowiednimi polami formularza.
- **Błąd autoryzacji (401/404)**: Jeśli API zwróci błąd `401 Unauthorized` lub `404 Not Found` (oznaczający brak uprawnień), użytkownik powinien zobaczyć ogólny komunikat błędu (np. w formie toastu) informujący, że "Nie udało się zaktualizować fiszki. Spróbuj ponownie.".
- **Błąd serwera (500)**: W przypadku błędu serwera, użytkownikowi zostanie wyświetlony generyczny komunikat błędu (toast) z informacją o problemie technicznym i prośbą o ponowną próbę.
- **Stan ładowania**: Podczas wysyłania żądania API, przycisk "Save" powinien być w stanie ładowania, aby zapobiec wielokrotnemu wysłaniu formularza.

## 11. Kroki implementacji

1.  **Utworzenie plików**: Stworzenie nowych plików: `/src/components/modals/EditFlashcardModal.tsx` oraz `/src/components/forms/EditFlashcardForm.tsx`.
2.  **Implementacja `EditFlashcardForm.tsx`**:
    - Zdefiniowanie schematu walidacji Zod dla `UpdateFlashcardFormViewModel`.
    - Zbudowanie struktury formularza przy użyciu komponentów Shadcn/ui (`Form`, `Input`, `Textarea`, `Button`).
    - Integracja z `react-hook-form` w celu zarządzania stanem formularza, walidacją i obsługą `onSubmit`.
    - Implementacja logiki wywołania API `PATCH /api/flashcards/{id}` wewnątrz `onSubmit`.
3.  **Implementacja `EditFlashcardModal.tsx`**:
    - Zbudowanie struktury modala przy użyciu komponentu `Dialog` z Shadcn/ui.
    - Umieszczenie `EditFlashcardForm` wewnątrz `DialogContent`.
    - Przekazanie propsów `flashcard` i `onSuccess` do formularza.
4.  **Integracja z `LibraryView.tsx`**:
    - Dodanie stanu `editingFlashcard` i `isModalOpen` do zarządzania modalem.
    - Zaimplementowanie funkcji `handleEditClick` i `handleUpdateSuccess`.
    - Wyrenderowanie `<EditFlashcardModal />` i przekazanie do niego wymaganych propsów.
    - Dodanie przycisku "Edit" do każdego elementu na liście fiszek i podpięcie do niego funkcji `handleEditClick`.
5.  **Obsługa błędów i stanu ładowania**: Dodanie obsługi błędów (np. za pomocą toastów) oraz wizualnego wskaźnika ładowania na przycisku zapisu.
6.  **Testowanie**: Ręczne przetestowanie całego przepływu: otwieranie modala, walidacja formularza, pomyślny zapis, anulowanie, obsługa błędów API.
