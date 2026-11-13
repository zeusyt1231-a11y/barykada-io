# Barykada.io — wersja online (beta)

Zombie survival .io dla wielu graczy z czatem. Serwer w czystym Node.js — **bez żadnych zależności do instalowania**.

## Co jest w paczce

| Plik | Do czego służy |
|---|---|
| `server.js` | Serwer: strona gry, połączenia WebSocket, pokoje, czat |
| `game.js` | Symulacja gry (mapa, boty, zombie, barykady) — liczona na serwerze |
| `public/index.html` | Gra online w przeglądarce |
| `public/offline.html` | Wersja jednoosobowa z botami (działa bez serwera) |
| `render.yaml` | Gotowa konfiguracja dla Render.com |
| `package.json` | Opis projektu dla hostingu |

## Wdrożenie za darmo na Render.com (ok. 10 minut)

1. **GitHub** — załóż darmowe konto na <https://github.com>, kliknij **New repository**, nazwij je np. `barykada-io` (może być publiczne lub prywatne) i utwórz.
2. W nowym repozytorium kliknij **Add file → Upload files** i przeciągnij **całą zawartość** tego folderu (razem z folderem `public`). Kliknij **Commit changes**.
3. **Render** — wejdź na <https://render.com>, zaloguj się przez GitHub.
4. Kliknij **New + → Blueprint**, wybierz swoje repozytorium `barykada-io` i potwierdź (**Apply**). Render sam odczyta `render.yaml` i ustawi darmowy serwer.
   - Jeśli wolisz ręcznie: **New + → Web Service**, wybierz repozytorium, ustaw: *Runtime* `Node`, *Build Command* `npm install`, *Start Command* `node server.js`, *Instance Type* `Free`.
5. Po 1–3 minutach dostaniesz adres w stylu `https://barykada-io.onrender.com` — to link do gry. Wyślij go znajomym.

Każda zmiana wrzucona później na GitHub wdroży się automatycznie.

### Ważne o darmowym planie Render

- Serwer **usypia po 15 minutach bez graczy**. Pierwsze wejście po przerwie trwa ok. **1 minuty** (Render pokazuje wtedy ekran ładowania) — potem działa normalnie.
- Darmowy limit to 750 godzin pracy serwera miesięcznie na konto.
- Zdrowie serwera sprawdzisz pod adresem `/health`.

## Uruchomienie u siebie (test)

Potrzebny Node.js 18 lub nowszy:

```
node server.js
```

Gra będzie pod adresem <http://localhost:3000>. Otwórz dwie karty przeglądarki, żeby zobaczyć tryb wieloosobowy. Inny port: `PORT=8080 node server.js`.

## Jak działa rozgrywka online

- Pokój mieści do **12 graczy**. Brakujące miejsca zajmują boty; gdy dołącza człowiek, zastępuje bota. Gdy pokój jest pełny, serwer otwiera kolejny.
- Rundy lecą bez przerwy: 60 s przygotowania → 5 min nocy → 12 s podsumowania → nowa mapa.
- Kto wejdzie w trakcie przygotowań, zaczyna jako ocalały; kto w nocy — jako zombie.
- **Czat:** `Enter` otwiera pole, `Enter` wysyła, `Esc` anuluje (na telefonie przycisk CZAT). Limit: 140 znaków, kilka wiadomości na kilka sekund.
- Poziom, punkty i umiejętności zapisują się **w przeglądarce gracza** (localStorage) — każdy gracz ma swój postęp na swoim urządzeniu.

## Znane ograniczenia bety

- Serwer ufa danym o poziomie postaci przesyłanym przez przeglądarkę — ktoś obeznany mógłby je podrobić. Do zabawy ze znajomymi to wystarczy; przy publicznym serwerze warto dodać konta i zapis postępu po stronie serwera.
- Brak moderacji czatu poza limitem długości i częstotliwości wiadomości.
- Darmowy serwer ma ograniczoną moc — przy wielu pełnych pokojach naraz może zwalniać.
