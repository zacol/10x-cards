# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Aplikacja 10xCards wykorzystuje architekturę opartą na Astro 5 z React 19 islands dla interaktywnych komponentów. Struktura UI składa się z 6 głównych widoków: autentykacja (login/register), biblioteka fiszek, generator AI, sesja nauki oraz statystyki. Aplikacja implementuje mobile-first approach z responsive design (375px-1280px+) i WCAG 2.1 Level AA accessibility.

**Stack techniczny UI:**

- Framework: Astro 5 (SSR) + React 19 (islands)
- Styling: Tailwind CSS 4
- Komponenty: Shadcn/ui
- State: Context API
- Walidacja: Zod + react-hook-form

## 2. Lista widoków

### 2.1 /auth/login - Widok logowania

**Główny cel:** Uwierzytelnienie użytkownika  
**Layout:** AuthLayout (bez Navbar)  
**Kluczowe informacje:** Formularz logowania, link do rejestracji  
**Komponenty:**

- LoginForm (React) - email/password inputs, submit button
- Toast notifications dla błędów

**UX/Dostępność/Bezpieczeństwo:**

- Auto-focus na email input
- Walidacja client-side (Zod)
- Komunikaty błędów inline
- JWT tokens w httpOnly cookies
- Rate limiting: 100 req/min

### 2.2 /auth/register - Widok rejestracji

**Główny cel:** Utworzenie nowego konta  
**Layout:** AuthLayout  
**Kluczowe informacje:** Formularz rejestracji, link do logowania  
**Komponenty:**

- RegisterForm (React) - email/password/confirm inputs
- Password strength indicator
- Auto-login po rejestracji

**UX/Dostępność/Bezpieczeństwo:**

- Walidacja min 8 znaków hasła
- Sprawdzanie duplikatu email
- Redirect do /library po sukcesie
- Komunikat: "An account with this email already exists"

### 2.3 /library - Biblioteka fiszek

**Główny cel:** Przeglądanie i zarządzanie fiszkami  
**Layout:** ProtectedLayout z Navbar  
**Kluczowe informacje:** Lista fiszek, filtry, pagination, stats  
**Komponenty:**

- FlashcardList (React) - grid of cards, responsive (1-3 kolumny)
- FlashcardCard (React) - front/back text, metadata, action buttons
- LibraryFilters (React) - toggle AI/Manual/All, sort dropdown
- EditFlashcardModal (React) - Shadcn Dialog z formularzem
- DeleteConfirmDialog (React) - Shadcn AlertDialog z confirmation
- CreateFlashcardModal (React) - ręczne dodawanie fiszki
- EmptyState (Astro) - ilustracja + 2 CTAs (Generator AI, Add manually)
- PaginationControls (React) - prev/next, page numbers

**Funkcje:**

- Server-side pagination (limit, offset)
- Filtry: created_by_ai, generation_id
- Sortowanie: created_at, updated_at, due_date (asc/desc)
- Metadata na karcie: due date, repetition count, badge (Due/Learning/Mastered)
- Actions: Edit, Delete z confirmation

**UX/Dostępność/Bezpieczeństwo:**

- Skeleton UI podczas ładowania (6-9 card skeletons)
- Optimistic delete z undo toast (5s)
- URL state dla filters/pagination (?limit=50&sort=created_at)
- ARIA labels: role="list", role="listitem"
- Keyboard navigation: Tab przez karty
- RLS policies - tylko własne fiszki

### 2.4 /generator - Generator AI

**Główny cel:** Generowanie fiszek z tekstu za pomocą AI  
**Layout:** ProtectedLayout z Navbar  
**Kluczowe informacje:** Formularz input, propozycje AI, akcje edycji  
**Komponenty:**

- GeneratorForm (React) - textarea (source_text), optional context input
- CharacterCounter (React) - real-time 1000-10000 validation
- ProposalsList (React) - lista wygenerowanych propozycji
- ProposalCard (React) - expandable card z inline edit (autosize textarea)
- StickyFooter (React) - "Zapisz fiszki (X)" button

**Przepływ:**

1. Formularz z disabled button (aktywuje się przy 1000-10000 chars)
2. Submit → Loading overlay "Generuję fiszki... może to potrwać do 30s"
3. Propozycje wyświetlane poniżej (formularz readonly ale widoczny)
4. Inline edycja: autosize textarea dla front/back
5. Delete button usuwa propozycję z listy
6. Sticky footer z count pozostałych
7. Accept → toast "Dodano X fiszek" + redirect /library?highlight=new

**UX/Dostępność/Bezpieczeństwo:**

- Real-time character counter z visual feedback
- Zod validation: source_text (1000-10000), context (max 500)
- Error handling: AI errors → alert z retry button
- Rate limit UI: 10 generacji/godzinę, countdown przy przekroczeniu
- aria-describedby dla licznika znaków
- Focus management w propozycjach

### 2.5 /study - Sesja nauki

**Główny cel:** Nauka fiszek z algorytmem spaced repetition  
**Layout:** Minimal (brak Navbar, tylko logo + progress + exit)  
**Kluczowe informacje:** Awers/rewers fiszki, progress, rating buttons  
**Komponenty:**

- StudySession (React) - główna logika sesji
- FlashcardReview (React) - wyświetlanie front/back
- RatingButtons (React) - 3 przyciski (Nie wiem, Wiem, Bardzo łatwe)
- ProgressBar (React) - "15/25" + linear progress indicator
- SessionSummary (React) - ekran końcowy z podsumowaniem
- ExitConfirmModal (React) - ostrzeżenie o utracie postępu

**Przepływ:**

1. Pre-fetch: GET /api/flashcards/due?limit=100
2. State 1: Awers + "Pokaż odpowiedź" button + progress bar u góry
3. State 2: Awers + Rewers + 3 rating buttons
4. Rating → Optimistic update, instant następna karta
5. Exit button → modal "Czy na pewno? Postęp zostanie utracony"
6. Complete → SessionSummary + redirect /library

**UX/Dostępność/Bezpieczeństwo:**

- Minimalistyczny design (maksymalna koncentracja)
- Brak metadanych SM-2 (tylko front/back)
- Keyboard shortcuts: Space (show/next), 1/2/3 (ratings) - opcjonalne w przyszłości
- aria-live="polite" dla zmiany karty
- Auto-focus na "Pokaż odpowiedź"
- Brak persistence - refresh = utrata postępu

### 2.6 /stats - Statystyki użytkownika

**Główny cel:** Wyświetlanie metryk nauki i wykorzystania AI  
**Layout:** ProtectedLayout z Navbar  
**Kluczowe informacje:** Metryki fiszek, nauki, generacji AI  
**Komponenty:**

- StatsOverview (Astro SSR) - server-fetched data
- StatCard (Astro) - pojedyncza metryka (value + label + icon)
- RefreshButton (React) - manual refresh trigger
- ProgressBars (React) - wizualizacja AI utilization rate

**Metryki:**

- Flashcards: total, AI generated, manual, AI utilization rate (target 75%)
- Learning: total reviews, cards due today, cards mastered (repetition > 5)
- Generations: total, total cost, avg generation time, AI acceptance rate (target 75%)

**UX/Dostępność/Bezpieczeństwo:**

- SSR w Astro (export const prerender = false)
- Cache 5min (stale-while-revalidate)
- Manual refresh button w prawym górnym rogu
- Responsive grid dla stat cards
- ARIA labels dla progress bars
- Read-only view (brak mutacji)

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ: Nowy użytkownik → Pierwsza sesja nauki

1. **Rejestracja** (`/auth/register`)
   - Wypełnienie formularza (email + password)
   - Auto-login + redirect → `/library`

2. **Empty state w bibliotece** (`/library`)
   - Widok: "Nie masz jeszcze żadnych fiszek"
   - CTA: "Generuj z AI" → `/generator`

3. **Generowanie fiszek** (`/generator`)
   - Wklejenie tekstu (np. 3000 znaków)
   - Opcjonalnie: dodanie kontekstu "Historia Polski"
   - Kliknięcie "Generuj" → loading 15-30s
   - Przegląd 12 propozycji, edycja 2, usunięcie 1
   - Kliknięcie "Zapisz fiszki (11)" → redirect `/library?highlight=new`

4. **Biblioteka z fiszkami** (`/library`)
   - Toast: "Dodano 11 fiszek"
   - Widoczne 11 nowych fiszek (highlighted)
   - Navbar: button "Nauka (11)" z pulsing badge

5. **Sesja nauki** (`/study`)
   - Kliknięcie "Nauka (11)" w Navbar
   - Pre-fetch 11 due cards
   - Progress: "1/11" → "11/11"
   - Rating każdej fiszki (Nie wiem/Wiem/Bardzo łatwe)
   - SessionSummary: "Ukończono sesję! 11 fiszek przejrzanych"
   - Redirect → `/library`

### 3.2 Przepływ: Powracający użytkownik

1. **Login** (`/auth/login`) → redirect `/library`
2. **Biblioteka** - widok istniejących fiszek, smart button "Nauka (5)"
3. **Opcjonalnie:** sprawdzenie `/stats` - metryki postępów
4. **Sesja nauki** lub **Generator** dla nowych materiałów

### 3.3 Przepływ: Manualne zarządzanie fiszkami

1. **Biblioteka** (`/library`)
2. **Dodanie:** Click "Dodaj ręcznie" → CreateFlashcardModal → save → toast
3. **Edycja:** Click "Edit" na karcie → EditFlashcardModal → save → refresh list
4. **Usunięcie:** Click "Delete" → DeleteConfirmDialog → confirm → optimistic delete + undo toast

### 3.4 Edge cases i stany błędów

- **Rate limit AI:** Generator → toast "Przekroczono limit 10/h. Spróbuj za X min"
- **Network error:** Global sticky toast "Brak połączenia z internetem"
- **AI generation fail:** Alert w generatorze z retry button
- **No due cards:** Button "Nauka" disabled, tooltip "Brak fiszek do powtórki"
- **Session exit:** Modal "Czy na pewno opuścić? Postęp zostanie utracony"

## 4. Układ i struktura nawigacji

### 4.1 Navbar (ProtectedLayout)

**Desktop layout:**

```
[Logo "10xCards"] [Library] [Generator] [Study (5)] [Stats] ................ [User: email@example.com ▼] [Logout]
```

**Mobile layout:**

```
[☰] [Logo] ................ [Study (5)]
```

Hamburger menu otwiera drawer z linkami: Library, Generator, Stats, User settings, Logout

**Komponenty:**

- Logo + brand name → link do `/library`
- Navigation links: Library, Generator, Study, Stats
- Smart Study button:
  - Due > 0: "Nauka (X)" primary variant, pulsing badge
  - Due = 0: "Nauka" disabled/ghost variant, tooltip
- User dropdown (desktop): email, dark mode toggle, logout
- Mobile: hamburger menu

**Due count mechanism:**

- Endpoint: `/api/flashcards/due?limit=1` (tylko total_due)
- Update po każdej review submission

### 4.2 Nawigacja kontekstowa

**Empty state w /library:**

- "Generuj z AI" → `/generator`
- "Dodaj ręcznie" → CreateFlashcardModal (pozostaje w /library)

**Generator success:**

- Auto-redirect → `/library?highlight=new`

**Study session complete:**

- Auto-redirect → `/library`

**Study session exit:**

- Modal confirmation → redirect `/library` (utrata postępu)

### 4.3 Breadcrumbs i back navigation

Brak breadcrumbs w MVP - płaska struktura nawigacji (wszystkie główne widoki dostępne z Navbar).

## 5. Kluczowe komponenty

### 5.1 Layout Components

**AuthLayout** (Astro)

- Centered card z formularzem
- Brak Navbar
- Logo u góry

**ProtectedLayout** (Astro)

- Auth guard (redirect do /auth/login jeśli unauthorized)
- Navbar component
- Main content area z padding
- Footer (opcjonalnie)

**MinimalLayout** (dla /study)

- Brak Navbar
- Tylko logo + progress bar + exit button u góry
- Full-screen content area

### 5.2 Shared UI Components (Shadcn/ui)

- **Button** - variants: default, destructive, outline, ghost, link
- **Card** - container dla flashcards i stat cards
- **Dialog** - modals (Edit, Create)
- **AlertDialog** - confirmation dialogs (Delete, Exit)
- **Input** - text inputs w formularzach
- **Textarea** - autosize dla długich tekstów
- **Skeleton** - loading states
- **Toast** - notifications (success, error, info)
- **Select** - dropdowns (sort, filters)
- **Switch** - toggle (dark mode, filters)
- **Badge** - due count, status indicators
- **Progress** - linear progress bar w study session

### 5.3 Feature-specific Components

**Flashcards:**

- FlashcardList - grid container, pagination logic
- FlashcardCard - display front/back, metadata, actions
- EditFlashcardModal - form z validation
- CreateFlashcardModal - form z validation
- DeleteConfirmDialog - confirmation z preview

**Generator:**

- GeneratorForm - textarea + context input + validation
- CharacterCounter - real-time feedback
- ProposalsList - container dla propozycji
- ProposalCard - expandable, inline edit, delete
- StickyFooter - accept button z count

**Study:**

- StudySession - session logic, card queue management
- FlashcardReview - flip card UI
- RatingButtons - 3 buttons z keyboard support
- ProgressBar - X/Y indicator
- SessionSummary - stats display

**Stats:**

- StatsOverview - grid layout
- StatCard - metric display z icon
- RefreshButton - manual trigger

**Navigation:**

- Navbar - responsive, smart study button
- MobileMenu - drawer dla mobile
- UserDropdown - user menu

### 5.4 Provider Components


**AuthProvider** (React)

- User context
- isAuthenticated flag
- Initial user from server

**ToastProvider** (React)

- Shadcn/ui Sonner
- Global toast notifications

**ThemeProvider** (React)

- Dark mode toggle
- localStorage persistence
- System preference detection

### 5.5 Hook Components


**Custom hooks:**

- useAuth() - access AuthContext
- useToast() - toast notifications
- useTheme() - dark mode

---

## Mapowanie User Stories do UI

### US-001: Rejestracja → /auth/register + RegisterForm

### US-002: Logowanie → /auth/login + LoginForm

### US-003: Generowanie fiszek → /generator + GeneratorForm

### US-004: Przeglądanie propozycji → /generator + ProposalsList + inline edit

### US-005: Manualne tworzenie → /library + CreateFlashcardModal

### US-006: Edycja fiszki → /library + EditFlashcardModal

### US-007: Usuwanie fiszki → /library + DeleteConfirmDialog

### US-008: Sesja nauki → /study + StudySession + FlashcardReview

### US-009: Nawigacja biblioteki → /library + FlashcardList + filters

### US-010: Empty states → /library EmptyState, /study "Brak fiszek"

---

**Koniec architektury UI dla 10xCards MVP**
