/* Akt VI — Dziennik varanów: wydajność, monitoring i dzienniki. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.actData = root.CM.actData || {}; root.CM.actData[6] = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    roman: 'VI',
    icon: '🦎',
    title: 'Dziennik varanów',
    subtitle: 'Wydajność, monitoring i dzienniki serwera',
    setting: 'Wataha waranów Starej Kornackiej wróciła z maszyny pośrednika z pełną paszczą dzienników. „Serwer zawsze coś zapisuje — powiedziała Kornacka — trzeba tylko umieć to czytać.”',
    durSec: 360,
    revealSec: 50,

    briefing: [
      { title: 'Cztery sposoby na szybszy serwer', icon: '🏎️', blocks: [
        { ul: [
          '**Pamięć podręczna (cache)**: w przeglądarce (`Cache-Control`, `Expires`), na serwerze (`mod_cache` w Apache) oraz w sieci dostarczania treści (CDN).',
          '**Kompresja**: np. `mod_deflate` w Apache zmniejsza rozmiar HTML, CSS i JavaScript.',
          '**Trwałe połączenia (Keep-Alive)**: mniejszy narzut na nawiązywanie połączeń TCP.',
          '**HTTP/2**: multipleksowanie, kompresja nagłówków, server push.'
        ] },
        { code: [
          '<IfModule mod_deflate.c>',
          '  AddOutputFilterByType DEFLATE text/html text/plain text/xml',
          '</IfModule>'
        ] }
      ] },
      { title: 'Dzienniki: co serwer zapisuje', icon: '📓', blocks: [
        { p: '**Dziennik dostępu (access log)** — każde żądanie: adres klienta, czas ze strefą czasową serwera, żądanie, kod i liczba bajtów.' },
        { code: ['192.168.1.100 - - [17/Nov/2026:14:23:45 +0100] "GET /index.html HTTP/1.1" 200 1234'] },
        { p: '**Dziennik błędów (error log)** — przyczyny problemów po stronie serwera, np. brakujący plik czy odmowa połączenia.' },
        { code: ['[Tue Nov 17 14:23:45.123456 2026] [core:error] [pid 12345] File does not exist: /var/www/missing.html'] },
        { voice: { who: 'Stara Kornacka', text: 'Kod 502 widać w dzienniku dostępu, ale dlaczego tak się stało, dowiesz się z dziennika błędów.' } }
      ] },
      { title: 'Narzędzia', icon: '📊', blocks: [
        { p: '**Analiza dzienników:**' },
        { ul: ['GoAccess — analiza w czasie rzeczywistym,', 'AWStats — statystyki webowe,', 'Logwatch — automatyczne raporty.'] },
        { p: '**Monitoring wydajności:**' },
        { ul: ['Apache: `mod_status`,', 'Nginx: `stub_status`,', 'Zabbix, Prometheus + Grafana,', 'New Relic, Datadog (komercyjne).'] }
      ] }
    ],

    questions: [
      {
        id: 'a6q1', title: 'Błędy serwera', digit: 4,
        evidence: { title: 'Dowód 1/5 · dziennik dostępu serwera listów', kind: 'code', lines: [
          '198.51.100.23 - - [17/Nov/2026:11:02:05 +0100] "GET /listy/ HTTP/1.1" 200 5120',
          '198.51.100.23 - - [17/Nov/2026:11:02:07 +0100] "GET /styl.css HTTP/1.1" 304 0',
          '198.51.100.41 - - [17/Nov/2026:11:03:15 +0100] "GET /stary-list.html HTTP/1.1" 404 196',
          '198.51.100.41 - - [17/Nov/2026:11:03:40 +0100] "POST /listy/nowy HTTP/1.1" 500 612',
          '198.51.100.52 - - [17/Nov/2026:11:04:02 +0100] "GET /listy/abhi.html HTTP/1.1" 200 1301',
          '198.51.100.52 - - [17/Nov/2026:11:04:31 +0100] "GET /listy/ HTTP/1.1" 503 299'
        ] },
        ask: 'Proszę zaznaczyć wszystkie wiersze z błędami po stronie SERWERA (rodzina 5xx).',
        kind: 'lines',
        selectable: [0, 1, 2, 3, 4, 5],
        correct: [3, 5],
        hints: ['Kod statusu stoi zaraz po cudzysłowie z żądaniem.',
                '404 to błąd klienta, 304 to „nie zmieniono”. Szukaj kodów zaczynających się od 5.'],
        explain: 'Kody 500 (Internal Server Error) i 503 (Service Unavailable) to błędy serwera. 404 jest błędem klienta, a 304 oznacza, że zasób się nie zmienił.'
      },
      {
        id: 'a6q2', title: 'Gdzie szukać przyczyny 502?', digit: 6,
        evidence: { title: 'Dowód 2/5 · dwa dzienniki pośrednika', kind: 'code', lines: [
          '# dziennik dostępu (access log):',
          '198.51.100.77 - - [17/Nov/2026:07:41:12 +0530] "GET /listy/corobo.html HTTP/2.0" 502 157',
          '',
          '# dziennik błędów (error log):',
          '2026/11/17 07:41:12 [error] 702#702: *318 connect() failed (111: Connection refused) while connecting to upstream, client: 198.51.100.77, request: "GET /listy/corobo.html HTTP/2.0", upstream: "http://198.51.100.5:80/listy/corobo.html"'
        ] },
        ask: 'Klient dostał kod 502. Gdzie najszybciej znajdzie się przyczynę?',
        kind: 'choice',
        options: [
          'W dzienniku błędów (error log) pośrednika: widać odmowę połączenia z serwerem docelowym.',
          'W dzienniku dostępu serwera docelowego — tam jest przyczyna 502.',
          'W raporcie Logwatch dostawcy łącza.',
          'W pliku /var/www/html/index.html.',
          'W kronice klasztoru w Tybecie (NY).'
        ],
        correct: 0,
        hints: ['Dziennik dostępu pokazuje, CO się stało (kod 502). Który dziennik pokazuje, DLACZEGO?',
                'Szukaj zapisu „[error]” i słów „Connection refused”.'],
        explain: 'Dziennik dostępu mówi, że klient dostał 502. Dlaczego — wyjaśnia dziennik błędów: pośrednik nie mógł połączyć się z serwerem docelowym (odmowa połączenia).'
      },
      {
        id: 'a6q3', title: 'Co znaczy +0530?', digit: 0,
        evidence: { title: 'Dowód 3/5 · dziennik dostępu pośrednika (maszyna 203.0.113.66)', kind: 'code', lines: [
          '198.51.100.77 - - [17/Nov/2026:07:41:09 +0530] "GET /listy/corobo.html HTTP/2.0" 200 1234',
          '198.51.100.77 - - [17/Nov/2026:07:41:12 +0530] "GET /listy/abhi.html HTTP/2.0" 200 1301',
          '',
          '# dla porównania, wpis z serwera w Polsce zimą:',
          '192.168.1.100 - - [17/Nov/2026:14:23:45 +0100] "GET /index.html HTTP/1.1" 200 1234'
        ] },
        ask: 'Czas w dzienniku podaje się wraz ze strefą czasową serwera. Co oznacza +0530 i gdzie żyje ten serwer?',
        kind: 'choice',
        options: [
          'UTC+5:30 — czas indyjski; serwer pośrednika działa w strefie Indii.',
          'UTC+1 — jak w Polsce zimą.',
          'UTC−5 — jak w Nowym Jorku zimą.',
          'UTC+2 — jak w Egipcie zimą.',
          'Opóźnienie odpowiedzi 5,30 sekundy.'
        ],
        correct: 0,
        hints: ['Zapis +0530 to godziny i minuty względem UTC: pięć godzin i trzydzieści minut.',
                'Strefy z półgodzinnym przesunięciem są rzadkie. Jedna z największych to Indie.'],
        explain: '+0530 to UTC+5:30, czyli czas indyjski (IST). Serwer pośrednika ma więc ustawioną strefę Indii. W Polsce zimą w dzienniku widać +0100.'
      },
      {
        id: 'a6q4', title: 'Problem → remedium', digit: 8,
        evidence: { title: 'Dowód 4/5 · skarga czytelników', kind: 'note', lines: [
          'Czytelnicy listów narzekają, że strona jest wolna. Każda skarga ma inną przyczynę i inne remedium.'
        ] },
        ask: 'Proszę dopasować problemy do metod optymalizacji.',
        kind: 'assign',
        items: [
          'Przeglądarka przy każdej wizycie pobiera te same 200 obrazków',
          'Duże pliki tekstowe (HTML, CSS, JS) wolno płyną przez łącze',
          'Każde żądanie wymaga nowego połączenia TCP',
          'Czytelnicy z antypodów czekają na odpowiedź z odległego serwera',
          'Strona potrzebuje wielu małych zasobów naraz, a połączenie obsługuje je po kolei'
        ],
        buckets: [
          'pamięć podręczna przeglądarki (Cache-Control, Expires)',
          'kompresja (np. mod_deflate)',
          'trwałe połączenia (Keep-Alive)',
          'sieć dostarczania treści (CDN)',
          'HTTP/2 (multipleksowanie)'
        ],
        correct: [0, 1, 2, 3, 4],
        hints: ['Obrazki, które się nie zmieniają, nie muszą być pobierane za każdym razem.',
                'Odległość od serwera skraca się, gdy treść leży bliżej czytelnika.'],
        explain: 'Powtarzane pobieranie — pamięć podręczna; duże teksty — kompresja; nowe połączenie na żądanie — Keep-Alive; odległość — CDN; wiele zasobów naraz — HTTP/2.'
      },
      {
        id: 'a6q5', title: 'Narzędzie → zadanie', digit: 2,
        evidence: { title: 'Dowód 5/5 · skrzynka narzędziowa Kornackiej', kind: 'note', lines: [
          'Pięć narzędzi, pięć zadań. Stara Kornacka nigdy nie myli narzędzi.'
        ] },
        ask: 'Proszę dopasować narzędzia do zadań.',
        kind: 'assign',
        items: ['GoAccess', 'AWStats', 'Logwatch', 'mod_status', 'stub_status'],
        buckets: [
          'analiza dzienników w czasie rzeczywistym',
          'statystyki webowe',
          'automatyczne raporty z dzienników',
          'monitoring wydajności serwera Apache',
          'monitoring wydajności serwera Nginx'
        ],
        correct: [0, 1, 2, 3, 4],
        hints: ['Moduły mod_status i stub_status należą do konkretnych serwerów.',
                'Logwatch to „strażnik”, który wysyła raporty automatycznie.'],
        explain: 'GoAccess — analiza w czasie rzeczywistym; AWStats — statystyki webowe; Logwatch — automatyczne raporty; mod_status — Apache; stub_status — Nginx.'
      }
    ],

    clue: {
      title: 'Dowód VI · Serwer pośrednika żyje w czasie indyjskim',
      text: 'Dziennik pośrednika zapisuje czas ze strefą +0530, czyli UTC+5:30. Serwer Człowieka-w-Środku działa w strefie czasowej Indii.',
      attr: 'tz', value: 'UTC+5:30'
    },

    reveal: {
      takeaways: [
        'Optymalizacja: pamięć podręczna (przeglądarka, serwer, CDN), kompresja (mod_deflate), Keep-Alive, HTTP/2.',
        'Dziennik dostępu mówi, CO się stało (kod, rozmiar, czas ze strefą); dziennik błędów — DLACZEGO.',
        'Narzędzia: GoAccess, AWStats, Logwatch; monitoring: mod_status, stub_status, Zabbix, Prometheus + Grafana.'
      ],
      next: 'Za chwilę Finał: wszystkie dowody są w teczce. Kto jest Człowiekiem-w-Środku?'
    },

    quick: [
      { t: 'Moduł stub_status służy do monitorowania serwera Nginx.', a: true, why: 'Odpowiednikiem w Apache jest mod_status.' },
      { t: 'mod_deflate służy do kompresji odpowiedzi serwera.', a: true, why: 'Zmniejsza rozmiar tekstowych odpowiedzi (HTML, CSS, JS).' },
      { t: 'Przyczyny błędu 502 należy szukać przede wszystkim w dzienniku błędów.', a: true, why: 'Dziennik dostępu zapisuje tylko sam kod.' },
      { t: 'Sieć CDN oddala zasoby od użytkowników, żeby serwer miał mniej pracy.', a: false, why: 'CDN przybliża zasoby do użytkowników.' }
    ],

    hostSay: {
      start: 'Akt VI, ostatni. W tym akcie padnie ostatni dowód. Po nim w teczce będzie pięć wskazówek i sześciu podejrzanych.',
      reveal: 'Za chwilę oskarżenie. Proszę kapitanów o zwołanie narady: kto, jak i co by temu zapobiegło. Jedna szansa.'
    }
  };
}));
