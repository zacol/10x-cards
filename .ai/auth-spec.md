# Specyfikacja techniczna systemu autentykacji - 10xCards

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura stron i routingu

#### Strony publiczne (dostępne bez autentykacji)
- **`/auth/register`** - Formularz rejestracji (Astro + React)
- **`/auth/login`** - Formularz logowania (Astro + React)
- **`/auth/reset-password`** - Żądanie resetu hasła (Astro + React)
- **`/auth/update-password`** - Aktualizacja hasła po resecie (Astro + React, wymaga tokena)

#### Strony chronione (wymagają autentykacji)
- **`/library`** - Główny widok po zalogowaniu (Biblioteka fiszek)
- **`/generate`** - Generator fiszek AI
- **`/study`** - Sesja nauki

### 1.2. Komponenty React (client-side)

#### `RegisterForm.tsx` - Formularz rejestracji
**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

**Odpowiedzialności:**
- Walidacja frontendu (email format, min. 8 znaków hasła)
- Wywołanie endpoint `POST /api/auth/register`
- Zarządzanie stanem formularza i błędów
- Wyświetlanie komunikatów walidacyjnych i błędów API
- Przekierowanie do `/library` po sukcesie

**Stan komponentu:**
```typescript
{
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
}
```

**Walidacja:**
- Email: regex RFC 5322 simplified
- Hasło: min. 8 znaków, wymagana 1 wielka litera, 1 cyfra
- Potwierdzenie hasła: musi być identyczne
- Komunikaty błędów wyświetlane inline pod polami

#### `LoginForm.tsx` - Formularz logowania
**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Odpowiedzialności:**
- Walidacja podstawowa (niepuste pola)
- Wywołanie endpoint `POST /api/auth/login`
- Obsługa błędu "Invalid credentials"
- Przekierowanie do `/library` po sukcesie

**Stan komponentu:**
```typescript
{
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

#### `ResetPasswordForm.tsx` - Żądanie resetu hasła
**Lokalizacja:** `src/components/auth/ResetPasswordForm.tsx`

**Odpowiedzialności:**
- Walidacja email
- Wywołanie endpoint `POST /api/auth/reset-password`
- Wyświetlenie komunikatu sukcesu (sprawdź email)

#### `UpdatePasswordForm.tsx` - Ustawienie nowego hasła
**Lokalizacja:** `src/components/auth/UpdatePasswordForm.tsx`

**Odpowiedzialności:**
- Walidacja nowego hasła i potwierdzenia
- Wywołanie endpoint `POST /api/auth/update-password`
- Przekierowanie do `/auth/login` po sukcesie

#### `LogoutButton.tsx` - Przycisk wylogowania
**Lokalizacja:** `src/components/auth/LogoutButton.tsx`

**Odpowiedzialności:**
- Wywołanie endpoint `POST /api/auth/logout`
- Przekierowanie do `/auth/login` po wylogowaniu

### 1.3. Komponenty Astro (static/SSR)

#### `AuthLayout.astro` - Layout dla stron autentykacji
**Lokalizacja:** `src/layouts/AuthLayout.astro`

**Cechy:**
- Wyśrodkowany kontener (max-width: 400px)
- Logo aplikacji na górze
- Link do alternatywnej akcji (np. "Masz już konto? Zaloguj się")
- Minimalistyczny design z Tailwind + shadcn/ui

#### `ProtectedLayout.astro` - Layout dla stron chronionych
**Lokalizacja:** `src/layouts/ProtectedLayout.astro`

**Odpowiedzialności:**
- Sprawdzenie `Astro.locals.user` w server-side
- Jeśli `null` → redirect do `/auth/login`
- Nawigacja (navbar) z przyciskiem wylogowania
- Wyświetlenie emaila użytkownika

#### `Navbar.astro` - Pasek nawigacji
**Lokalizacja:** `src/components/Navbar.astro`

**Elementy:**
- Logo/Nazwa aplikacji
- Linki: Biblioteka, Generator, Sesja nauki
- Email użytkownika + `<LogoutButton />` (React island)

### 1.4. Middleware - Aktualizacja autentykacji

**Lokalizacja:** `src/middleware/index.ts`

**Rozszerzenie istniejącego middleware:**
```typescript
// Obecna implementacja już ekstraktuje user z Supabase
// Należy dodać obsługę cookie-based sessions dla persistencji
```

**Dodatkowa logika:**
- Odświeżanie tokena gdy wygasł (refresh token flow)
- Ustawienie nagłówka Authorization dla client-side (opcjonalne)
- Brak zmian w obecnej logice - middleware już prawidłowo obsługuje user extraction

### 1.5. Scenariusze i przepływy UX

#### Scenariusz 1: Rejestracja nowego użytkownika
1. User wchodzi na `/auth/register`
2. Wypełnia email, hasło, potwierdzenie hasła
3. Kliknięcie "Zarejestruj się" → `POST /api/auth/register`
4. Sukces → auto-login → redirect do `/library` (empty state: "Nie masz jeszcze żadnych fiszek")
5. Błąd → komunikat inline (np. "Email już istnieje")

#### Scenariusz 2: Logowanie
1. User wchodzi na `/auth/login`
2. Wypełnia email i hasło
3. Kliknięcie "Zaloguj się" → `POST /api/auth/login`
4. Sukces → redirect do `/library`
5. Błąd → komunikat: "Nieprawidłowy email lub hasło"

#### Scenariusz 3: Odzyskiwanie hasła
1. User klika "Zapomniałeś hasła?" na `/auth/login`
2. Redirect do `/auth/reset-password`
3. Wpisuje email → `POST /api/auth/reset-password`
4. Wyświetla się: "Sprawdź swoją skrzynkę email"
5. User klika link w emailu → redirect do `/auth/update-password?token=...`
6. Wpisuje nowe hasło → `POST /api/auth/update-password`
7. Sukces → redirect do `/auth/login` z komunikatem "Hasło zostało zmienione"

#### Scenariusz 4: Wylogowanie
1. User klika przycisk "Wyloguj" w navbar
2. `POST /api/auth/logout`
3. Redirect do `/library` (landing page)

#### Scenariusz 5: Dostęp do chronionej strony bez autentykacji
1. User próbuje wejść na `/library` (nie jest zalogowany)
2. `ProtectedLayout.astro` sprawdza `Astro.locals.user === null`
3. Server-side redirect do `/auth/login?redirect=/library`
4. Po logowaniu → redirect do `/library`

### 1.6. Walidacja i komunikaty błędów

#### Client-side validation (React)
- **Email:** "Please enter a valid email address"
- **Password (registration):** "Password must be at least 8 characters, contain a capital letter and a number"
- **Password confirmation:** "Passwords do not match"
- **Empty field:** "This field is required"

#### API error messages
- **401 Unauthorized:** "Invalid email or password"
- **409 Conflict (email exists):** "An account with this email address already exists"
- **400 Bad Request:** "Invalid data. Please check the form."
- **500 Internal Error:** "An error occurred. Please try again later."
- **Rate limit:** "Too many attempts. Please try again in a few minutes."

## 2. LOGIKA BACKENDOWA

### 2.1. Endpointy API

#### `POST /api/auth/register`
**Lokalizacja:** `src/pages/api/auth/register.ts`

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Odpowiedzialności:**
- Walidacja danych (Zod schema)
- Wywołanie `supabase.auth.signUp({ email, password })`
- Auto-logowanie po rejestracji (ustawienie session cookie)
- Return 201 + user data (bez hasła)

**Response 201:**
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**Errors:**
- 400: Validation error
- 409: Email already exists
- 500: Internal error

---

#### `POST /api/auth/login`
**Lokalizacja:** `src/pages/api/auth/login.ts`

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Odpowiedzialności:**
- Walidacja danych
- Wywołanie `supabase.auth.signInWithPassword({ email, password })`
- Ustawienie session cookie
- Return 200 + user data

**Response 200:**
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**Errors:**
- 400: Validation error
- 401: Invalid credentials
- 500: Internal error

---

#### `POST /api/auth/logout`
**Lokalizacja:** `src/pages/api/auth/logout.ts`

**Odpowiedzialności:**
- Wywołanie `supabase.auth.signOut()`
- Wyczyszczenie session cookie
- Return 204 No Content

**Response:** 204 No Content

---

#### `POST /api/auth/reset-password`
**Lokalizacja:** `src/pages/api/auth/reset-password.ts`

**Request Body:**
```typescript
{
  email: string;
}
```

**Odpowiedzialności:**
- Walidacja email
- Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://domain.com/auth/update-password' })`
- Return 200 (zawsze, nawet jeśli email nie istnieje - security best practice)

**Response 200:**
```typescript
{
  message: "Jeśli konto istnieje, link do resetu hasła został wysłany na email"
}
```

---

#### `POST /api/auth/update-password`
**Lokalizacja:** `src/pages/api/auth/update-password.ts`

**Request Body:**
```typescript
{
  password: string;
}
```

**Odpowiedzialności:**
- Weryfikacja tokena z URL (automatycznie przez Supabase)
- Wywołanie `supabase.auth.updateUser({ password })`
- Return 200

**Response 200:**
```typescript
{
  message: "Hasło zostało zaktualizowane"
}
```

**Errors:**
- 400: Invalid token / expired
- 401: Unauthorized
- 500: Internal error

### 2.2. Schematy walidacji (Zod)

**Lokalizacja:** `src/pages/api/auth/auth.schema.ts`

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});
```

### 2.3. Serwisy autentykacji

**Lokalizacja:** `src/lib/services/auth.service.ts`

**Funkcje:**
```typescript
// Register user
async function registerUser(
  email: string,
  password: string,
  supabase: SupabaseClient
): Promise<User>

// Login user
async function loginUser(
  email: string,
  password: string,
  supabase: SupabaseClient
): Promise<{ user: User; session: Session }>

// Logout user
async function logoutUser(supabase: SupabaseClient): Promise<void>

// Request password reset
async function requestPasswordReset(
  email: string,
  supabase: SupabaseClient
): Promise<void>

// Update password
async function updatePassword(
  newPassword: string,
  supabase: SupabaseClient
): Promise<void>
```

**Odpowiedzialności serwisu:**
- Enkapsulacja logiki Supabase Auth
- Obsługa błędów Supabase i mapowanie na ErrorResponse
- Logika biznesowa (jeśli potrzebna w przyszłości)

### 2.4. Obsługa wyjątków

**Wzorzec obsługi błędów w endpointach:**
1. Guard clause dla autentykacji (jeśli wymagana)
2. Try-catch dla parsowania JSON
3. Zod safeParse dla walidacji
4. Try-catch dla wywołań serwisu/Supabase
5. Zwrot ErrorResponse z odpowiednim kodem HTTP

**Standardowe ErrorResponse:**
```typescript
{
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  }
}
```

**Kody błędów dla autentykacji:**
- `VALIDATION_ERROR` (400)
- `AUTHENTICATION_ERROR` (401)
- `CONFLICT` (409) - email already exists
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

### 2.5. Aktualizacja renderowania stron

**Obecna konfiguracja (astro.config.mjs):**
```javascript
output: "server"  // SSR dla wszystkich stron
```

**Strategia renderowania:**
- **Strony autentykacji (`/auth/*`):** SSR - aby sprawdzić czy user jest już zalogowany i ewentualnie przekierować
- **Strony chronione:** SSR z guard w layout (`ProtectedLayout.astro`)
- **Landing page (`/`):** SSR lub static (do decyzji - zależy czy będą personalizowane treści)

**Nowe pliki stron:**
```
src/pages/
├── auth/
│   ├── register.astro       (SSR)
│   ├── login.astro          (SSR)
│   ├── reset-password.astro (SSR)
│   └── update-password.astro (SSR)
├── library.astro             (SSR + Protected)
├── generate.astro            (SSR + Protected)
├── study.astro               (SSR + Protected)
└── index.astro               (SSR/Static)
```

**Wykorzystanie `export const prerender`:**
- Dla endpointów API: `export const prerender = false` (już obecne)
- Dla stron: domyślnie SSR (zgodnie z `output: "server"`)

## 3. SYSTEM AUTENTYKACJI Z SUPABASE

### 3.1. Konfiguracja Supabase Auth

**Wymagane zmienne środowiskowe (.env):**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # anon/public key
```

**Konfiguracja Supabase Dashboard:**
1. **Email Auth:** Włączony (domyślnie)
2. **Email Templates:** Dostosowanie szablonów dla reset hasła
3. **Redirect URLs:** Whitelist `https://yourdomain.com/auth/update-password`
4. **JWT Settings:** Domyślne (expiry: 3600s)

### 3.2. Flow autentykacji w Astro

#### Rejestracja
```typescript
// src/pages/api/auth/register.ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

if (error) throw error;

// Session automatycznie ustawiona przez Supabase
return new Response(JSON.stringify({ user: data.user }), { status: 201 });
```

#### Logowanie
```typescript
// src/pages/api/auth/login.ts
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) throw error;

// Session cookie automatycznie zarządzane przez Supabase client
return new Response(JSON.stringify({ user: data.user }), { status: 200 });
```

#### Wylogowanie
```typescript
// src/pages/api/auth/logout.ts
const { error } = await supabase.auth.signOut();

if (error) throw error;

return new Response(null, { status: 204 });
```

### 3.3. Zarządzanie sesją

**Mechanizm:**
- Supabase automatycznie zarządza session przez cookies
- Access token (JWT) przechowywany w cookie (httpOnly, secure)
- Refresh token również w cookie
- Middleware (`src/middleware/index.ts`) ekstraktuje user z sesji przy każdym request

**Lifetime sesji:**
- Access token: 1 godzina (domyślnie)
- Refresh token: 30 dni
- Auto-refresh przez Supabase client

**Weryfikacja autentykacji w middleware:**
```typescript
// src/middleware/index.ts (już zaimplementowane)
const { data: { user } } = await supabase.auth.getUser();
context.locals.user = user;  // null jeśli niezalogowany
```

### 3.4. Server-side protection

**ProtectedLayout.astro:**
```typescript
---
const user = Astro.locals.user;

if (!user) {
  const redirectUrl = Astro.url.pathname;
  return Astro.redirect(`/auth/login?redirect=${redirectUrl}`);
}
---

<Layout title="10xCards">
  <Navbar user={user} />
  <main>
    <slot />
  </main>
</Layout>
```

**Wzorzec dla chronionych endpointów API (już stosowany):**
```typescript
export async function POST(context: APIContext) {
  const { user } = context.locals;

  if (!user) {
    return new Response(
      JSON.stringify({ error: { code: "AUTHENTICATION_ERROR", message: "Unauthenticated" } }),
      { status: 401 }
    );
  }

  // ... reszta logiki
}
```

### 3.5. Client-side API calls z autentykacją

**Fetch z automatyczną autentykacją:**
```typescript
// Supabase automatycznie dołącza Authorization header
// jeśli session istnieje w cookies

// src/components/auth/LoginForm.tsx
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'same-origin',  // Ważne dla cookies
});
```

**Uwaga:** Supabase client po stronie klienta nie jest potrzebny dla prostej autentykacji email/hasło. Całość odbywa się przez API endpointy.

### 3.6. Email templates (Supabase)

**Reset hasła:**
- Template w Supabase Dashboard → Authentication → Email Templates
- Link zawiera token: `{{ .ConfirmationURL }}`
- Redirect URL: `https://yourdomain.com/auth/update-password`

### 3.7. Row Level Security (RLS)

**Tabela `flashcards`:**
```sql
-- Już zaimplementowane RLS policies (zgodnie z migracjami)
-- User może tylko CRUD własnych fiszek

CREATE POLICY "Users can view own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- itd.
```

**Tabela `generations`:**
```sql
-- Analogiczne policies dla generations
```

## 4. KONTRAKTY I TYPY

### 4.1. Rozszerzenie types.ts

**Dodanie typów dla autentykacji (już częściowo obecne):**
```typescript
// src/types.ts
export interface AuthCommand {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
}

export interface ResetPasswordCommand {
  email: string;
}

export interface UpdatePasswordCommand {
  password: string;
}
```

### 4.2. Rozszerzenie env.d.ts

**Brak zmian - już prawidłowo zdefiniowane:**
```typescript
// src/env.d.ts
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;  // ✓ Już zaimplementowane
    }
  }
}
```

## 5. CHECKLIST IMPLEMENTACYJNY

### Frontend
- [ ] Utworzyć `AuthLayout.astro`
- [ ] Utworzyć `ProtectedLayout.astro` z guard
- [ ] Utworzyć `RegisterForm.tsx` z walidacją
- [ ] Utworzyć `LoginForm.tsx`
- [ ] Utworzyć `ResetPasswordForm.tsx`
- [ ] Utworzyć `UpdatePasswordForm.tsx`
- [ ] Utworzyć `LogoutButton.tsx`
- [ ] Utworzyć `Navbar.astro` z przyciskiem wylogowania
- [ ] Utworzyć strony: `/auth/register.astro`, `/auth/login.astro`, `/auth/reset-password.astro`, `/auth/update-password.astro`
- [ ] Zaktualizować `/index.astro` (landing page z CTA)
- [ ] Utworzyć `/library.astro`, `/generate.astro`, `/study.astro` z `ProtectedLayout`

### Backend
- [ ] Utworzyć `auth.schema.ts` z walidacją Zod
- [ ] Utworzyć `auth.service.ts` z funkcjami Supabase Auth
- [ ] Utworzyć endpoint `POST /api/auth/register`
- [ ] Utworzyć endpoint `POST /api/auth/login`
- [ ] Utworzyć endpoint `POST /api/auth/logout`
- [ ] Utworzyć endpoint `POST /api/auth/reset-password`
- [ ] Utworzyć endpoint `POST /api/auth/update-password`
- [ ] Rozszerzyć typy w `types.ts`
- [ ] Dodać obsługę redirect URL w loginie

### Supabase
- [ ] Skonfigurować Email Auth w Supabase Dashboard
- [ ] Dostosować email template dla reset hasła
- [ ] Dodać Redirect URLs do whitelist
- [ ] Zweryfikować RLS policies dla `flashcards` i `generations`

### Testy
- [ ] Przetestować flow rejestracji
- [ ] Przetestować flow logowania
- [ ] Przetestować flow wylogowania
- [ ] Przetestować reset hasła
- [ ] Przetestować ochronę stron chronionych
- [ ] Przetestować ochronę API endpoints
- [ ] Przetestować komunikaty błędów

## 6. ZGODNOŚĆ Z ISTNIEJĄCĄ APLIKACJĄ

### 6.1. Brak breaking changes
- Obecny endpoint `POST /api/flashcards` już wymaga autentykacji ✓
- Middleware już ekstraktuje user ✓
- RLS już skonfigurowane w bazie danych ✓
- TypeScript types już definiują `AuthCommand` ✓

### 6.2. Rozszerzenia
- Dodanie nowych stron autentykacji (nie wpływa na istniejące)
- Dodanie nowych endpointów API (nie wpływa na istniejące)
- Dodanie layoutów (nie wpływa na istniejące komponenty)
- Wykorzystanie istniejącego middleware (bez zmian)

### 6.3. Integracja z istniejącymi funkcjami
- Generator AI: Już chroniony przez middleware (wymaga `user` w `context.locals`)
- Biblioteka fiszek: Będzie używać `ProtectedLayout`
- Sesja nauki: Będzie używać `ProtectedLayout`
- Wszystkie operacje CRUD na fiszkach: Już wymagają autentykacji przez RLS

## 7. BEZPIECZEŃSTWO

### 7.1. Best practices
- **Hasła:** Hashowane przez Supabase (bcrypt)
- **JWT:** HttpOnly cookies, Secure flag w produkcji
- **CSRF:** Supabase client automatycznie zabezpiecza
- **Rate limiting:** Do rozważenia w przyszłości (Supabase ma built-in)
- **Email enumeration prevention:** Reset password zawsze zwraca 200
- **Redirect validation:** Walidacja `redirect` URL przed przekierowaniem
