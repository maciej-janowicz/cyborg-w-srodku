/* Akt I — Targ w Pcimiu Tylnym: model klient–serwer i podstawy HTTP. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.actData = root.CM.actData || {}; root.CM.actData[1] = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    roman: 'I',
    icon: '🧺',
    title: 'Targ w Pcimiu Tylnym',
    subtitle: 'Klient, serwer i rozmowa bez pamięci',
    setting: 'Stara Kornacka zwołała naradę przy swoim straganie. Sprzedaje tu wszystko, od śrub po szczotki z włosia — i twierdzi, że każdy serwer WWW zachowuje się jak kupiec na targu.',
    durSec: 360,
    revealSec: 50,

    briefing: [
      { title: 'Klient i serwer', icon: '🧺', blocks: [
        { p: '**Klient (przeglądarka)** inicjuje połączenie z serwerem, wysyła żądania HTTP, odbiera i wyświetla odpowiedzi (HTML, CSS, JavaScript) oraz obsługuje interakcję użytkownika z siecią.' },
        { p: '**Serwer WWW** nasłuchuje na określonym porcie (domyślnie **80** dla HTTP i **443** dla HTTPS), przyjmuje żądania od klientów i je przetwarza: wydaje plik statyczny albo generuje stronę dynamicznie.' },
        { voice: { who: 'Stara Kornacka', text: 'Klient podchodzi do straganu i prosi o towar. Kupiec stoi i czeka. Nigdy odwrotnie — kupiec nie biega za klientami po rynku.' } }
      ] },
      { title: 'Protokół bez pamięci', icon: '🧠', blocks: [
        { p: '**HTTP** (HyperText Transfer Protocol) to protokół warstwy aplikacji. Działa w modelu **żądanie–odpowiedź**, używa tekstowego formatu komunikatów i jest **bezstanowy**: każde żądanie jest niezależne, a serwer nie pamięta poprzednich interakcji z klientem.' },
        { p: 'Porty domyślne: **80** (HTTP) i **443** (HTTPS).' },
        { voice: { who: 'Stara Kornacka', text: 'Mój kupiec ma pamięć złotej rybki: za każdym razem pyta „W czym mogę pomóc?”. Żeby poznawał stałych klientów, trzeba mu dać karteczkę — to ciasteczka i sesje, ale to już dodatek ponad samym HTTP.' } }
      ] },
      { title: 'Anatomia rozmowy', icon: '🔬', blocks: [
        { p: 'Żądanie: **metoda, ścieżka, wersja protokołu**, potem nagłówki. Odpowiedź: **wiersz statusu**, nagłówki, pusta linia i treść.' },
        { code: ['GET /index.html HTTP/1.1', 'Host: www.example.com', 'User-Agent: Mozilla/5.0', 'Accept: text/html'] },
        { code: ['HTTP/1.1 200 OK', 'Content-Type: text/html', 'Content-Length: 1234', '', '<html>…</html>'] },
        { ul: [
          '`Host` — o którą witrynę chodzi,',
          '`User-Agent` — kto pyta,',
          '`Content-Type` — rodzaj treści,',
          '`Content-Length` — długość **treści** w bajtach (bez nagłówków).'
        ] }
      ] }
    ],

    questions: [
      {
        id: 'a1q1', title: 'Która linia wskazuje witrynę?', digit: 4,
        evidence: { title: 'Dowód 1/5 · żądanie z telefonu Abhidhammapitaki', kind: 'code', lines: [
          'GET /listy/corobo.html HTTP/1.1',
          'Host: listy.cyborgi.example',
          'User-Agent: Mozilla/5.0 (Linux; Android 14)',
          'Accept: text/html'
        ] },
        ask: 'Na jednym serwerze działa wiele witryn. Która linia mówi serwerowi, o którą z nich pyta klient?',
        kind: 'choice',
        options: [
          'GET /listy/corobo.html HTTP/1.1',
          'Host: listy.cyborgi.example',
          'User-Agent: Mozilla/5.0 (Linux; Android 14)',
          'Accept: text/html',
          'Pieczątka Starej Kornackiej na marginesie'
        ],
        correct: 1,
        hints: ['To jeden z nagłówków, a nie wiersz żądania. Pytanie dotyczy nazwy domeny.',
                'Szukaj linii, w której występuje sama nazwa domeny, bez ścieżki do pliku.'],
        explain: 'Nagłówek Host wskazuje domenę, której dotyczy żądanie. Dzięki niemu jeden serwer (jeden adres IP) obsługuje wiele witryn. Wrócimy do tego przy hostach wirtualnych w akcie IV.'
      },
      {
        id: 'a1q2', title: '44 bajty za dużo', digit: 1,
        evidence: { title: 'Dowód 2/5 · plik na serwerze i odpowiedź u klienta', kind: 'code', lines: [
          '$ ls -l /var/www/listy/corobo.html',
          '-rw-r--r-- 1 www-data www-data 1190 lis 12 09:14 corobo.html',
          '',
          '# nagłówki odpowiedzi przechwycone u Abhidhammapitaki:',
          'HTTP/1.1 200 OK',
          'Content-Type: text/html',
          'Content-Length: 1234'
        ] },
        ask: 'Serwer wysyła ten plik bez zmian, a odebrana odpowiedź ma Content-Length: 1234. Co z tego wynika?',
        kind: 'choice',
        options: [
          'Treść została zmieniona po drodze — ktoś stoi między serwerem a klientem.',
          'To normalne: serwer wlicza nagłówki do długości treści.',
          'Przeglądarka dopisała 44 bajty z własnej inicjatywy.',
          'HTTP jest bezstanowy, więc długość za każdym razem jest inna.',
          'Content-Length mierzy się w łokciach, więc wynik jest przybliżony.'
        ],
        correct: 0,
        hints: ['Czy nagłówki wchodzą do wartości Content-Length?',
                'Content-Length opisuje wyłącznie treść. Skoro plik ma 1190 bajtów, a odebrano 1234, ktoś musiał coś dopisać.'],
        explain: 'Content-Length to długość samej treści (bez nagłówków). Plik ma 1190 B, odpowiedź zapowiada 1234 B, więc po drodze ktoś dopisał 44 bajty — treść listu została zmieniona.'
      },
      {
        id: 'a1q3', title: 'Dlaczego serwer nie pamięta czytelnika?', digit: 8,
        evidence: { title: 'Dowód 3/5 · dziennik serwera listów', kind: 'code', lines: [
          '10:01:12  198.51.100.23  GET /listy/  → 200',
          '10:01:40  198.51.100.23  GET /listy/  → 200',
          '          (brak ciasteczka, brak identyfikatora sesji)',
          '10:01:40  serwer: „Kim Pan jest? Pierwszy raz Pana widzę.”'
        ] },
        ask: 'Ten sam czytelnik pyta po raz drugi, a serwer zachowuje się, jakby widział go pierwszy raz. Dlaczego?',
        kind: 'choice',
        options: [
          'Bo HTTP jest bezstanowy: każde żądanie jest niezależne od poprzednich.',
          'Bo serwer ma za mało pamięci RAM.',
          'Bo port 80 nie obsługuje historii połączeń.',
          'Bo przeglądarka wysłała zapytanie metodą POST zamiast GET.',
          'Bo serwer jest zazdrosny o wcześniejsze wizyty.'
        ],
        correct: 0,
        hints: ['To cecha samego protokołu, nie sprzętu ani portu.',
                'Odpowiedź zawiera słowo „bezstanowy”.'],
        explain: 'HTTP jest bezstanowy: serwer rozpatruje każde żądanie osobno. Aby rozpoznawać klienta, aplikacje dodają mechanizmy ponad protokołem — ciasteczka (cookies) i sesje.'
      },
      {
        id: 'a1q4', title: 'Domyślne porty WWW', digit: 6,
        evidence: { title: 'Dowód 4/5 · gniazda nasłuchujące na podejrzanej maszynie 203.0.113.66', kind: 'code', lines: [
          '$ ss -tln',
          'State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port',
          'LISTEN  0       128     0.0.0.0:22          0.0.0.0:*',
          'LISTEN  0       511     0.0.0.0:80          0.0.0.0:*',
          'LISTEN  0       511     0.0.0.0:443         0.0.0.0:*',
          'LISTEN  0       128     0.0.0.0:8080        0.0.0.0:*',
          'LISTEN  0       151     127.0.0.1:3306      0.0.0.0:*'
        ] },
        ask: 'Proszę zaznaczyć wiersze z domyślnymi portami protokołów HTTP oraz HTTPS (dokładnie dwa).',
        kind: 'lines',
        selectable: [2, 3, 4, 5, 6],
        correct: [3, 4],
        hints: ['HTTP to 80, a HTTPS to 443 — port 8080 jest tylko popularnym zamiennikiem.',
                'Szukaj w kolumnie Local Address:Port końcówek :80 oraz :443.'],
        explain: 'HTTP nasłuchuje domyślnie na porcie 80, a HTTPS na 443. Ta maszyna udaje więc serwer WWW, choć serwerem listów nie jest (to 198.51.100.5).'
      },
      {
        id: 'a1q5', title: 'Kto co robi na targu?', digit: 3,
        evidence: { title: 'Dowód 5/5 · zadanie Starej Kornackiej', kind: 'note', lines: [
          'Stara Kornacka: „Posortuj obowiązki, moja droga: co robi klient, a co kupiec?”'
        ] },
        ask: 'Proszę przypisać każdy obowiązek do właściwej strony.',
        kind: 'assign',
        items: [
          'Inicjuje połączenie',
          'Nasłuchuje na porcie 80 lub 443',
          'Wyświetla HTML, CSS i JavaScript użytkownikowi',
          'Przetwarza żądanie: wydaje plik statyczny albo generuje stronę',
          'Wysyła żądania HTTP',
          'Przyjmuje żądania od wielu klientów'
        ],
        buckets: ['Klient (przeglądarka)', 'Serwer WWW'],
        correct: [0, 1, 0, 1, 0, 1],
        hints: ['Kto „podchodzi do straganu”, a kto „stoi i czeka”?',
                'Wyświetlanie stron i wysyłanie żądań to rola klienta; nasłuchiwanie, przyjmowanie i przetwarzanie to rola serwera.'],
        explain: 'Klient inicjuje połączenie, wysyła żądania i wyświetla odpowiedzi. Serwer nasłuchuje, przyjmuje i przetwarza żądania.'
      }
    ],

    clue: {
      title: 'Dowód I · Ktoś stoi w środku',
      text: 'Treść listu po drodze urosła o 44 bajty, a maszyna 203.0.113.66 nasłuchuje na portach 80 i 443 jak serwer WWW, choć serwerem listów nie jest. Człowiek-w-Środku istnieje: stoi między serwerem listów a przeglądarkami i przerabia odpowiedzi.',
      attr: null, value: null
    },

    reveal: {
      takeaways: [
        'Klient inicjuje połączenie, serwer nasłuchuje (80 dla HTTP, 443 dla HTTPS).',
        'HTTP jest tekstowy, działa w modelu żądanie–odpowiedź i jest bezstanowy.',
        'Żądanie: metoda + ścieżka + wersja, nagłówki (np. Host); odpowiedź: status, nagłówki (Content-Type, Content-Length), treść.'
      ],
      next: 'Za chwilę Akt II: Herlock Sholmes rozkłada dziennik serwera.'
    },

    quick: [
      { t: 'To przeglądarka (klient) inicjuje połączenie z serwerem WWW.', a: true, why: 'Serwer tylko nasłuchuje i odpowiada na żądania.' },
      { t: 'HTTP jest protokołem bezstanowym: serwer nie pamięta wcześniejszych żądań klienta.', a: true, why: 'Pamięć zapewniają dopiero ciasteczka i sesje w aplikacji.' },
      { t: 'Nagłówek Content-Length zawiera łączną długość nagłówków i treści.', a: false, why: 'Dotyczy wyłącznie treści (body), w bajtach.' },
      { t: 'Domyślnym portem HTTPS jest 8080.', a: false, why: 'To port 443. Port 8080 bywa używany jako alternatywny dla HTTP.' }
    ],

    hostSay: {
      start: 'Akt I. Proszę zacząć od odprawy — półtorej minuty czytania. Potem każdy rozwiązuje swoje ogniwo i dyktuje cyfrę kapitanowi.',
      reveal: 'W jednym zdaniu: HTTP jest bezstanowy, więc „pamięć” klienta to ciasteczka i sesje. Content-Length to długość samej treści — dlatego 44 bajty różnicy zdradziły podmianę.'
    }
  };
}));
