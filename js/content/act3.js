/* Akt III — Krypta faraona Hoopsa: ewolucja protokołu HTTP. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.actData = root.CM.actData || {}; root.CM.actData[3] = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    roman: 'III',
    icon: '🏺',
    title: 'Krypta faraona Hoopsa',
    subtitle: 'Ewolucja protokołu HTTP',
    setting: 'W piramidzie faraona Hoopsa, w tej samej jaskini, gdzie Sholmes starł się z Romartym, na ścianach wyryto historię protokołu HTTP. Bez odczytania hieroglifów nie ruszymy dalej.',
    durSec: 330,
    revealSec: 45,

    briefing: [
      { title: 'HTTP/1.0 i HTTP/1.1', icon: '🪨', blocks: [
        { p: '**HTTP/1.0 (1996)**: jedno żądanie = jedno połączenie TCP, brak mechanizmów buforowania, niska wydajność przy wielu zasobach.' },
        { p: '**HTTP/1.1 (1997)**: trwałe połączenia (**keep-alive**), **pipelining** (wiele żądań bez czekania na odpowiedzi), **chunked transfer encoding** (przesyłanie porcjami), kontrola pamięci podręcznej, kompresja.' },
        { voice: { who: 'Faraon Hoops', text: 'Za moich czasów jedno żądanie to jedna karawana. Dopiero keep-alive pozwolił jednej karawanie wozić wiele towarów.' } }
      ] },
      { title: 'HTTP/2', icon: '📦', blocks: [
        { p: '**HTTP/2 (2015)**: binarny format **ramek**, **multipleksowanie** strumieni (wiele żądań i odpowiedzi naraz w jednym połączeniu), kompresja nagłówków (**HPACK**), server push.' },
        { note: 'Dodatek do wykładu: server push w praktyce okazał się mało użyteczny i przeglądarki go wycofały. Multipleksowanie jest rozwinięciem pipeliningu: odpowiedzi nie muszą wracać w kolejności żądań.' }
      ] },
      { title: 'HTTP/3', icon: '🚀', blocks: [
        { p: '**HTTP/3 (2022)**: oparty na **QUIC** (UDP zamiast TCP), lepsza obsługa utraty pakietów, szybsze nawiązywanie połączeń.' },
        { note: 'Zmienia się sposób przesyłania, a nie sens: metody, kody statusu i nagłówki mają we wszystkich wersjach to samo znaczenie.' }
      ] }
    ],

    questions: [
      {
        id: 'a3q1', title: 'Cztery epoki', digit: 5,
        evidence: { title: 'Dowód 1/5 · ściana krypty, cztery płaskorzeźby w losowej kolejności', kind: 'note', lines: [
          'Na ścianie wyryto cztery epoki protokołu, ale kolejność jest pomieszana. Kamieniarz nie podał dat — tylko cechy.'
        ] },
        ask: 'Proszę ułożyć epoki od najstarszej do najnowszej.',
        kind: 'order',
        items: [
          'Jedno żądanie = jedno połączenie TCP',
          'Trwałe połączenia (keep-alive) i pipelining',
          'Binarne ramki, multipleksowanie i kompresja nagłówków',
          'QUIC nad UDP zamiast TCP'
        ],
        hints: ['Najstarsza jest wersja, w której każde żądanie wymagało nowego połączenia.',
                'Kolejność: 1.0 → 1.1 → 2 → 3. Przypisz do niej cechy z odprawy.'],
        explain: 'Chronologia: HTTP/1.0 (1996), HTTP/1.1 (1997), HTTP/2 (2015), HTTP/3 (2022).'
      },
      {
        id: 'a3q2', title: 'Cecha → wersja', digit: 2,
        evidence: { title: 'Dowód 2/5 · tablica hieroglifów', kind: 'note', lines: [
          'Hoops: „Sześć cech, cztery wersje. Do której należy każda cecha? Wersje mogą się powtarzać.”'
        ] },
        ask: 'Proszę dopasować cechy do wersji protokołu, w której po raz pierwszy się pojawiły.',
        kind: 'assign',
        items: [
          'Kompresja nagłówków HPACK',
          'Chunked transfer encoding (przesyłanie porcjami)',
          'Oparcie na QUIC (UDP)',
          'Brak mechanizmów buforowania',
          'Multipleksowanie strumieni',
          'Trwałe połączenia (keep-alive)'
        ],
        buckets: ['HTTP/1.0', 'HTTP/1.1', 'HTTP/2', 'HTTP/3'],
        correct: [2, 1, 3, 0, 2, 1],
        hints: ['Wszystko, co jest „binarne” i „strumieniowe”, to HTTP/2; wszystko, co UDP — HTTP/3.',
                'Keep-alive i chunked wprowadzono w HTTP/1.1, a brak buforowania to cecha najstarszej wersji.'],
        explain: 'HTTP/1.0: brak buforowania. HTTP/1.1: keep-alive, chunked. HTTP/2: HPACK, multipleksowanie. HTTP/3: QUIC nad UDP.'
      },
      {
        id: 'a3q3', title: 'Kto naprawdę odpowiada?', digit: 6,
        evidence: { title: 'Dowód 3/5 · dwa polecenia curl', kind: 'code', lines: [
          '# bezpośrednio do serwera listów (198.51.100.5):',
          '$ curl -skI --http2 --resolve listy.cyborgi.example:443:198.51.100.5 \\',
          '       https://listy.cyborgi.example/listy/ | head -1',
          'HTTP/1.1 200 OK',
          '',
          '# tak, jak robi to przeglądarka Abhidhammapitaki (adres z DNS):',
          '$ curl -sI --http2 https://listy.cyborgi.example/listy/ | head -1',
          'HTTP/2 200'
        ] },
        ask: 'Pod tym samym adresem serwer listów mówi HTTP/1.1, a do klienta odzywa się ktoś, kto mówi HTTP/2. Co to znaczy?',
        kind: 'choice',
        options: [
          'Odpowiada inna maszyna niż serwer listów — pośrednik, który sam obsługuje HTTP/2.',
          'To ta sama maszyna; HTTP/2 to po prostu nowszy kod statusu.',
          'Klient zmusił serwer listów do przejścia na HTTP/2.',
          'Wersja protokołu nie ma znaczenia; obie odpowiedzi są tym samym.',
          'Curl wymyśla wersje protokołu na własną rękę.'
        ],
        correct: 0,
        hints: ['Porównaj, do kogo trafia pierwsze, a do kogo drugie polecenie.',
                'Serwer listów w obu przypadkach to ta sama maszyna. Skoro odpowiedzi się różnią, to w drugim przypadku odpowiada ktoś inny.'],
        explain: 'Serwer listów umie tylko HTTP/1.1. Ruch z DNS trafia do pośrednika, który mówi HTTP/2 i dopiero sam rozmawia z serwerem. Człowiek-w-Środku używa HTTP/2.'
      },
      {
        id: 'a3q4', title: 'Słabe łącze w klasztorze', digit: 1,
        evidence: { title: 'Dowód 4/5 · pomiar w klasztorze w Tybecie (NY)', kind: 'note', lines: [
          'Telefon w klasztorze ma słaby zasięg i gubi około 5% pakietów.',
          'Strona listów ładuje 80 małych zasobów (obrazki, style, skrypty).'
        ] },
        ask: 'Która wersja protokołu najlepiej poradzi sobie z takim łączem?',
        kind: 'choice',
        options: [
          'HTTP/3: QUIC nad UDP lepiej znosi utratę pakietów i szybciej nawiązuje połączenia.',
          'HTTP/1.0: jedno żądanie na połączenie jest najprostsze.',
          'HTTP/1.1: pipelining usuwa wszystkie problemy sieci.',
          'Wszystkie wersje zachowają się identycznie, bo znaczenie metod jest to samo.',
          'Żadna — trzeba poprosić klasztor o lepszy kabel.'
        ],
        correct: 0,
        hints: ['Pytanie dotyczy utraty pakietów i nawiązywania połączeń.',
                'Która wersja zmienia warstwę transportową z TCP na UDP?'],
        explain: 'HTTP/3 działa nad QUIC (UDP): lepiej znosi utratę pakietów i szybciej nawiązuje połączenia. Semantyka jest ta sama, ale wydajność już nie.'
      },
      {
        id: 'a3q5', title: 'Ślad A czy ślad B?', digit: 8,
        evidence: { title: 'Dowód 5/5 · dwa ślady przechwycone w sieci', kind: 'code', lines: [
          'Ślad A:',
          '  połączenie 1: GET /a.css → 200 → zamknięcie',
          '  połączenie 2: GET /b.js  → 200 → zamknięcie',
          '  połączenie 3: GET /c.png → 200 → zamknięcie',
          '',
          'Ślad B:',
          '  połączenie 1: GET /a.css → 200',
          '                GET /b.js  → 200',
          '                GET /c.png → 200 → zamknięcie'
        ] },
        ask: 'Który ślad pokazuje trwałe połączenie (keep-alive) i od której wersji jest ono standardem?',
        kind: 'choice',
        options: [
          'Ślad B — trwałe połączenia pojawiły się w HTTP/1.1.',
          'Ślad A — trwałe połączenia pojawiły się w HTTP/1.1.',
          'Ślad B — trwałe połączenia pojawiły się w HTTP/1.0.',
          'Ślad A — trwałe połączenia pojawiły się w HTTP/2.',
          'Ślad B — to czysty przypadek, nie ma tu protokołu.'
        ],
        correct: 0,
        hints: ['Policz połączenia w każdym śladzie.',
                'W śladzie B trzy żądania obsłużono jednym połączeniem. To właśnie keep-alive.'],
        explain: 'Ślad B reużywa jednego połączenia TCP: to keep-alive, wprowadzone w HTTP/1.1. W śladzie A każde żądanie otwiera nowe połączenie (zachowanie HTTP/1.0).'
      }
    ],

    clue: {
      title: 'Dowód III · Pośrednik mówi HTTP/2',
      text: 'Przed klientem odpowiada nie serwer listów (umie tylko HTTP/1.1), lecz pośrednik obsługujący HTTP/2 — z binarnymi ramkami i multipleksowaniem. Nasz cyborg-w-środku używa HTTP/2.',
      attr: 'proto', value: 'HTTP/2'
    },

    reveal: {
      takeaways: [
        'HTTP/1.0 (1996) — jedno żądanie na połączenie; HTTP/1.1 (1997) — keep-alive, pipelining, chunked, cache i kompresja.',
        'HTTP/2 (2015) — binarne ramki, multipleksowanie, HPACK; HTTP/3 (2022) — QUIC nad UDP, lepsza obsługa strat pakietów.',
        'Semantyka HTTP (metody, kody, nagłówki) zostaje ta sama — zmienia się sposób przesyłania.'
      ],
      next: 'Za chwilę Akt IV: dwa zamki — Apache i Nginx.'
    },

    quick: [
      { t: 'HTTP/3 działa nad QUIC, który korzysta z UDP.', a: true, why: 'To główna zmiana wobec HTTP/2, które używa TCP.' },
      { t: 'W HTTP/1.0 jedno połączenie TCP obsługiwało wiele żądań.', a: false, why: 'W HTTP/1.0 jedno żądanie = jedno połączenie; trwałe połączenia przyniosło HTTP/1.1.' },
      { t: 'HTTP/2 przesyła dane w binarnych ramkach.', a: true, why: 'Poprzednie wersje używały formatu tekstowego.' },
      { t: 'Kompresja nagłówków HPACK pojawiła się w HTTP/1.1.', a: false, why: 'HPACK to cecha HTTP/2.' }
    ],

    hostSay: {
      start: 'Akt III, krótki. Cztery epoki, jedna linia czasu. Proszę, żeby każdy zapamiętał nie daty, tylko to, co zmieniła każda wersja.',
      reveal: 'Jedno zdanie na zakończenie: wydajność rosła, a semantyka (metody, kody, nagłówki) została ta sama. Z tego powodu serwer pośredniczący może mówić z klientem inną wersją niż z serwerem.'
    }
  };
}));
