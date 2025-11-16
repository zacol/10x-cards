# Plan Testów dla Aplikacji 10xCards

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji webowej 10xCards, która umożliwia automatyczne generowanie fiszek na podstawie tekstu dostarczonego przez użytkownika. Celem projektu jest przyspieszenie i uproszczenie procesu tworzenia materiałów do nauki.

### 1.2. Cele testowania

- **Weryfikacja funkcjonalności:** Zapewnienie, że wszystkie funkcje aplikacji, w tym rejestracja, logowanie, generowanie fiszek i zarządzanie nimi, działają zgodnie ze specyfikacją.
- **Zapewnienie jakości:** Identyfikacja i eliminacja błędów w celu zapewnienia wysokiej jakości produktu końcowego.
- **Ocena wydajności:** Weryfikacja, czy aplikacja działa płynnie i responsywnie, nawet przy większym obciążeniu.
- **Weryfikacja bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są odpowiednio chronione, a dostęp do zasobów jest właściwie kontrolowany.
- **Zapewnienie użyteczności:** Ocena, czy interfejs użytkownika jest intuicyjny i łatwy w obsłudze.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- Moduł uwierzytelniania (rejestracja, logowanie, wylogowywanie).
- Proces generowania fiszek na podstawie tekstu.
- Biblioteka fiszek (wyświetlanie, zarządzanie).
- Ochrona tras i dostęp do zasobów dla zalogowanych użytkowników.
- Walidacja formularzy po stronie klienta i serwera.
- Responsywność interfejsu użytkownika na różnych urządzeniach.

### 2.2. Funkcjonalności wyłączone z testów

- Testy samego modelu AI (zakładamy, że zewnętrzna usługa działa poprawnie).
- Testy infrastruktury Supabase (koncentrujemy się na integracji z usługą).

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe:** Weryfikacja poszczególnych komponentów React, funkcji pomocniczych i logiki biznesowej w izolacji.
- **Testy integracyjne:** Sprawdzenie współpracy między komponentami front-endowymi, endpointami API Astro oraz integracji z bazą danych Supabase.
- **Testy E2E (End-to-End):** Symulacja pełnych scenariuszy użytkowania z perspektywy użytkownika, np. od rejestracji po wygenerowanie i zapisanie fiszek.
- **Testy bezpieczeństwa:** Weryfikacja polityk RLS, ochrona przed atakami (np. XSS, CSRF) i kontrola dostępu.
- **Testy wydajnościowe:** Ocena czasu ładowania stron i responsywności aplikacji pod obciążeniem.
- **Testy regresji wizualnej:** Automatyczne porównywanie zrzutów ekranu interfejsu w celu wykrycia niezamierzonych zmian wizualnych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie

- **TC1.1:** Pomyślna rejestracja nowego użytkownika z poprawnymi danymi.
- **TC1.2:** Próba rejestracji z adresem e-mail, który już istnieje w systemie.
- **TC1.3:** Pomyślne logowanie z poprawnymi danymi uwierzytelniającymi.
- **TC1.4:** Próba logowania z nieprawidłowym hasłem lub adresem e-mail.
- **TC1.5:** Pomyślne wylogowanie i przekierowanie na stronę logowania.
- **TC1.6:** Próba dostępu do chronionej strony (np. `/library`) bez zalogowania.

### 4.2. Generowanie fiszek

- **TC2.1:** Pomyślne wygenerowanie fiszek po wprowadzeniu poprawnego tekstu.
- **TC2.2:** Wyświetlenie komunikatu o błędzie przy próbie generowania bez wprowadzenia tekstu.
- **TC2.3:** Obsługa błędów zwracanych przez API (np. przekroczenie limitu zapytań).
- **TC2.4:** Weryfikacja, czy wygenerowane fiszki są poprawnie zapisywane w bibliotece użytkownika.

### 4.3. Biblioteka fiszek

- **TC3.1:** Poprawne wyświetlanie listy wygenerowanych fiszek po zalogowaniu.
- **TC3.2:** Wyświetlanie komunikatu o pustej bibliotece dla nowego użytkownika.
- **TC3.3:** Weryfikacja, czy użytkownik widzi tylko swoje fiszki (test polityk RLS).

## 5. Środowisko testowe

- **Baza danych:** Oddzielna, dedykowana instancja projektu Supabase do celów testowych.
- **Przeglądarki:** Google Chrome (najnowsza wersja), Firefox (najnowsza wersja), Safari (najnowsza wersja).
- **Urządzenia:** Desktop, tablet (symulacja), smartfon (symulacja).
- **Środowisko uruchomieniowe:** Lokalna maszyna deweloperska oraz dedykowane środowisko stagingowe.

## 6. Narzędzia do testowania

- **Testy jednostkowe i integracyjne:** Vitest, React Testing Library.
- **Testy E2E:** Playwright.
- **Testy regresji wizualnej:** Playwright.
- **Linting i formatowanie:** ESLint, Prettier.
- **CI/CD:** GitHub Actions (do automatycznego uruchamiania testów).

## 7. Harmonogram testów

- Testy jednostkowe i integracyjne będą tworzone równolegle z rozwojem nowych funkcjonalności.
- Pełne cykle testów E2E i testów regresji będą uruchamiane automatycznie przed każdym wdrożeniem na środowisko produkcyjne.
- Testy bezpieczeństwa będą przeprowadzane kwartalnie oraz po wprowadzeniu istotnych zmian w module uwierzytelniania lub logice dostępu do danych.

## 8. Kryteria akceptacji testów

- **Kryterium wejścia:** Nowa funkcjonalność jest w pełni zaimplementowana i dostępna na środowisku testowym.
- **Kryterium wyjścia:**
  - 100% testów jednostkowych i integracyjnych dla nowej funkcjonalności przechodzi pomyślnie.
  - 100% krytycznych scenariuszy testowych E2E przechodzi pomyślnie.
  - Brak znanych błędów krytycznych i blokujących.
  - Wszystkie zidentyfikowane błędy o wysokim priorytecie zostały naprawione.

## 9. Role i odpowiedzialności w procesie testowania

- **Deweloperzy:** Odpowiedzialni za pisanie testów jednostkowych i integracyjnych, naprawę błędów oraz wsparcie w procesie testowania.
- **Inżynier QA:** Odpowiedzialny za tworzenie i utrzymanie planu testów, projektowanie scenariuszy testowych, automatyzację testów E2E oraz raportowanie błędów.
- **Product Owner:** Odpowiedzialny za weryfikację funkcjonalności z perspektywy biznesowej i ostateczną akceptację.

## 10. Procedury raportowania błędów

- Wszystkie zidentyfikowane błędy będą raportowane w systemie do śledzenia zadań (np. GitHub Issues).
- Każdy raport o błędzie musi zawierać:
  - Tytuł: Zwięzły opis problemu.
  - Opis: Szczegółowe kroki do odtworzenia błędu.
  - Oczekiwany rezultat: Jak aplikacja powinna się zachować.
  - Aktualny rezultat: Jak aplikacja faktycznie się zachowuje.
  - Priorytet: (Krytyczny, Wysoki, Średni, Niski).
  - Zrzuty ekranu lub nagrania wideo (jeśli dotyczy).
  - Informacje o środowisku (przeglądarka, system operacyjny).
