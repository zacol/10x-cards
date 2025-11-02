# Plan implementacji widoku: Ręczne tworzenie fiszki

## 1. Przegląd
Celem jest wdrożenie funkcjonalności ręcznego tworzenia fiszek przez użytkownika. Proces ten będzie realizowany za pomocą modala z formularzem, dostępnego z poziomu widoku Biblioteki (`/library`). Po pomyślnym dodaniu nowej fiszki, lista w bibliotece zostanie dynamicznie zaktualizowana.

## 2. Routing widoku
Funkcjonalność będzie częścią istniejącego widoku Biblioteki, dostępnego pod ścieżką `/library`.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w istniejącej strukturze widoku `/library`. Hierarchia będzie wyglądać następująco:

```
src/pages/library.astro
└── src/components/library/CreateFlashcardModal.tsx (React)
    ├── src/components/ui/Dialog.tsx (Shadcn)
    ├── src/components/ui/Form.tsx (Shadcn)
    ├── src/components/ui/Input.tsx (Shadcn)
    ├── src/components/ui/Textarea.tsx (Shadcn)
    └── src/components/ui/Button.tsx (Shadcn)
```

## 4. Szczegóły komponentów

### CreateFlashcardModal.tsx

- **Opis komponentu**: Reaktywny komponent React, który renderuje modal (okno dialogowe) zawierający formularz do tworzenia nowej fiszki. Komponent zarządza stanem formularza, jego walidacją oraz komunikacją z API.
- **Główne elementy**: 
  - `Dialog`: Główny kontener modala z Shadcn/ui.
  - `DialogTrigger`: Przycisk otwierający modal, umieszczony w `library.astro`.
  - `DialogContent`: Zawartość modala, w tym nagłówek, formularz i przyciski akcji.
  - `Form`: Komponent formularza z `react-hook-form` i Shadcn/ui.
  - `FormField` z `Input` dla awersu (`front`).
  - `FormField` z `Textarea` dla rewersu (`back`).
  - `Button` typu `submit` do zapisu fiszki.
- **Obsługiwane interakcje**:
  - Otwarcie i zamknięcie modala.
  - Wprowadzanie tekstu w pola formularza.
  - Wysłanie formularza (submit).
- **Obsługiwana walidacja**:
  - **Awers (`front`)**: Pole wymagane, minimalna długość: 1 znak, maksymalna długość: 200 znaków.
  - **Rewers (`back`)**: Pole wymagane, minimalna długość: 1 znak, maksymalna długość: 400 znaków.
- **Typy**: 
  - `FlashcardCreateRequestDTO`: Do wysłania danych do API.
  - `Flashcard`: Do odbioru odpowiedzi z API i aktualizacji stanu nadrzędnego.
- **Propsy**:
  - `onFlashcardCreated: (newFlashcard: Flashcard) => void`: Funkcja zwrotna wywoływana po pomyślnym utworzeniu fiszki, przekazująca nowo utworzony obiekt do komponentu nadrzędnego w celu aktualizacji UI.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy. Nie ma potrzeby tworzenia nowych.

- **FlashcardCreateRequestDTO**: Obiekt transferu danych (DTO) wysyłany w ciele żądania `POST /api/flashcards`.
  ```typescript
  // src/types.ts
  export type FlashcardCreateRequestDTO = Pick<TablesInsert<"flashcards">, "front" | "back">;
  // Oznacza: { front: string; back: string; }
  ```
- **Flashcard**: Pełny obiekt fiszki, zgodny ze schematem bazy danych, zwracany przez API po pomyślnym utworzeniu.
  ```typescript
  // src/types.ts
  export type Flashcard = Tables<"flashcards">;
  ```

## 6. Zarządzanie stanem

- **Stan lokalny komponentu `CreateFlashcardModal`**: Do zarządzania stanem formularza (wartości pól, błędy walidacji, stan wysyłki) zostanie użyta biblioteka `react-hook-form` wraz z `zod` do walidacji schematu. Stan otwarcia/zamknięcia modala (`isOpen`) będzie zarządzany za pomocą hooka `useState`.
- **Stan globalny/nadrzędny**: Widok `/library` będzie odpowiedzialny za przechowywanie listy fiszek. Po pomyślnym utworzeniu nowej fiszki, komponent `CreateFlashcardModal` wywoła przekazaną w propsach funkcję `onFlashcardCreated`, przekazując nowy obiekt fiszki. Komponent nadrzędny (lub hook zarządzający stanem biblioteki) doda ją do istniejącej listy, co spowoduje odświeżenie interfejsu bez przeładowania strony.

## 7. Integracja API

- **Endpoint**: `POST /api/flashcards`
- **Proces**: 
  1. Po walidacji i wysłaniu formularza, komponent `CreateFlashcardModal` wykonuje żądanie `POST` pod adres `/api/flashcards`.
  2. W ciele żądania (`body`) przesyłany jest obiekt typu `FlashcardCreateRequestDTO`.
  3. Nagłówek `Content-Type` musi mieć wartość `application/json`.
  4. W przypadku sukcesu (status `201 Created`), odpowiedź API (obiekt `Flashcard`) jest przekazywana do funkcji `onFlashcardCreated`.
  5. W przypadku błędu walidacji (status `400`) lub błędu serwera (status `500`), użytkownikowi wyświetlany jest odpowiedni komunikat (np. za pomocą `Toast` z Shadcn/ui).

## 8. Interakcje użytkownika

1. **Użytkownik klika przycisk "Add flashcard manually" w widoku `/library`** -> Otwiera się modal `CreateFlashcardModal`.
2. **Użytkownik wypełnia pola "Front" i "Back"** -> Dane są walidowane na bieżąco; komunikaty o błędach (np. przekroczenie limitu znaków) są wyświetlane pod odpowiednimi polami.
3. **Użytkownik klika przycisk "Zapisz"**:
   - **Scenariusz pomyślny**: Żądanie do API kończy się sukcesem. Modal zamyka się, a nowa fiszka natychmiast pojawia się na górze listy w bibliotece. Wyświetlany jest komunikat o sukcesie (toast).
   - **Scenariusz błędny**: Żądanie do API kończy się błędem. Modal pozostaje otwarty, a użytkownik widzi komunikat o błędzie (np. "Nie udało się dodać fiszki. Spróbuj ponownie.").

## 9. Warunki i walidacja

Walidacja będzie realizowana po stronie klienta za pomocą `zod` i `react-hook-form` w komponencie `CreateFlashcardModal`, aby zapewnić natychmiastowy feedback dla użytkownika i odzwierciedlić reguły zaimplementowane na backendzie.

- **Schemat walidacji (Zod)**:
  ```typescript
  import { z } from 'zod';

  const createFlashcardSchema = z.object({
    front: z.string().min(1, 'Awers jest wymagany.').max(200, 'Awers może mieć maksymalnie 200 znaków.'),
    back: z.string().min(1, 'Rewers jest wymagany.').max(400, 'Rewers może mieć maksymalnie 400 znaków.'),
  });
  ```
- **Stan interfejsu**: Przycisk "Zapisz" w formularzu będzie nieaktywny (`disabled`), dopóki formularz nie będzie poprawnie zwalidowany.

## 10. Obsługa błędów

- **Błędy walidacji**: Obsługiwane przez `react-hook-form` i wyświetlane jako komunikaty pod polami formularza.
- **Błędy API (`4xx`, `5xx`)**: Po otrzymaniu odpowiedzi o błędzie z API, w modalu zostanie wyświetlony ogólny komunikat błędu (np. przy użyciu komponentu `Toast`). Logowanie szczegółów błędu do konsoli deweloperskiej.
- **Błędy sieciowe**: Obsługiwane w bloku `catch` wywołania `fetch`, informując użytkownika o problemie z połączeniem.

## 11. Kroki implementacji

1. **Utworzenie pliku komponentu**: Stworzyć plik `src/components/library/CreateFlashcardModal.tsx`.
2. **Implementacja struktury komponentu**: Zaimplementować podstawową strukturę komponentu z użyciem `Dialog` z Shadcn/ui i hooka `useState` do zarządzania jego widocznością.
3. **Budowa formularza**: Dodać formularz oparty na `react-hook-form`, `zod` i `zodResolver`. Zdefiniować pola `front` i `back` z odpowiednimi komponentami `Input` i `Textarea`.
4. **Implementacja walidacji**: Stworzyć schemat `zod` dla formularza i zintegrować go z `react-hook-form`.
5. **Integracja z API**: Zaimplementować funkcję `onSubmit`, która będzie wysyłać dane do endpointu `POST /api/flashcards`.
6. **Obsługa stanu i błędów**: Dodać obsługę stanu ładowania (np. deaktywacja przycisku "Zapisz" i pokazanie spinnera) oraz wyświetlanie komunikatów o sukcesie lub błędzie za pomocą toastów.
7. **Prop `onFlashcardCreated`**: Dodać prop `onFlashcardCreated` i wywoływać go po pomyślnym utworzeniu fiszki, przekazując nowo utworzony obiekt.
8. **Integracja z widokiem `/library`**: W pliku `src/pages/library.astro`, zaimportować i umieścić komponent `CreateFlashcardModal`, przekazując do niego funkcję, która zaktualizuje lokalny stan listy fiszek.
9. **Stylowanie i testowanie**: Dopracować wygląd komponentu i przetestować cały przepływ, włączając przypadki brzegowe i obsługę błędów.
