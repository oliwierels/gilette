# Gil — panel dźwięków (Dni Otwarte Gillette)

Panel z 22 komendami. Każda ma numer, jednozdaniowy opis, pełny tekst i przycisk odtwarzania.

## Uruchomienie lokalne
    npm install
    npm start        # http://localhost:3000

## Railway
1. Wrzuć ten folder do repozytorium GitHub i w Railway wybierz „Deploy from GitHub repo” (start: `npm start`).
2. Wszystkie nagrania są już w folderze `audio/`, więc panel gra od razu po wdrożeniu. Volume w `/data` ze zmienną `DATA_DIR=/data` jest potrzebny tylko wtedy, gdy chcesz podmieniać nagrania z panelu na stałe.
3. Wygeneruj domenę i otwórz panel.

## Nagrania
- „Wgraj pliki (01…20)” przyjmuje wiele plików naraz; numer na początku nazwy pliku przypisuje nagranie do komendy.
- Przycisk „Wgraj/Podmień” przy komendzie wgrywa jeden plik niezależnie od nazwy.
- Teksty i opisy komend są w `cues.json`. Tekst do wygenerowania nagrań jest w `PROMPT_dzwieki.md`.

## Obsługa
- Spacja lub „Następny” gra kolejną komendę ze scenariusza; komendy „Dodatkowe” (18–22) odpala się tylko ręcznie.
- STOP, Esc albo ponowne kliknięcie grającej komendy przerywa.
- Po otwarciu panel pobiera wszystkie nagrania do pamięci, więc grają także po zerwaniu internetu (do odświeżenia strony).
