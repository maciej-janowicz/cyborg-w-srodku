# Przewodnik prowadzącego (45 minut)

## Przed zajęciami (5 minut)
1. Proszę otworzyć `host.html` (adres strony gry + `/host.html`) na swoim telefonie lub laptopie.
2. „Start za 5 min” tworzy sesję: kod (np. `0G1-90P`), kod QR i link dla studentów. Proszę wyświetlić QR na rzutniku lub podać kod.
3. Studenci siadają w zespołach po 4–5 osób (najlepiej 4–5; przy 2–3 osobach jedna osoba prowadzi kilka ogniw). Każdy wybiera zespół i rolę; rola 1 (Bond) jest kapitanem.

## Przebieg (zegar wspólny dla wszystkich telefonów)
| Czas | Część | Co robi prowadzący |
|---|---|---|
| 0:00–2:30 | Prolog | Wprowadzenie fabularne |
| 2:30–8:30 | Akt I — HTTP, żądanie, Host | Panel pokazuje, co powiedzieć |
| 8:30–14:30 | Akt II — metody, kody, nagłówki | |
| 14:30–20:00 | Akt III — HTTP/1.1, 2, 3 | |
| 20:00–27:00 | Akt IV — Apache, Nginx | |
| 27:00–34:00 | Akt V — HTTPS, certyfikaty | |
| 34:00–40:00 | Akt VI — dzienniki, bezpieczeństwo | |
| 40:00–45:00 | Finał — oskarżenie i rozstrzygnięcie | Kapitanowie pokazują QR z raportem |

Każdy akt ma fazę pracy (większość czasu) i fazę rozwiązania (ok. 45–55 s): wtedy proszę powiedzieć podsumowanie z panelu („Co powiedzieć”) — to jedyne momenty, w których prowadzący mówi dłużej.

## Na koniec
Kapitan pokazuje QR (aparat telefonu otwiera `host.html` z raportem) albo przekazuje kod. Tablica wyników zbiera raporty; „Kopiuję CSV” eksportuje wynik.

## Uwagi
- Zegar korzysta z nagłówka `Date` pliku `ping.txt` (GitHub Pages go zwraca). Bez sieci używany jest zegar telefonu.
- iOS: panel prowadzącego warto otwierać w tej samej przeglądarce, w której utworzono sesję (pamięć lokalna).
- Klucze odpowiedzi znajdują się w kodzie strony (gra jest statyczna, bez serwera) — wynik to zabawa, nie egzamin.
- Winowajcę można zmienić w `js/content/core.js` (`culprit`), pod warunkiem dostosowania dowodów w aktach.
- Skrócenie lub wydłużenie aktów: `durSec` i `revealSec` w plikach `js/content/actN.js`.
