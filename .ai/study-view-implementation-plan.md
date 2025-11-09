# Plan implementacji widoku /study - Sesja nauki

## 1. Przegląd

Widok `/study` to dedykowana strona do przeprowadzania sesji nauki z wykorzystaniem algorytmu spaced repetition (SM-2). Głównym celem widoku jest umożliwienie użytkownikowi efektywnej nauki fiszek poprzez:

- Wyświetlanie awersu fiszki z możliwością odsłonięcia rewersu
- Ocenę znajomości materiału za pomocą trzech poziomów trudności
- Śledzenie postępu w trakcie sesji
- Prezentację podsumowania po zakończeniu wszystkich fiszek

Widok charakteryzuje się minimalistycznym designem (brak standardowego Navbar) w celu maksymalizacji koncentracji użytkownika. Sesja nie jest persystowana - odświeżenie strony skutkuje utratą postępu.

## 2. Routing widoku

- **Ścieżka**: `/study`
- **Layout**: Dedykowany minimal layout (bez Navbar, tylko logo + progress + exit)
- **Ochrona**: Wymaga autoryzacji (ProtectedLayout)
- **Pre-fetch**: Automatyczne pobranie fiszek do nauki przy wejściu na stronę

## 3. Struktura komponentów

```
StudyPage (Astro)
└── StudySession (React)
    ├── MinimalHeader (React)
    │   ├── Logo
    │   └── ExitButton
    ├── ProgressBar (React)
    ├── FlashcardReview (React)
    │   ├── CardFront
    │   ├── ShowAnswerButton (warunkowy)
    │   ├── CardBack (warunkowy)
    │   └── RatingButtons (warunkowy)
    │       ├── AgainButton (Don't know)
    │       ├── GoodButton (I know)
    │       └── EasyButton (Very easy)
    ├── SessionSummary (React, warunkowy)
    │   ├── StatsDisplay
    │   └── BackToLibraryButton
    ├── ExitConfirmModal (React, warunkowy)
    │   ├── WarningMessage
    │   ├── CancelButton
    │   └── ConfirmButton
    └── EmptyState (React, warunkowy)
        ├── NoCardsMessage
        └── BackToLibraryButton
```

## 4. Szczegóły komponentów

### 4.1. StudySession (React)

**Opis komponentu:**  
Główny kontener zarządzający całą logiką sesji nauki. Odpowiada za pobieranie fiszek z API, zarządzanie stanem sesji, koordynację przejść między kartami oraz obsługę zakończenia sesji.

**Główne elementy:**
- Warunkowe renderowanie: FlashcardReview (gdy status='active'), SessionSummary (gdy status='completed'), EmptyState (gdy brak fiszek), komunikat błędu (gdy status='error')
- MinimalHeader - zawsze widoczny
- ProgressBar - widoczny tylko gdy status='active'
- ExitConfirmModal - warunkowy

**Obsługiwane interakcje:**
- Inicjalizacja sesji (fetch fiszek przy montowaniu)
- `handleShowAnswer()` - odsłonięcie rewersu bieżącej fiszki
- `handleSubmitRating(rating: ReviewRating)` - ocena fiszki i przejście do następnej
- `handleExit()` - otwarcie modala potwierdzenia wyjścia
- `handleConfirmExit()` - przekierowanie do /library
- `handleCancelExit()` - zamknięcie modala i kontynuacja sesji

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik jest zalogowany (przez ProtectedLayout)
- Walidacja odpowiedzi API (czy data jest tablicą FlashcardDueDto)
- Sprawdzenie czy total_due > 0 (jeśli nie, wyświetl EmptyState)

**Typy:**
- `StudySessionState` (ViewModel)
- `FlashcardDueDto[]` (z API)
- `GetDueFlashcardsResponse` (z API)
- `SessionStats` (ViewModel)

**Propsy:**
- Brak (komponent główny)

---

### 4.2. MinimalHeader (React)

**Opis komponentu:**  
Minimalistyczny nagłówek wyświetlający logo aplikacji oraz przycisk wyjścia z sesji. Zastępuje standardowy Navbar w celu redukcji rozpraszaczy.

**Główne elementy:**
- Logo aplikacji (link do strony głównej lub tylko obraz)
- Button "Exit" z ikoną X

**Obsługiwane interakcje:**
- `onClick` na przycisku Exit - wywołuje callback `onExit` przekazany przez rodzica

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak specyficznych typów

**Propsy:**
```typescript
interface MinimalHeaderProps {
  onExit: () => void;
}
```

---

### 4.3. ProgressBar (React)

**Opis komponentu:**  
Wskaźnik postępu sesji wyświetlający liczbę przejrzanych fiszek oraz wizualny pasek postępu.

**Główne elementy:**
- Tekst: "X / Y" (np. "15 / 25")
- Linear progress bar (wypełnienie proporcjonalne do current/total)
- Opcjonalnie: procent (np. "60%")

**Obsługiwane interakcje:**
- Brak (komponent prezentacyjny)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak specyficznych typów

**Propsy:**
```typescript
interface ProgressBarProps {
  current: number;  // Liczba przejrzanych fiszek
  total: number;    // Całkowita liczba fiszek w sesji
}
```

---

### 4.4. FlashcardReview (React)

**Opis komponentu:**  
Komponent odpowiedzialny za wyświetlanie pojedynczej fiszki w dwóch stanach: z ukrytą odpowiedzią (tylko awers + przycisk "Show answer") oraz z widoczną odpowiedzią (awers + rewers + przyciski oceny).

**Główne elementy:**
- `<div>` z awersem fiszki (zawsze widoczny)
- `<button>` "Show answer" (widoczny gdy isAnswerVisible=false)
- `<div>` z rewersem fiszki (widoczny gdy isAnswerVisible=true)
- `<RatingButtons>` (widoczny gdy isAnswerVisible=true)

**Obsługiwane interakcje:**
- `onClick` na "Show answer" - wywołuje `onShowAnswer()`
- Przekazanie `onRate` do RatingButtons

**Obsługiwana walidacja:**
- Warunkowe renderowanie na podstawie `isAnswerVisible`
- Auto-focus na przycisku "Show answer" przy zmianie karty

**Typy:**
- `FlashcardDueDto` (dane fiszki)

**Propsy:**
```typescript
interface FlashcardReviewProps {
  flashcard: FlashcardDueDto;
  isAnswerVisible: boolean;
  onShowAnswer: () => void;
  onRate: (rating: ReviewRating) => void;
}
```

---

### 4.5. RatingButtons (React)

**Opis komponentu:**  
Zestaw trzech przycisków umożliwiających ocenę znajomości fiszki zgodnie z algorytmem SM-2.

**Główne elementy:**
- Button "Don't know" (rating: "again") - czerwony/destructive
- Button "I know" (rating: "good") - żółty/warning lub niebieski/default
- Button "Very easy" (rating: "easy") - zielony/success

**Obsługiwane interakcje:**
- `onClick` na każdym przycisku - wywołuje `onRate(rating)` z odpowiednim rating

**Obsługiwana walidacja:**
- Brak (komponent prezentacyjny z callbackiem)

**Typy:**
- `ReviewRating` (typ oceny)

**Propsy:**
```typescript
interface RatingButtonsProps {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean; // Opcjonalnie, aby zapobiec wielokrotnemu kliknięciu
}
```

---

### 4.6. SessionSummary (React)

**Opis komponentu:**  
Ekran podsumowania wyświetlany po zakończeniu sesji nauki. Prezentuje statystyki sesji oraz umożliwia powrót do biblioteki.

**Główne elementy:**
- Nagłówek: "Session Complete!" lub "Great job!"
- Statystyki:
  - Całkowita liczba przejrzanych fiszek
  - Liczba ocen "Don't know"
  - Liczba ocen "I know"
  - Liczba ocen "Very easy"
- Button "Back to Library" - przekierowanie do /library

**Obsługiwane interakcje:**
- `onClick` na "Back to Library" - wywołuje `onBackToLibrary()` lub bezpośredni redirect

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `SessionStats` (statystyki sesji)

**Propsy:**
```typescript
interface SessionSummaryProps {
  stats: SessionStats;
  onBackToLibrary: () => void;
}
```

---

### 4.7. ExitConfirmModal (React)

**Opis komponentu:**  
Modal dialog ostrzegający użytkownika o utracie postępu przy wyjściu z sesji.

**Główne elementy:**
- Dialog/Modal z shadcn/ui
- Tytuł: "Exit session?"
- Komunikat: "Your progress will be lost. Are you sure you want to exit?"
- Button "Cancel" (secondary)
- Button "Exit" (destructive)

**Obsługiwane interakcje:**
- `onClick` na "Cancel" - wywołuje `onCancel()`
- `onClick` na "Exit" - wywołuje `onConfirm()`
- Zamknięcie przez ESC lub kliknięcie poza modalem - wywołuje `onCancel()`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak specyficznych typów

**Propsy:**
```typescript
interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

### 4.8. EmptyState (React)

**Opis komponentu:**  
Komunikat wyświetlany gdy użytkownik nie ma żadnych fiszek do nauki (total_due = 0).

**Główne elementy:**
- Ikona (np. CheckCircle lub Calendar)
- Nagłówek: "No flashcards due for review"
- Opis: "Great job! You're all caught up. Come back later or add more flashcards."
- Button "Back to Library"

**Obsługiwane interakcje:**
- `onClick` na "Back to Library" - redirect do /library

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak specyficznych typów

**Propsy:**
- Brak (lub opcjonalnie `onBackToLibrary` callback)

## 5. Typy

### 5.1. Typy istniejące (z `src/types.ts`)

Następujące typy są już zdefiniowane w projekcie i będą wykorzystane w widoku `/study`:

**FlashcardDueDto:**
```typescript
export interface FlashcardDueDto {
  id: string;           // UUID fiszki
  front: string;        // Awers fiszki
  back: string;         // Rewers fiszki
  repetition: number;   // Liczba powtórzeń (SM-2)
  interval: number;     // Interwał w dniach (SM-2)
  efactor: number;      // Współczynnik łatwości (SM-2)
  due_date: string;     // Data następnej powtórki (ISO 8601)
}
```

**GetDueFlashcardsResponse:**
```typescript
export interface GetDueFlashcardsResponse {
  data: FlashcardDueDto[];  // Tablica fiszek do nauki
  total_due: number;        // Całkowita liczba fiszek do nauki
}
```

**ReviewRating:**
```typescript
export type ReviewRating = "again" | "good" | "easy";
```

**ReviewCommand:**
```typescript
export interface ReviewCommand {
  rating: ReviewRating;
}
```

**FlashcardReviewResponseDTO:**
```typescript
export interface FlashcardReviewResponseDTO {
  id: string;
  repetition: number;
  interval: number;
  efactor: number;
  due_date: string;
  updated_at: string;
}
```

### 5.2. Nowe typy (do dodania w `src/types.ts`)

**StudySessionState:**  
ViewModel zarządzający stanem całej sesji nauki.

```typescript
export interface StudySessionState {
  flashcards: FlashcardDueDto[];  // Wszystkie fiszki załadowane do sesji
  currentIndex: number;            // Indeks aktualnie wyświetlanej fiszki (0-based)
  isAnswerVisible: boolean;        // Czy rewers jest widoczny
  sessionStats: SessionStats;      // Statystyki bieżącej sesji
  status: 'loading' | 'active' | 'completed' | 'error';  // Status sesji
  error: string | null;            // Komunikat błędu (jeśli wystąpił)
}
```

**SessionStats:**  
Statystyki sesji nauki wykorzystywane w podsumowaniu.

```typescript
export interface SessionStats {
  total: number;      // Całkowita liczba fiszek w sesji
  reviewed: number;   // Liczba przejrzanych fiszek
  again: number;      // Liczba ocen "Don't know" (rating: "again")
  good: number;       // Liczba ocen "I know" (rating: "good")
  easy: number;       // Liczba ocen "Very easy" (rating: "easy")
}
```

## 6. Zarządzanie stanem

### 6.1. Custom Hook: `useStudySession`

Zarządzanie stanem sesji nauki zostanie zaimplementowane w dedykowanym custom hooku `useStudySession`, który enkapsuluje całą logikę biznesową widoku.

**Lokalizacja:** `src/components/hooks/useStudySession.ts`

**Zwracane wartości:**
```typescript
interface UseStudySessionReturn {
  // Stan
  flashcards: FlashcardDueDto[];
  currentFlashcard: FlashcardDueDto | null;
  currentIndex: number;
  isAnswerVisible: boolean;
  sessionStats: SessionStats;
  status: 'loading' | 'active' | 'completed' | 'error';
  error: string | null;
  
  // Akcje
  showAnswer: () => void;
  submitRating: (rating: ReviewRating) => Promise<void>;
  exitSession: () => void;
  retryFetch: () => void;
}
```

**Wewnętrzny stan:**
```typescript
const [state, setState] = useState<StudySessionState>({
  flashcards: [],
  currentIndex: 0,
  isAnswerVisible: false,
  sessionStats: {
    total: 0,
    reviewed: 0,
    again: 0,
    good: 0,
    easy: 0,
  },
  status: 'loading',
  error: null,
});
```

**Logika inicjalizacji (useEffect):**
1. Przy montowaniu komponentu wykonaj `GET /api/flashcards/due?limit=100`
2. W przypadku sukcesu:
   - Ustaw `flashcards` w state
   - Ustaw `sessionStats.total` na długość tablicy
   - Jeśli `total_due === 0`: ustaw `status: 'completed'` (empty state)
   - Jeśli `total_due > 0`: ustaw `status: 'active'`
3. W przypadku błędu:
   - Ustaw `status: 'error'`
   - Ustaw `error` z komunikatem błędu

**Metoda `showAnswer()`:**
```typescript
const showAnswer = useCallback(() => {
  setState(prev => ({
    ...prev,
    isAnswerVisible: true,
  }));
}, []);
```

**Metoda `submitRating(rating: ReviewRating)`:**
```typescript
const submitRating = useCallback(async (rating: ReviewRating) => {
  const currentFlashcard = state.flashcards[state.currentIndex];
  if (!currentFlashcard) return;

  // Optimistic update - natychmiastowe przejście do następnej karty
  const nextIndex = state.currentIndex + 1;
  const isLastCard = nextIndex >= state.flashcards.length;

  setState(prev => ({
    ...prev,
    currentIndex: nextIndex,
    isAnswerVisible: false,
    sessionStats: {
      ...prev.sessionStats,
      reviewed: prev.sessionStats.reviewed + 1,
      [rating]: prev.sessionStats[rating] + 1,
    },
    status: isLastCard ? 'completed' : 'active',
  }));

  // Asynchroniczne wywołanie API (fire-and-forget z error handling)
  try {
    await fetch(`/api/flashcards/${currentFlashcard.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
  } catch (error) {
    console.error('Failed to submit review:', error);
    // Nie przerywamy sesji - kontynuujemy naukę
  }
}, [state.flashcards, state.currentIndex]);
```

**Metoda `exitSession()`:**
```typescript
const exitSession = useCallback(() => {
  window.location.href = '/library';
}, []);
```

**Metoda `retryFetch()`:**
```typescript
const retryFetch = useCallback(() => {
  setState(prev => ({ ...prev, status: 'loading', error: null }));
  // Ponowne wywołanie fetch logic
}, []);
```

### 6.2. Dodatkowy stan lokalny

**W komponencie StudySession:**
```typescript
const [isExitModalOpen, setIsExitModalOpen] = useState(false);
```

Kontroluje widoczność modala potwierdzenia wyjścia.

## 7. Integracja API

### 7.1. GET /api/flashcards/due

**Kiedy:** Przy montowaniu komponentu StudySession (useEffect)

**Request:**
- **Method:** GET
- **URL:** `/api/flashcards/due?limit=100`
- **Headers:** Authorization automatycznie obsługiwany przez middleware
- **Query params:** `limit=100`

**Response (200 OK):**
```typescript
GetDueFlashcardsResponse {
  data: FlashcardDueDto[];
  total_due: number;
}
```

**Obsługa odpowiedzi:**
- Sukces (200): Załadowanie fiszek do state, ustawienie `status: 'active'`
- Brak fiszek (200, ale `total_due === 0`): Wyświetlenie EmptyState
- Błąd (401): Redirect do /auth/login (obsłużony przez middleware)
- Błąd (500): Wyświetlenie komunikatu błędu z możliwością retry

---

### 7.2. POST /api/flashcards/{id}/review

**Kiedy:** Po kliknięciu przycisku oceny (Don't know / I know / Very easy)

**Request:**
- **Method:** POST
- **URL:** `/api/flashcards/{id}/review`
- **Headers:** 
  - `Authorization`: automatycznie
  - `Content-Type: application/json`
- **Body:**
```typescript
ReviewCommand {
  rating: ReviewRating; // "again" | "good" | "easy"
}
```

**Response (200 OK):**
```typescript
FlashcardReviewResponseDTO {
  id: string;
  repetition: number;
  interval: number;
  efactor: number;
  due_date: string;
  updated_at: string;
}
```

**Obsługa odpowiedzi:**
- Sukces (200): Brak akcji (optimistic update już wykonany)
- Błąd (400/404/500): Logowanie w konsoli, kontynuacja sesji
- **Strategia:** Fire-and-forget z error handling - nie blokujemy UI

## 8. Interakcje użytkownika

### 8.1. Wejście na stronę /study

**Akcja użytkownika:** Nawigacja do `/study` (np. kliknięcie "Study" w Navbar)

**Przepływ:**
1. Astro renderuje stronę z ProtectedLayout (sprawdzenie autoryzacji)
2. Montowanie komponentu StudySession
3. useStudySession wykonuje fetch `GET /api/flashcards/due?limit=100`
4. **Jeśli total_due > 0:** Wyświetlenie pierwszej fiszki (awers + "Show answer")
5. **Jeśli total_due === 0:** Wyświetlenie EmptyState
6. **Jeśli błąd:** Wyświetlenie komunikatu błędu z przyciskiem "Try again"

---

### 8.2. Kliknięcie "Show answer"

**Akcja użytkownika:** Kliknięcie przycisku "Show answer"

**Przepływ:**
1. Wywołanie `showAnswer()` z hooka
2. Ustawienie `isAnswerVisible: true`
3. Wyświetlenie rewersu fiszki
4. Wyświetlenie trzech przycisków oceny (Don't know, I know, Very easy)
5. Auto-focus na pierwszym przycisku oceny (opcjonalnie)

---

### 8.3. Ocena fiszki (kliknięcie przycisku rating)

**Akcja użytkownika:** Kliknięcie jednego z przycisków: "Don't know", "I know", "Very easy"

**Przepływ:**
1. Wywołanie `submitRating(rating)` z odpowiednim rating
2. **Optimistic update:**
   - Inkrementacja `currentIndex`
   - Reset `isAnswerVisible: false`
   - Aktualizacja `sessionStats` (reviewed++, rating++)
   - Jeśli ostatnia fiszka: `status: 'completed'`
3. **Asynchronicznie:** POST `/api/flashcards/{id}/review`
4. **Natychmiastowo:** Wyświetlenie następnej fiszki (awers + "Show answer")
5. **Jeśli ostatnia fiszka:** Wyświetlenie SessionSummary

---

### 8.4. Kliknięcie "Exit"

**Akcja użytkownika:** Kliknięcie przycisku "Exit" w MinimalHeader

**Przepływ:**
1. **Jeśli reviewed === 0:** Bezpośredni redirect do `/library`
2. **Jeśli reviewed > 0:**
   - Otwarcie ExitConfirmModal
   - Wyświetlenie ostrzeżenia: "Your progress will be lost"
   - Czekanie na akcję użytkownika

---

### 8.5. Potwierdzenie wyjścia

**Akcja użytkownika:** Kliknięcie "Exit" w ExitConfirmModal

**Przepływ:**
1. Wywołanie `exitSession()`
2. Redirect do `/library`
3. Utrata postępu sesji (brak persistence)

---

### 8.6. Anulowanie wyjścia

**Akcja użytkownika:** Kliknięcie "Cancel" w ExitConfirmModal lub ESC

**Przepływ:**
1. Zamknięcie modala
2. Powrót do sesji nauki (bieżąca fiszka pozostaje bez zmian)

---

### 8.7. Zakończenie sesji

**Akcja użytkownika:** Ocena ostatniej fiszki w sesji

**Przepływ:**
1. Automatyczne ustawienie `status: 'completed'`
2. Wyświetlenie SessionSummary z statystykami:
   - Total reviewed: X flashcards
   - Don't know: Y
   - I know: Z
   - Very easy: W
3. Przycisk "Back to Library"

---

### 8.8. Powrót do biblioteki z podsumowania

**Akcja użytkownika:** Kliknięcie "Back to Library" w SessionSummary

**Przepływ:**
1. Redirect do `/library`

---

### 8.9. Keyboard shortcuts (opcjonalne - przyszła implementacja)

**Akcje użytkownika:**
- **Space:** Show answer (jeśli ukryta) lub Submit "I know" (jeśli widoczna)
- **1:** Submit "Don't know"
- **2:** Submit "I know"
- **3:** Submit "Very easy"

**Uwaga:** Implementacja keyboard shortcuts jest opcjonalna i może być dodana w przyszłości.

## 9. Warunki i walidacja

### 9.1. Autoryzacja użytkownika

**Komponent:** StudyPage (Astro)  
**Warunek:** Użytkownik musi być zalogowany  
**Weryfikacja:** ProtectedLayout sprawdza `Astro.locals.session`  
**Efekt:** Jeśli brak sesji → redirect do `/auth/login`

---

### 9.2. Dostępność fiszek do nauki

**Komponent:** StudySession  
**Warunek:** `total_due > 0` (użytkownik ma fiszki do nauki)  
**Weryfikacja:** Po fetch `GET /api/flashcards/due`  
**Efekt:**
- Jeśli `total_due === 0` → wyświetl EmptyState
- Jeśli `total_due > 0` → rozpocznij sesję (`status: 'active'`)

---

### 9.3. Widoczność przycisku "Show answer"

**Komponent:** FlashcardReview  
**Warunek:** `isAnswerVisible === false`  
**Weryfikacja:** Props przekazany przez StudySession  
**Efekt:** Przycisk widoczny tylko gdy rewers jest ukryty

---

### 9.4. Widoczność rewersu i przycisków oceny

**Komponent:** FlashcardReview  
**Warunek:** `isAnswerVisible === true`  
**Weryfikacja:** Props przekazany przez StudySession  
**Efekt:** Rewers i RatingButtons widoczne tylko po kliknięciu "Show answer"

---

### 9.5. Warunek otwarcia ExitConfirmModal

**Komponent:** StudySession  
**Warunek:** `sessionStats.reviewed > 0` (użytkownik przejrzał przynajmniej jedną fiszkę)  
**Weryfikacja:** Sprawdzenie w handleExit()  
**Efekt:**
- Jeśli `reviewed === 0` → bezpośredni redirect do `/library`
- Jeśli `reviewed > 0` → otwarcie modala z ostrzeżeniem

---

### 9.6. Wyświetlenie SessionSummary

**Komponent:** StudySession  
**Warunek:** `status === 'completed'`  
**Weryfikacja:** Automatyczne po ocenie ostatniej fiszki  
**Efekt:** Warunkowe renderowanie SessionSummary zamiast FlashcardReview

---

### 9.7. Wyświetlenie EmptyState

**Komponent:** StudySession  
**Warunek:** `status === 'completed' && flashcards.length === 0`  
**Weryfikacja:** Po fetch, gdy `total_due === 0`  
**Efekt:** Wyświetlenie komunikatu "No flashcards due for review"

---

### 9.8. Wyświetlenie komunikatu błędu

**Komponent:** StudySession  
**Warunek:** `status === 'error'`  
**Weryfikacja:** Catch block w useEffect fetch  
**Efekt:** Wyświetlenie komunikatu błędu z przyciskiem "Try again"

## 10. Obsługa błędów

### 10.1. Błąd pobierania fiszek (GET /api/flashcards/due)

**Scenariusz:** Błąd sieciowy lub błąd serwera (500) podczas inicjalizacji sesji

**Obsługa:**
1. Ustawienie `status: 'error'`
2. Ustawienie `error: 'Failed to load flashcards. Please try again.'`
3. Wyświetlenie komunikatu błędu z przyciskiem "Try again"
4. Kliknięcie "Try again" wywołuje `retryFetch()`

**Kod:**
```typescript
try {
  const response = await fetch('/api/flashcards/due?limit=100');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  // ... handle success
} catch (error) {
  setState(prev => ({
    ...prev,
    status: 'error',
    error: 'Failed to load flashcards. Please try again.',
  }));
}
```

---

### 10.2. Błąd oceny fiszki (POST /api/flashcards/{id}/review)

**Scenariusz:** Błąd sieciowy lub błąd serwera podczas wysyłania oceny

**Obsługa:**
1. **Nie blokujemy UI** - optimistic update już wykonany
2. Logowanie błędu w konsoli: `console.error('Failed to submit review:', error)`
3. Opcjonalnie: Toast notification informujący o problemie (przyszła implementacja)
4. Sesja kontynuowana normalnie

**Uzasadnienie:** Priorytetem jest płynność nauki. Użytkownik nie powinien być blokowany przez problemy z API.

**Kod:**
```typescript
try {
  await fetch(`/api/flashcards/${currentFlashcard.id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
} catch (error) {
  console.error('Failed to submit review:', error);
  // Kontynuacja sesji bez przerywania
}
```

---

### 10.3. Błąd autoryzacji (401 Unauthorized)

**Scenariusz:** Sesja użytkownika wygasła podczas sesji nauki

**Obsługa:**
1. Middleware Astro automatycznie przekierowuje do `/auth/login`
2. Brak specjalnej obsługi w komponencie (handled upstream)

---

### 10.4. Brak fiszek do nauki

**Scenariusz:** Użytkownik wchodzi na `/study`, ale nie ma żadnych fiszek do powtórki (`total_due === 0`)

**Obsługa:**
1. Ustawienie `status: 'completed'` (reużycie stanu)
2. Wyświetlenie EmptyState z komunikatem:
   - Nagłówek: "No flashcards due for review"
   - Opis: "Great job! You're all caught up. Come back later or add more flashcards."
   - Przycisk: "Back to Library"

---

### 10.5. Przypadkowe odświeżenie strony

**Scenariusz:** Użytkownik przypadkowo odświeża stronę (F5 / Cmd+R) podczas sesji

**Obsługa:**
1. **beforeunload event:** Wyświetlenie natywnego ostrzeżenia przeglądarki
2. Komunikat: "Are you sure you want to leave? Your progress will be lost."
3. Jeśli użytkownik potwierdzi → utrata postępu (brak persistence)

**Kod:**
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (status === 'active' && sessionStats.reviewed > 0) {
      e.preventDefault();
      e.returnValue = ''; // Chrome wymaga pustego stringa
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [status, sessionStats.reviewed]);
```

---

### 10.6. Błąd walidacji danych z API

**Scenariusz:** API zwraca dane w nieoczekiwanym formacie

**Obsługa:**
1. Walidacja struktury odpowiedzi przed ustawieniem w state
2. Jeśli walidacja nie przejdzie → traktuj jako błąd fetch
3. Wyświetlenie komunikatu błędu z możliwością retry

**Kod:**
```typescript
const data = await response.json();
if (!Array.isArray(data.data) || typeof data.total_due !== 'number') {
  throw new Error('Invalid response format');
}
```

---

### 10.7. Wielokrotne kliknięcie przycisku oceny

**Scenariusz:** Użytkownik szybko klika przycisk oceny wiele razy

**Obsługa:**
1. **Debounce** na przycisku (250ms) - opcjonalne
2. **Disabled state** podczas przejścia do następnej karty
3. Sprawdzenie w `submitRating()` czy `currentFlashcard` istnieje

**Kod:**
```typescript
const submitRating = useCallback(async (rating: ReviewRating) => {
  const currentFlashcard = state.flashcards[state.currentIndex];
  if (!currentFlashcard) return; // Guard clause
  // ... rest of logic
}, [state.flashcards, state.currentIndex]);
```

## 11. Kroki implementacji

### Krok 1: Dodanie nowych typów do `src/types.ts`

**Akcja:** Dodaj nowe ViewModels do pliku typów

**Pliki do modyfikacji:**
- `src/types.ts`

**Kod do dodania:**
```typescript
// Dodaj w sekcji "View Models (frontend state management)"

/** Stan sesji nauki zarządzany przez useStudySession hook */
export interface StudySessionState {
  flashcards: FlashcardDueDto[];
  currentIndex: number;
  isAnswerVisible: boolean;
  sessionStats: SessionStats;
  status: 'loading' | 'active' | 'completed' | 'error';
  error: string | null;
}

/** Statystyki sesji nauki */
export interface SessionStats {
  total: number;
  reviewed: number;
  again: number;
  good: number;
  easy: number;
}
```

---

### Krok 2: Utworzenie custom hooka `useStudySession`

**Akcja:** Stwórz hook zarządzający logiką sesji nauki

**Nowy plik:** `src/components/hooks/useStudySession.ts`

**Implementacja:**
1. Import typów: `StudySessionState`, `SessionStats`, `FlashcardDueDto`, `ReviewRating`
2. Zdefiniuj interfejs `UseStudySessionReturn`
3. Zaimplementuj stan początkowy
4. Dodaj `useEffect` dla fetch fiszek przy montowaniu
5. Zaimplementuj metody: `showAnswer`, `submitRating`, `exitSession`, `retryFetch`
6. Dodaj `useEffect` dla `beforeunload` event
7. Zwróć obiekt z stanem i metodami

**Kluczowe elementy:**
- Optimistic update w `submitRating`
- Fire-and-forget dla POST review
- Error handling z możliwością retry

---

### Krok 3: Utworzenie komponentu `MinimalHeader`

**Akcja:** Stwórz minimalistyczny nagłówek z logo i przyciskiem Exit

**Nowy plik:** `src/components/study/MinimalHeader.tsx`

**Implementacja:**
1. Komponent funkcyjny przyjmujący props `{ onExit: () => void }`
2. Layout: flex, justify-between, padding
3. Logo aplikacji (po lewej)
4. Button "Exit" z ikoną X (po prawej)
5. Styling: minimalistyczny, bez rozpraszaczy

**Komponenty shadcn/ui:** Button

---

### Krok 4: Utworzenie komponentu `ProgressBar`

**Akcja:** Stwórz wskaźnik postępu sesji

**Nowy plik:** `src/components/study/ProgressBar.tsx`

**Implementacja:**
1. Komponent funkcyjny przyjmujący props `{ current: number, total: number }`
2. Tekst: "{current} / {total}"
3. Progress bar (linear) - wypełnienie: `(current / total) * 100%`
4. Styling: wycentrowany, widoczny ale dyskretny

**Komponenty shadcn/ui:** Progress (jeśli dostępny) lub custom div z background

---

### Krok 5: Utworzenie komponentu `RatingButtons`

**Akcja:** Stwórz zestaw trzech przycisków oceny

**Nowy plik:** `src/components/study/RatingButtons.tsx`

**Implementacja:**
1. Komponent funkcyjny przyjmujący props `{ onRate: (rating: ReviewRating) => void, disabled?: boolean }`
2. Trzy przyciski w układzie poziomym lub pionowym:
   - "Don't know" (variant: destructive, rating: "again")
   - "I know" (variant: default, rating: "good")
   - "Very easy" (variant: success/outline, rating: "easy")
3. Każdy przycisk wywołuje `onRate` z odpowiednim rating
4. Obsługa `disabled` prop

**Komponenty shadcn/ui:** Button

---

### Krok 6: Utworzenie komponentu `FlashcardReview`

**Akcja:** Stwórz komponent wyświetlający fiszkę w dwóch stanach

**Nowy plik:** `src/components/study/FlashcardReview.tsx`

**Implementacja:**
1. Komponent funkcyjny przyjmujący props: `{ flashcard, isAnswerVisible, onShowAnswer, onRate }`
2. Zawsze wyświetl awers (front) w karcie
3. Warunkowe renderowanie:
   - Jeśli `!isAnswerVisible`: Button "Show answer"
   - Jeśli `isAnswerVisible`: Rewers (back) + `<RatingButtons>`
4. Auto-focus na "Show answer" przy zmianie fiszki (useEffect + useRef)
5. Styling: karta wycentrowana, duży font dla czytelności

**Komponenty shadcn/ui:** Card, Button

---

### Krok 7: Utworzenie komponentu `SessionSummary`

**Akcja:** Stwórz ekran podsumowania sesji

**Nowy plik:** `src/components/study/SessionSummary.tsx`

**Implementacja:**
1. Komponent funkcyjny przyjmujący props `{ stats: SessionStats, onBackToLibrary: () => void }`
2. Nagłówek: "Session Complete!" z ikoną sukcesu
3. Wyświetl statystyki:
   - Total reviewed: {stats.reviewed}
   - Don't know: {stats.again}
   - I know: {stats.good}
   - Very easy: {stats.easy}
4. Button "Back to Library" wywołujący `onBackToLibrary`
5. Styling: wycentrowany, celebracyjny

**Komponenty shadcn/ui:** Card, Button

---

### Krok 8: Utworzenie komponentu `ExitConfirmModal`

**Akcja:** Stwórz modal ostrzegający o utracie postępu

**Nowy plik:** `src/components/study/ExitConfirmModal.tsx`

**Implementacja:**
1. Komponent funkcyjny przyjmujący props `{ isOpen, onConfirm, onCancel }`
2. Dialog z shadcn/ui
3. Tytuł: "Exit session?"
4. Komunikat: "Your progress will be lost. Are you sure you want to exit?"
5. Dwa przyciski:
   - "Cancel" (variant: outline) → `onCancel`
   - "Exit" (variant: destructive) → `onConfirm`

**Komponenty shadcn/ui:** Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button

---

### Krok 9: Utworzenie komponentu `EmptyState`

**Akcja:** Stwórz komunikat dla braku fiszek do nauki

**Nowy plik:** `src/components/study/EmptyState.tsx`

**Implementacja:**
1. Komponent funkcyjny (brak props lub opcjonalny `onBackToLibrary`)
2. Ikona (CheckCircle lub Calendar z lucide-react)
3. Nagłówek: "No flashcards due for review"
4. Opis: "Great job! You're all caught up. Come back later or add more flashcards."
5. Button "Back to Library" → redirect do `/library`
6. Styling: wycentrowany, przyjazny

**Komponenty shadcn/ui:** Card, Button

---

### Krok 10: Utworzenie komponentu `StudySession`

**Akcja:** Stwórz główny kontener sesji nauki

**Nowy plik:** `src/components/study/StudySession.tsx`

**Implementacja:**
1. Komponent funkcyjny z `client:load` directive
2. Użyj hooka `useStudySession()`
3. Stan lokalny: `isExitModalOpen`
4. Warunkowe renderowanie na podstawie `status`:
   - `loading`: Spinner/Loading state
   - `error`: Komunikat błędu + "Try again"
   - `active`: MinimalHeader + ProgressBar + FlashcardReview
   - `completed` (z fiszkami): MinimalHeader + SessionSummary
   - `completed` (bez fiszek): MinimalHeader + EmptyState
5. Zawsze renderuj `ExitConfirmModal` (kontrolowany przez `isExitModalOpen`)
6. Implementuj handlery: `handleExit`, `handleConfirmExit`, `handleCancelExit`

**Komponenty:** Wszystkie wcześniej stworzone komponenty

---

### Krok 11: Utworzenie strony `/study`

**Akcja:** Stwórz stronę Astro dla widoku sesji nauki

**Nowy plik:** `src/pages/study.astro`

**Implementacja:**
```astro
---
import ProtectedLayout from '../layouts/ProtectedLayout.astro';
import StudySession from '../components/study/StudySession';
---

<ProtectedLayout title="Study Session - 10xCards">
  <StudySession client:load />
</ProtectedLayout>
```

**Uwagi:**
- Użyj `ProtectedLayout` dla autoryzacji
- `client:load` dla pełnej interaktywności React

---

### Krok 12: Aktualizacja Navbar (dodanie linku Study)

**Akcja:** Upewnij się, że link "Study" w Navbar prowadzi do `/study`

**Plik do modyfikacji:** `src/components/Navbar.astro` (lub odpowiedni komponent)

**Implementacja:**
- Dodaj link `<a href="/study">Study</a>` w nawigacji (jeśli jeszcze nie istnieje)
- Zgodnie z retrieved memory, link już powinien istnieć

---

### Krok 13: Styling i dostosowanie UI

**Akcja:** Dopracuj styling wszystkich komponentów

**Wytyczne:**
- Minimalistyczny design (zgodnie z PRD)
- Duży, czytelny font dla fiszek
- Wyraźne przyciski oceny z kolorami:
  - Don't know: czerwony (destructive)
  - I know: niebieski/szary (default)
  - Very easy: zielony (success/outline)
- Responsywność (mobile-first)
- Dark mode support (jeśli projekt używa)

---

### Krok 14: Accessibility

**Akcja:** Dodaj atrybuty dostępności

**Implementacja:**
1. `aria-live="polite"` na kontenerze fiszki (dla screen readerów)
2. Auto-focus na "Show answer" przy zmianie karty
3. Keyboard navigation (Tab, Enter, Space)
4. Semantyczne HTML (button, nav, main)
5. Alt text dla ikon

---

### Krok 15: Testowanie

**Akcja:** Przetestuj wszystkie scenariusze

**Scenariusze do przetestowania:**
1. ✅ Wejście na `/study` z fiszkami do nauki
2. ✅ Wejście na `/study` bez fiszek (EmptyState)
3. ✅ Pokazanie odpowiedzi (Show answer)
4. ✅ Ocena fiszki (wszystkie 3 opcje)
5. ✅ Przejście przez całą sesję (SessionSummary)
6. ✅ Wyjście z sesji (Exit modal)
7. ✅ Anulowanie wyjścia
8. ✅ Odświeżenie strony (beforeunload warning)
9. ✅ Błąd fetch fiszek (symulacja 500)
10. ✅ Błąd review (symulacja network error)

---

### Krok 16: Optymalizacje (opcjonalne)

**Akcja:** Dodaj opcjonalne usprawnienia

**Możliwe usprawnienia:**
1. Keyboard shortcuts (Space, 1, 2, 3)
2. Animacje przejść między fiszkami
3. Toast notifications dla błędów review
4. Progress persistence w localStorage (przyszła wersja)
5. Statystyki czasu sesji
6. Sound effects przy ocenie (opcjonalne)

---

### Podsumowanie kroków:

1. ✅ Dodaj typy do `src/types.ts`
2. ✅ Stwórz `useStudySession` hook
3. ✅ Stwórz `MinimalHeader` komponent
4. ✅ Stwórz `ProgressBar` komponent
5. ✅ Stwórz `RatingButtons` komponent
6. ✅ Stwórz `FlashcardReview` komponent
7. ✅ Stwórz `SessionSummary` komponent
8. ✅ Stwórz `ExitConfirmModal` komponent
9. ✅ Stwórz `EmptyState` komponent
10. ✅ Stwórz `StudySession` komponent główny
11. ✅ Stwórz stronę `src/pages/study.astro`
12. ✅ Zaktualizuj Navbar (jeśli potrzeba)
13. ✅ Dopracuj styling
14. ✅ Dodaj accessibility
15. ✅ Przetestuj wszystkie scenariusze
16. ✅ (Opcjonalnie) Dodaj usprawnienia

**Szacowany czas implementacji:** 6-8 godzin dla doświadczonego programisty frontendowego.

