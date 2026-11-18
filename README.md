# 🕵️ Cyborg w Środku

Gra śledcza na telefony komórkowe — wykład 7 „Serwery WWW” (Usługi sieciowe) w postaci 45-minutowej rozgrywki zespołowej. Bohaterowie: James Bond, Arsène Lupin, Herlock Sholmes, Gulbuddina i Stara Kornacka; zagadka: kto jest Człowiekiem-w-Środku, który podmienił list Corobo.

Zakres: HTTP (żądanie, odpowiedź, metody, kody, nagłówki, Host), HTTP/1.1–3, Apache i Nginx, HTTPS i certyfikaty, dzienniki i bezpieczeństwo.

## Jak to działa
- 6 aktów po 5 ogniw; w zespole (2–5 osób) każdy telefon pokazuje **inne dowody**, a cyfry z rozwiązanych ogniw kapitan wpisuje w sejf.
- Wspólny zegar (kod sesji od prowadzącego), prolog 2:30, akty 5:30–7:00, finał 5:00.
- Tryb treningowy (samodzielny, bez zegara) do powtórki.
- Wynik zespołu: maks. 1250 pkt; raport przez QR do panelu prowadzącego (`host.html`). Brak serwera i kont.

## Uruchomienie
```
npm test          # testy jednostkowe (Node ≥ 18)
npm run serve     # http://localhost:8080
npm run e2e       # test przeglądarkowy (Playwright), wymaga działającego serwera
```
Wdrożenie: włączyć GitHub Pages (Settings → Pages → „GitHub Actions”); workflow `.github/workflows/pages.yml` testuje i publikuje.

Przewodnik dla prowadzącego: [docs/PROWADZACY.md](docs/PROWADZACY.md).

## Technika
Czysty JavaScript (bez budowania), PWA z service workerem, moduły UMD (przeglądarka i Node), kod QR: qrcode-generator (MIT). Treść: `js/content/`.

Licencja: MIT.
