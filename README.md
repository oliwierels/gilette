# Panel dźwięków robota

Jedna apka, kilka zestawów komend. Zestaw wybiera się zakładką u góry (Bartek / Oliwier); wybór jest pamiętany w przeglądarce, a adres z `#bartek` albo `#oliwier` otwiera od razu właściwy.

## Zestawy
Każdy zestaw to katalog `sets/<nazwa>/`:
- `meta.json` — nazwa zakładki i tytuł,
- `cues.json` — komendy (numer, grupa, tytuł, opis, pełny tekst),
- `audio/NN.mp3` — nagrania dołączone do apki.

Zestawy nie wpływają na siebie: zmiana plików w `sets/oliwier/` nie rusza `sets/bartek/`.

## Uruchomienie
    npm install
    npm start        # http://localhost:3000

Na Railway: deploy z repo, start `npm start`. Volume w `/data` ze zmienną `DATA_DIR=/data` jest potrzebny tylko wtedy, gdy nagrania podmieniane z panelu mają przetrwać kolejne wdrożenie.

## Obsługa
- Spacja lub „Następny” gra kolejną komendę; komendy z grupy „Dodatkowe” odpala się tylko ręcznie.
- STOP, Esc albo ponowne kliknięcie grającej komendy przerywa.
- Po otwarciu panel pobiera nagrania wybranego zestawu do pamięci, więc grają także po zerwaniu internetu (do odświeżenia strony lub zmiany zakładki).
- „Wgraj pliki” przyjmuje wiele plików naraz; numer na początku nazwy pliku przypisuje nagranie do komendy w bieżącym zestawie.
