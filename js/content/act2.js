/* Akt II — Alfabet Sholmesa: metody HTTP i kody statusu. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.actData = root.CM.actData || {}; root.CM.actData[2] = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    roman: 'II',
    icon: '🔍',
    title: 'Alfabet Sholmesa',
    subtitle: 'Metody HTTP i kody statusu',
    setting: 'Herlock Sholmes, już bez melancholii, rozkłada na stole dziennik serwera listów. „Elementarne, drogi Bondzie: każda linia to zeznanie. Trzeba tylko wiedzieć, w jakim języku ona mówi.”',
    durSec: 360,
    revealSec: 50,

    briefing: [
      { title: 'Metody HTTP', icon: '🧰', blocks: [
        { ul: [
          '**GET** — pobranie zasobu (bezpieczna, idempotentna),',
          '**POST** — wysłanie danych, utworzenie zasobu,',
          '**PUT** — aktualizacja **całego** zasobu (idempotentna),',
          '**PATCH** — **częściowa** aktualizacja zasobu,',
          '**DELETE** — usunięcie zasobu (idempotentna),',
          '**HEAD** — jak GET, ale tylko nagłówki (bez treści),',
          '**OPTIONS** — sprawdzenie dostępnych metod.'
        ] },
        { p: '**Bezpieczna** = nie zmienia stanu serwera. **Idempotentna** = wielokrotne wykonanie daje ten sam efekt co jednokrotne.' },
        { note: 'Dodatek do wykładu: bezpieczne są także HEAD i OPTIONS, a POST nie jest ani bezpieczna, ani idempotentna — dlatego dwukrotne kliknięcie „Wyślij” bywa kłopotliwe.' }
      ] },
      { title: 'Kody statusu: pięć rodzin', icon: '🔢', blocks: [
        { ul: [
          '**1xx** informacyjne — 100 Continue,',
          '**2xx** sukces — 200 OK, 201 Created, 204 No Content,',
          '**3xx** przekierowania — 301 Moved Permanently, 302 Found, 304 Not Modified,',
          '**4xx** błędy klienta — 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 405 Method Not Allowed,',
          '**5xx** błędy serwera — 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.'
        ] },
        { voice: { who: 'Herlock Sholmes', text: 'Pierwsza cyfra mówi, kto zawinił: czwórka — klient, piątka — serwer. 401: nie wiem, kim Pan jest; 403: wiem, kim Pan jest, i właśnie dlatego Pana nie wpuszczę.' } }
      ] },
      { title: 'Jak czytać dziennik', icon: '📖', blocks: [
        { code: ['192.168.1.100 - - [17/Nov/2026:14:23:45 +0100] "GET /index.html HTTP/1.1" 200 1234'] },
        { ul: [
          'adres IP klienta,',
          'czas wraz ze **strefą czasową serwera** (`+0100`),',
          'żądanie w cudzysłowie: metoda, ścieżka, wersja,',
          'kod statusu (`200`) i liczba wysłanych bajtów (`1234`).'
        ] }
      ] }
    ],

    questions: [
      {
        id: 'a2q1', title: 'Metody bezpieczne', digit: 2,
        evidence: { title: 'Dowód 1/5 · dziennik serwera listów (zwykli użytkownicy)', kind: 'code', lines: [
          '198.51.100.23 - - [17/Nov/2026:09:30:01 +0100] "GET /listy/ HTTP/1.1" 200 5120',
          '198.51.100.23 - - [17/Nov/2026:09:30:19 +0100] "POST /listy/nowy HTTP/1.1" 201 87',
          '198.51.100.41 - - [17/Nov/2026:09:31:02 +0100] "HEAD /listy/corobo.html HTTP/1.1" 200 0',
          '198.51.100.41 - - [17/Nov/2026:09:31:30 +0100] "PUT /listy/szkic.html HTTP/1.1" 200 640',
          '198.51.100.52 - - [17/Nov/2026:09:32:11 +0100] "DELETE /listy/szkic.html HTTP/1.1" 204 0',
          '198.51.100.52 - - [17/Nov/2026:09:32:40 +0100] "OPTIONS /listy/ HTTP/1.1" 200 0'
        ] },
        ask: 'Proszę zaznaczyć wszystkie wiersze z metodami BEZPIECZNYMI, czyli niezmieniającymi stanu serwera.',
        kind: 'lines',
        selectable: [0, 1, 2, 3, 4, 5],
        correct: [0, 2, 5],
        hints: ['Bezpieczna metoda tylko czyta: nic nie tworzy, nie zmienia i nie usuwa.',
                'Szukaj trzech metod: pobranie zasobu, pobranie samych nagłówków i pytanie o dostępne metody.'],
        explain: 'Bezpieczne (niezmieniające stanu serwera) są GET, HEAD i OPTIONS. POST tworzy zasób, PUT go zastępuje, a DELETE usuwa.'
      },
      {
        id: 'a2q2', title: 'Dwa listy zamiast jednego', digit: 7,
        evidence: { title: 'Dowód 2/5 · dwukrotne kliknięcie „Wyślij list”', kind: 'code', lines: [
          '198.51.100.23 - - [17/Nov/2026:09:30:01 +0100] "POST /listy/nowy HTTP/1.1" 201 87',
          '198.51.100.23 - - [17/Nov/2026:09:30:02 +0100] "POST /listy/nowy HTTP/1.1" 201 87',
          '',
          '# w katalogu powstały dwa listy: id-4711 oraz id-4712'
        ] },
        ask: 'To samo żądanie, wysłane dwa razy, utworzyło dwa różne listy. Która cecha metody POST to tłumaczy?',
        kind: 'choice',
        options: [
          'POST nie jest idempotentna: powtórzenie może wywołać kolejny skutek.',
          'POST jest bezpieczna, więc można ją powtarzać bez końca.',
          'POST zawsze zwraca kod 201, niezależnie od liczby prób.',
          'POST aktualizuje cały zasób, tak jak PUT.',
          'Serwer przekazał list pocztą pantoflową.'
        ],
        correct: 0,
        hints: ['Idempotentna znaczy: powtórzenie daje ten sam efekt co jednokrotne wykonanie.',
                'Tu efekty są różne, więc cecha, której POST nie ma, to idempotentność.'],
        explain: 'POST nie jest ani bezpieczna, ani idempotentna: każde wywołanie może utworzyć nowy zasób. PUT i DELETE są idempotentne — powtórzone dają ten sam stan końcowy.'
      },
      {
        id: 'a2q3', title: 'Zwyczaje cyborga', digit: 0,
        evidence: { title: 'Dowód 3/5 · dziennik serwera listów (maszyna 203.0.113.66)', kind: 'code', lines: [
          '203.0.113.66 - - [17/Nov/2026:02:10:30 +0100] "HEAD /listy/corobo.html HTTP/1.1" 200 0',
          '203.0.113.66 - - [17/Nov/2026:02:11:00 +0100] "HEAD /listy/corobo.html HTTP/1.1" 200 0',
          '203.0.113.66 - - [17/Nov/2026:02:11:30 +0100] "HEAD /listy/corobo.html HTTP/1.1" 200 0',
          '203.0.113.66 - - [17/Nov/2026:02:11:34 +0100] "GET /listy/corobo.html HTTP/1.1" 200 1190'
        ] },
        ask: 'Podejrzana maszyna co 30 sekund wysyła HEAD, a po zmianie listu pobiera go przez GET. Jak to rozumieć?',
        kind: 'choice',
        options: [
          'HEAD zwraca same nagłówki (bez treści listu) — to tani sposób sprawdzenia, czy list się zmienił; dopiero potem pobiera się go przez GET.',
          'HEAD usuwa zasób, a GET go odtwarza.',
          'HEAD działa wyłącznie w HTTP/3.',
          'HEAD to częściowa aktualizacja zasobu, jak PATCH.',
          'HEAD pobiera tylko pierwszą linijkę listu: „Szanowna Pani”.'
        ],
        correct: 0,
        hints: ['Wiersze HEAD mają 0 bajtów w kolumnie rozmiaru. Co to mówi o treści?',
                'HEAD jest „jak GET, ale tylko nagłówki”. Nagłówki zawierają m.in. Content-Length.'],
        explain: 'HEAD działa jak GET, ale zwraca wyłącznie nagłówki (m.in. rozmiar i typ treści). Człowiek-w-Środku oszczędnie sonduje serwer metodą HEAD i pobiera list przez GET dopiero wtedy, gdy się zmieni.'
      },
      {
        id: 'a2q4', title: 'Czym jest 504?', digit: 5,
        evidence: { title: 'Dowód 4/5 · ekran telefonu Abhidhammapitaki', kind: 'note', lines: [
          'Przeglądarka pokazuje: „504 Gateway Timeout”.',
          'Pośrednik czekał 60 sekund na odpowiedź serwera listów, po czym zrezygnował.'
        ] },
        ask: 'Co oznacza kod 504?',
        kind: 'choice',
        options: [
          'Serwer pośredniczący nie doczekał się odpowiedzi od serwera docelowego w wyznaczonym czasie.',
          'Zasób nie istnieje (jak 404).',
          'Klient nie ma uprawnień do zasobu (jak 403).',
          'Pośrednik dostał od serwera docelowego błędną odpowiedź (to byłby raczej 502).',
          'Serwer prosi o cierpliwość i obiecuje poprawę w przyszłym tygodniu.'
        ],
        correct: 0,
        hints: ['504 należy do rodziny 5xx, a nazwa mówi o „bramie” i „czasie”.',
                'Różnica: 502 = zła odpowiedź z serwera docelowego, 504 = brak odpowiedzi w czasie.'],
        explain: '504 Gateway Timeout: brama (pośrednik) nie doczekała się odpowiedzi od serwera docelowego. Przy 502 Bad Gateway odpowiedź przyszła, ale była błędna.'
      },
      {
        id: 'a2q5', title: 'Kod do sytuacji', digit: 9,
        evidence: { title: 'Dowód 5/5 · zadanie dla Starej Kornackiej', kind: 'note', lines: [
          'Pięć sytuacji z targu. Do każdej pasuje dokładnie jeden z pięciu kodów.'
        ] },
        ask: 'Proszę dopasować kod statusu do sytuacji.',
        kind: 'assign',
        items: [
          'Serwer nie zezwala na metodę DELETE dla tego adresu',
          'Żądanie wymaga logowania, a klient go nie podał',
          'Klient jest znany, ale nie ma prawa wejść do /admin',
          'Wskazany plik nie istnieje',
          'W skrypcie serwera wystąpił nieoczekiwany błąd'
        ],
        buckets: ['401', '403', '404', '405', '500'],
        correct: [3, 0, 1, 2, 4],
        hints: ['Rodzina 4xx to błędy klienta, 5xx — serwera. Wśród czwórek: 401, 403, 404 i 405 różnią się znaczeniem.',
                '401 — brak logowania; 403 — zalogowany, ale zabronione; 404 — brak zasobu; 405 — niedozwolona metoda.'],
        explain: '401 — wymagane uwierzytelnienie (w slajdach: „wymagana autoryzacja”), 403 — brak uprawnień, 404 — zasób nie istnieje, 405 — niedozwolona metoda, 500 — wewnętrzny błąd serwera.'
      }
    ],

    clue: {
      title: 'Dowód II · Cyborg sonduje serwer metodą HEAD',
      text: 'Podejrzana maszyna co 30 sekund wysyła HEAD /listy/corobo.html: tanio sprawdza nagłówki, a gdy list się zmieni, pobiera go przez GET. Nasz cyborg-w-środku jest oszczędny i cierpliwy — woli HEAD.',
      attr: 'probe', value: 'HEAD'
    },

    reveal: {
      takeaways: [
        'GET, HEAD i OPTIONS są bezpieczne; GET, HEAD, OPTIONS, PUT i DELETE są idempotentne; POST nie jest ani jedno, ani drugie.',
        'PUT zastępuje cały zasób, PATCH zmienia go częściowo; HEAD zwraca same nagłówki.',
        'Kody: 2xx sukces, 3xx przekierowanie, 4xx błąd klienta (401, 403, 404, 405), 5xx błąd serwera (500, 502, 503, 504).'
      ],
      next: 'Za chwilę Akt III: schodzimy do krypty faraona Hoopsa.'
    },

    quick: [
      { t: 'Metoda GET jest bezpieczna i idempotentna.', a: true, why: 'Tylko pobiera dane i nie zmienia stanu serwera.' },
      { t: 'Metoda POST jest idempotentna.', a: false, why: 'Powtórzenie POST może utworzyć kolejny zasób.' },
      { t: 'Kod 301 oznacza trwałe przeniesienie zasobu pod inny adres.', a: true, why: 'Stąd słowo „Permanently”; 302 to przeniesienie tymczasowe.' },
      { t: 'Kody z rodziny 5xx oznaczają błąd po stronie klienta.', a: false, why: 'Rodzina 5xx to błędy serwera, a 4xx — klienta.' }
    ],

    hostSay: {
      start: 'Akt II. W odprawie jest tabela metod i rodzin kodów — proszę poczytać dziesięć razy szybciej, niż Państwo myślą, że się da.',
      reveal: 'Zapamiętać wystarczy trzy rzeczy: bezpieczne = GET/HEAD/OPTIONS; POST nie jest idempotentna; pierwsza cyfra kodu wskazuje winnego (4 — klient, 5 — serwer).'
    }
  };
}));
