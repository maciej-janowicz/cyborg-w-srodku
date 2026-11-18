/* Cyborg w Środku — treść: dane ogólne, role, podejrzani, finał.
 * Wszystkie teksty dla graczy są po polsku; zmiany fabuły (np. winnego) wystarczy zrobić tutaj. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.core = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    meta: {
      title: 'Cyborg w Środku',
      subtitle: 'Gra śledcza o serwerach WWW',
      course: 'Usługi sieciowe · wykład 7: Serwery WWW',
      author: 'Maciej Janowicz',
      version: '1.0.0'
    },

    /* Czas trwania: 150 + (360+360+330+420+420+360) + 300 = 2700 s = 45 min. */
    prologSec: 150,

    roles: [
      { id: 'bond', icon: '🕶️', name: 'James Bond', title: 'Kapitan zespołu',
        blurb: 'Agent 007. Ma ostatnie słowo i jako jedyny obsługuje sejf oraz składa oskarżenie.' },
      { id: 'lupin', icon: '🎩', name: 'Arsène Lupin', title: 'Dżentelmen włamywacz',
        blurb: 'Kieruje śledztwem. Potrafi czytać cudze konfiguracje jak listy miłosne.' },
      { id: 'sholmes', icon: '🔍', name: 'Herlock Sholmes', title: 'Mistrz Super-Mocnej Metody Dedukcji',
        blurb: 'Wyszedł z melancholii. Dziennik serwera czyta jak powieść kryminalną.' },
      { id: 'gulbuddina', icon: '🌹', name: 'Gulbuddina', title: 'Córka Profesora',
        blurb: 'Uwolniona od hipnozy. Wciąż z charakterem, wciąż z wątpliwościami.' },
      { id: 'kornacka', icon: '🧺', name: 'Stara Kornacka', title: 'Przewodnicząca Królewskiego Towarzystwa Zoologii Niesłoniowej',
        blurb: 'Pomaga z daleka, ze straganu w Pcimiu Tylnym, w towarzystwie watahy waranów.' }
    ],

    teams: [
      'Endymion', 'Hyperion', 'Pcim Tylny', 'Tybet (NY)',
      'Piramida Hoopsa', 'Kair', 'Baker Street', 'La Belle Dame',
      'Waran', 'Nie-Słoń', 'Port w Gdyni', 'Port Chopina',
      'Stragan', 'Podwójna Inwersja', 'Pierwszy Kontakt', 'Czwarty Pocałunek'
    ],

    prolog: [
      { title: 'Dotychczas w tej sprawie…', icon: '📜', blocks: [
        { p: 'Demoniczny cyborg podwójnie odwrócony **Corobo** knuł coś przeciwko wszystkim sztucznym inteligencjom na Ziemi. James Bond, wsparty przez **Starą Kornacką** i jej watahę waranów, odkrył źródło zła: przed laty Corobo został odtrącony przez ukochaną — cyborga **Abhidhammapitakę**.' },
        { p: 'Wielka Piątka uwolniła Lupina i Sholmesa, Romarty dał zaręczonym ojcowskie błogosławieństwo, a varany porwały Abhidhammapitakę z klasztoru w Tybecie, w stanie Nowy Jork.' }
      ] },
      { title: 'Rozmowa, która nie doszła do skutku', icon: '💌', blocks: [
        { p: 'Po krótkiej rozmowie okazało się, że Abhidhammapitaka **nigdy** Corobo nie odtrąciła. Ich listy krążyły przez serwer WWW, a ktoś — nieznany jeszcze **cyborg-w-środku** — przechwytywał je i przerabiał w locie.' },
        { p: 'Każde z nich dostawało odpowiedź, której druga strona nigdy nie napisała. Tego typu atak zna każdy administrator, tylko zwykle bez cyborgów.' }
      ] },
      { title: 'Nowe śledztwo', icon: '🕵️', blocks: [
        { p: 'Śledztwo prowadzi **Arsène Lupin**, wspierany przez Bonda i Sholmesa. **Stara Kornacka** pomaga z daleka — przez telefon, bo musiała wrócić do handlu w Pcimiu Tylnym. Gulbuddina dołączyła do zespołu, a Profesor Romarty służy radą (za punkty).' },
        { note: 'Sholmes twierdzi, że Romarty mówi prawdę. Bond zachowuje czujność.' }
      ] },
      { title: 'Jak działa ta gra', icon: '🎮', blocks: [
        { ul: [
          '**Telefon to notes agenta.** Zespół (3–5 osób) siedzi razem, a każdy telefon pokazuje INNE dowody.',
          '**Akt = odprawa → śledztwo → sejf.** Proszę przeczytać odprawę, rozwiązać swoje ogniwo (dostanie Pan/Pani cyfrę) i podyktować cyfrę kapitanowi.',
          '**Kapitan** wpisuje cyfry wszystkich ogniw i otwiera sejf z dowodem. Im szybciej i bez pomyłek, tym więcej punktów.',
          '**Zegar jest wspólny.** Gdy akt się kończy, wszystkie telefony pokazują rozwiązanie. Na końcu — oskarżenie.'
        ] }
      ] }
    ],

    /* Pięć cech, które ujawniają kolejne akty (II–VI). */
    attributes: [
      { id: 'probe', label: 'Sondowanie serwera', act: 2 },
      { id: 'proto', label: 'Protokół', act: 3 },
      { id: 'server', label: 'Oprogramowanie pośrednika', act: 4 },
      { id: 'cert', label: 'Certyfikat', act: 5 },
      { id: 'tz', label: 'Strefa czasowa serwera', act: 6 }
    ],

    suspects: [
      { id: 'wilson', emoji: '🩺', name: 'Dr Wilson',
        bio: 'Pomocnik varana Endymiona. Pojechał do Indii „zająć się PR”.',
        traits: { probe: 'HEAD', proto: 'HTTP/2', server: 'Nginx', cert: 'Let’s Encrypt', tz: 'UTC+5:30' } },
      { id: 'romarty', emoji: '🎓', name: 'Prof. Romarty',
        bio: 'Genialny przestępca, niedawno rozczulony zaręczynami córki. Czy naprawdę się zmienił?',
        traits: { probe: 'GET', proto: 'HTTP/1.1', server: 'Apache', cert: 'komercyjny', tz: 'UTC+2' } },
      { id: 'grognard', emoji: '🎖️', name: 'Grognard',
        bio: 'Stary żołnierz, wyjechał do Indii razem z Wilsonem. Lubi sprawdzone rozwiązania.',
        traits: { probe: 'HEAD', proto: 'HTTP/1.1', server: 'Apache', cert: 'samopodpisany', tz: 'UTC+5:30' } },
      { id: 'waranna', emoji: '🦎', name: 'Siostra Waranna',
        bio: 'Waran, który został mniszką w klasztorze w Tybecie (NY). Medytuje nad logami.',
        traits: { probe: 'HEAD', proto: 'HTTP/2', server: 'Apache', cert: 'Let’s Encrypt', tz: 'UTC−5' } },
      { id: 'opat', emoji: '🧘', name: 'Opat klasztoru',
        bio: 'Cichy opiekun sieci klasztornej w Tybecie (NY). Pieczęcie robi sam.',
        traits: { probe: 'HEAD', proto: 'HTTP/2', server: 'Nginx', cert: 'samopodpisany', tz: 'UTC−5' } },
      { id: 'hoops', emoji: '🏺', name: 'Faraon Hoops',
        bio: 'Właściciel piramidy, w której odbył się pojedynek. Nieśmiertelny administrator.',
        traits: { probe: 'HEAD', proto: 'HTTP/2', server: 'Nginx', cert: 'Let’s Encrypt', tz: 'UTC+2' } }
    ],

    culprit: 'wilson',

    finale: {
      durSec: 300,
      unmaskSec: 150,
      title: 'Finał · Rozstrzygnięcie',
      intro: 'Wszystkie dowody są w teczce. Kapitan składa oskarżenie: kto, jak i co by temu zapobiegło. Proszę się naradzić — oskarżenie można złożyć tylko raz.',
      pointsWho: 150, pointsHow: 50, pointsFix: 50, bonusWho: 40,
      how: {
        ask: 'Jak dokonano ataku?',
        options: [
          'Złośliwy pośrednik odwrotny stanął między klientami a serwerem, przerabiał treść listów i pokazywał własny certyfikat — a ostrzeżenie przeglądarki zostało zignorowane.',
          'Atak siłowy na hasło administratora przez SSH.',
          'Przepełnienie bufora w module Apache.',
          'Zatrucie pamięci podręcznej przeglądarki przez sieć CDN.',
          'Varan Endymion przegryzł kabel w serwerowni.'
        ],
        correct: 0
      },
      fix: {
        ask: 'Co najskuteczniej zapobiegłoby takiemu atakowi?',
        options: [
          'HTTPS z ważnym certyfikatem dla właściwej domeny i konsekwentne traktowanie ostrzeżeń przeglądarki poważnie.',
          'Zamiana serwera Nginx na Apache.',
          'Wyłączenie metody HEAD na wszystkich serwerach.',
          'Zwiększenie poziomu kompresji w mod_deflate.',
          'Powrót z HTTP/2 do HTTP/1.0.'
        ],
        correct: 0
      },
      unmask: {
        title: 'Zdemaskowany!',
        paras: [
          'Faraon Hoops miał alibi z piramidy, siostra Waranna medytowała w klasztorze, a Romarty… tym razem mówił prawdę. W Bombaju policja wchodzi do serwerowni: przy terminalu siedzi dr Wilson, z dwoma nginxami i filiżanką herbaty.',
          'Sholmes poprawia kapelusz: „Proszę państwa, to elementarne. HEAD zamiast GET, HTTP/2 zamiast 1.1, Nginx zamiast Apache, certyfikat z Let’s Encrypt i czas +05:30. Pasuje tylko jeden człowiek.”'
        ],
        quote: { who: 'Dr Wilson', text: 'Ja tylko dbałem o PR. Proxy Relations.' },
        cliff: 'Zanim aresztowano Wilsona, zdążył wysłać archiwum listów w nieznane — zwykłym, nieszyfrowanym protokołem do przesyłania plików. Nikt nie wie jeszcze, dokąd. Następny odcinek: **protokoły transmisji oraz FTP**.'
      },
      recap: [
        'Serwery WWW realizują model klient–serwer; klient inicjuje połączenie, serwer nasłuchuje (80/443).',
        'HTTP ewoluował od prostego HTTP/1.0 do wydajnego HTTP/3.',
        'Apache to stabilny, funkcjonalny wybór dla tradycyjnych zastosowań; Nginx oferuje wyższą wydajność i świetnie sprawdza się jako pośrednik odwrotny.',
        'Bezpieczeństwo wymaga podejścia wielowarstwowego: aktualizacje, HTTPS, kontrola dostępu.',
        'Optymalizacja (pamięć podręczna, kompresja, HTTP/2) jest niezbędna dla wydajności.',
        'Monitoring i analiza dzienników pozwalają utrzymać jakość usługi.'
      ],
      hostSay: {
        accuse: 'Proszę kapitanów o oskarżenie. Przypominam: jedna szansa, wszystkie dowody są w teczce.',
        unmask: 'Kapitanowie pokazują kod QR (lub udostępniają link) — zbieram raporty na swoim telefonie. Kilka słów o tym, co przed chwilą widzieli: HTTPS to nie dodatek, tylko ochrona przed dokładnie takim atakiem.'
      }
    }
  };
}));
