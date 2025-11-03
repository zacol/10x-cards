# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

10xCards to aplikacja internetowa zaprojektowana w celu rozwiązania problemu czasochłonnego tworzenia fiszek edukacyjnych. Aplikacja wykorzystuje sztuczną inteligencję (AI) do automatycznego generowania fiszek z tekstu dostarczonego przez użytkownika, znacznie przyspieszając proces nauki. Użytkownicy mogą również tworzyć, edytować i zarządzać fiszkami manualnie. Wszystkie fiszki są zintegrowane z prostym algorytmem powtórek (spaced repetition), aby zoptymalizować proces zapamiętywania.

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem powolnym i pracochłonnym. Uczniowie, studenci i osoby uczące się samodzielnie często rezygnują z tej efektywnej metody nauki, ponieważ barierą staje się sam wysiłek wymagany do przygotowania materiałów. Istniejące narzędzia często wymagają ręcznego wprowadzania każdej fiszki, co jest nieefektywne przy dużych partiach materiału, np. notatkach z wykładu czy rozdziałach podręcznika. 10xCards ma na celu zautomatyzowanie i uproszczenie tego procesu, czyniąc naukę metodą powtórek bardziej dostępną.

## 3. Wymagania funkcjonalne

### 3.1. System Użytkowników

- Użytkownik musi mieć możliwość założenia konta za pomocą adresu e-mail i hasła.
- Użytkownik musi mieć możliwość zalogowania się na swoje konto.
- Sesja użytkownika musi być utrzymywana po zalogowaniu.

### 3.2. Zarządzanie Treścią (Fiszki)

- Użytkownik musi mieć możliwość wygenerowania fiszek za pomocą AI poprzez wklejenie tekstu (limit 1000-10000 znaków).
- Generator AI musi zawierać opcjonalne pole "kontekst/temat" w celu poprawy jakości generowanych fiszek.
- Użytkownik musi mieć możliwość manualnego tworzenia fiszek (Awers: limit 200 znaków, Rewers: limit 400 znaków).
- Musi istnieć centralny widok "Biblioteka" z listą wszystkich fiszek.
- Użytkownik musi mieć możliwość edycji pojedynczej fiszki (w oknie modalnym).
- Użytkownik musi mieć możliwość usunięcia pojedynczej fiszki.

### 3.3. Sesja Nauki

- Interfejs sesji nauki musi wyświetlać najpierw awers fiszki, a po interakcji użytkownika (kliknięcie przycisku) - rewers.
- Po odkryciu rewersu, użytkownik musi mieć możliwość oceny swojej znajomości fiszki za pomocą trzech opcji: "Don't know", "I know", "Very easy".
- Aplikacja musi integrować się z gotową biblioteką open-source implementującą algorytm powtórek.

### 3.4. Wymagania Techniczne

- Aplikacja musi być zintegrowana z API OpenRouter.ai w celu generowania fiszek.
- Musi być zdefiniowany domyślny model AI oraz model zapasowy (fallback).
- Prompt wysyłany do AI musi zawierać instrukcję, aby zwracać dane w formacie JSON.
- Aplikacja musi walidować dane wejściowe z formularzy (np. limity znaków).
- Aplikacja musi obsługiwać błędy (np. błąd API podczas generowania fiszek) i informować o nich użytkownika.
- Aplikacja musi wyświetlać "puste stany" (empty states) w widokach, gdy użytkownik nie ma jeszcze żadnych fiszek.
- W bazie danych, każda fiszka musi mieć pole `created_by_ai: boolean`.

## 4. Granice produktu

Następujące funkcje i elementy celowo NIE wchodzą w zakres MVP:

- Zaawansowany, autorski algorytm powtórek (jak w SuperMemo czy Anki).
- Import fiszek z plików (np. PDF, DOCX, CSV).
- Organizowanie fiszek w talii.
- Współdzielenie fiszek między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Dedykowane aplikacje mobilne (produkt będzie dostępny tylko jako aplikacja webowa).
- Dedykowany proces onboardingu użytkownika (zastąpiony przez "puste stany").

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji używając mojego adresu e-mail i hasła, aby móc zapisywać moje fiszki i postępy w nauce.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - System waliduje poprawność formatu adresu e-mail.
  - System wymaga hasła o minimalnej długości (np. 8 znaków).
  - Po pomyślnej rejestracji, użytkownik jest automatycznie zalogowany i przekierowany do głównego widoku aplikacji.
  - W przypadku, gdy e-mail jest już zajęty, wyświetlany jest odpowiedni komunikat błędu.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto używając mojego adresu e-mail i hasła, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po podaniu poprawnych danych, użytkownik jest zalogowany i przekierowany do głównego widoku aplikacji (Biblioteki).
  - W przypadku podania błędnych danych, wyświetlany jest odpowiedni komunikat błędu.

### 5.2. Generowanie Fiszek przez AI

- ID: US-003
- Tytuł: Generowanie fiszek z tekstu
- Opis: Jako użytkownik, chcę wkleić tekst (np. notatki z wykładu) do generatora, opcjonalnie dodać kontekst i kliknąć "Generuj", aby AI stworzyło dla mnie propozycje fiszek.
- Kryteria akceptacji:
  - Strona generatora zawiera duże pole tekstowe na wklejany materiał (min. 1000, max. 10000 znaków).
  - Strona zawiera opcjonalne pole tekstowe "kontekst/temat".
  - Przycisk "Generuj" jest nieaktywny, dopóki pole tekstowe nie zawiera tekstu o wymaganej długości.
  - Po kliknięciu "Generuj" wyświetlany jest wskaźnik ładowania.
  - Po zakończeniu generowania, użytkownik widzi listę proponowanych fiszek (awers i rewers).
  - W przypadku błędu API, użytkownik widzi stosowny komunikat.

- ID: US-004
- Tytuł: Przeglądanie i akceptacja wygenerowanych fiszek
- Opis: Jako użytkownik, po wygenerowaniu propozycji fiszek przez AI, chcę je przejrzeć, edytować lub usunąć te niepoprawne, a następnie zapisać resztę.
- Kryteria akceptacji:
  - Każda wygenerowana fiszka na liście propozycji ma opcję "Edit" i "Delete".
  - Edycja pozwala na modyfikację tekstu awersu i rewersu w miejscu (inline).
  - Usunięcie usuwa fiszkę z listy propozycji.
  - Przycisk "Zapisz fiszki" zapisuje wszystkie widoczne na liście propozycje.
  - Po zapisaniu, użytkownik jest przekierowywany do widoku Biblioteki, gdzie widzi nowo dodane fiszki.
  - Zapisane fiszki mają w bazie danych ustawioną flagę `created_by_ai` na `true`.

### 5.3. Zarządzanie Manualne

- ID: US-005
- Tytuł: Manualne tworzenie fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki poprzez wypełnienie formularza z awersem i rewersem.
- Kryteria akceptacji:
  - W widoku Biblioteki znajduje się przycisk "A".
  - Po kliknięciu, użytkownik widzi formularz, który zawiera pole na awers (limit 200 znaków) i rewers (limit 400 znaków).
  - Po wypełnieniu i zapisaniu, nowa fiszka jest widoczna na liście w Bibliotece.
  - Zapisana fiszka ma w bazie danych ustawioną flagę `created_by_ai` na `false`.

- ID: US-006
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować treść awersu lub rewersu istniejącej fiszki z poziomu mojej Biblioteki.
- Kryteria akceptacji:
  - Każda fiszka na liście w Bibliotece ma przycisk "Edit".
  - Kliknięcie przycisku otwiera okno modalne z formularzem zawierającym aktualną treść awersu i rewersu.
  - Użytkownik może zmienić treść i zapisać zmiany.
  - Po zapisaniu, okno modalne zamyka się, a lista fiszek w Bibliotece jest odświeżona i pokazuje zaktualizowaną treść.

- ID: US-007
- Tytuł: Usuwanie istniejącej fiszki
- Opis: Jako użytkownik, chcę móc trwale usunąć fiszkę, której już nie potrzebuję, z poziomu mojej Biblioteki.
- Kryteria akceptacji:
  - Każda fiszka na liście w Bibliotece ma przycisk "Delete".
  - Kliknięcie przycisku wymaga od użytkownika potwierdzenia operacji (np. przez okno dialogowe "Czy na pewno chcesz usunąć?").
  - Po potwierdzeniu, fiszka jest trwale usuwana z bazy danych, a lista w Bibliotece jest odświeżana.

### 5.4. Sesja Nauki

- ID: US-008
- Tytuł: Przebieg nauki fiszki
- Opis: Jako użytkownik w trakcie sesji nauki, chcę zobaczyć awers fiszki, następnie kliknąć przycisk, aby zobaczyć rewers, a na końcu ocenić swoją znajomość odpowiedzi.
- Kryteria akceptacji:
  - Interfejs wyświetla awers fiszki oraz przycisk "Show answer".
  - Po kliknięciu przycisku, rewers fiszki jest odsłaniany.
  - Pod rewersem pojawiają się trzy przyciski oceny: "Don't know", "I know", "Very easy".
  - Kliknięcie jednego z przycisków oceny zapisuje wynik, aktualizuje dane algorytmu dla tej fiszki i automatycznie wczytuje kolejną fiszkę do powtórki.
  - Po przejściu wszystkich zaplanowanych fiszek, użytkownik widzi ekran podsumowania sesji.

### 5.5. Widoki i Nawigacja

- ID: US-009
- Tytuł: Nawigacja po Bibliotece
- Opis: Jako użytkownik, chcę w widoku "Biblioteka" widzieć listę moich fiszek.
- Kryteria akceptacji:
  - Interfejs Biblioteki wyświetla listę fiszek (awers i rewers).

- ID: US-010
- Tytuł: Obsługa pustych stanów
- Opis: Jako nowy użytkownik, który nie ma jeszcze żadnych treści, chcę widzieć pomocne komunikaty i wskazówki, co robić dalej.
- Kryteria akceptacji:
  - If I have no flashcards, the Flashcard Library view displays a message (e.g. "You have no flashcards yet. Create them manually or generate them using AI.") with a button leading to the AI generator.
  - Jeśli nie mam żadnych talii, widok "Sesja Nauki" pokazuje komunikat zachęcający do stworzenia fiszek.

## 6. Metryki sukcesu

### 6.1. Akceptacja fiszek wygenerowanych przez AI

- Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
- Sposób pomiaru:
  - "Akceptacja" jest definiowana jako brak edycji lub usunięcia fiszki przez użytkownika podczas pierwszej sesji przeglądania po wygenerowaniu.
  - Metryka będzie śledzona poprzez analizę zdarzeń: `flashcard_generated`, `flashcard_edited_in_review`, `flashcard_deleted_in_review`.
  - Wzór: `(Liczba fiszek zapisanych - Liczba fiszek edytowanych/usuniętych w przeglądzie) / Liczba fiszek zapisanych`.

### 6.2. Wykorzystanie generatora AI

- Cel: Użytkownicy tworzą 75% wszystkich fiszek z wykorzystaniem generatora AI.
- Sposób pomiaru:
  - W bazie danych każda fiszka będzie miała pole `created_by_ai: boolean`.
  - Metryka będzie obliczana jako stosunek liczby fiszek z `created_by_ai = true` do całkowitej liczby fiszek w systemie.
  - Wzór: `COUNT(fiszki WHERE created_by_ai = true) / COUNT(wszystkie fiszki)`.
