/* Akt IV — Dwa zamki: Apache, Nginx, hosty wirtualne, pośrednik odwrotny. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.actData = root.CM.actData || {}; root.CM.actData[4] = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    roman: 'IV',
    icon: '🗝️',
    title: 'Dwa zamki',
    subtitle: 'Apache, Nginx i serwer pośredniczący',
    setting: 'Arsène Lupin, jak zwykle elegancki, forsuje zamek serwerowni. Wie, że zamki są dwa — stary, rzetelny Apache i szybki, ascetyczny Nginx — a każdy otwiera się inaczej.',
    durSec: 420,
    revealSec: 55,

    briefing: [
      { title: 'Apache HTTP Server (od 1995)', icon: '🪶', blocks: [
        { p: '**Zalety**: modułowa architektura (ponad 400 modułów), stabilność, doskonała dokumentacja, **.htaccess** (konfiguracja na poziomie katalogów), bogata funkcjonalność dostępna zaraz po instalacji.' },
        { p: '**Wady**: mniejsza wydajność przy dużym obciążeniu, większe zużycie pamięci, model procesów/wątków (jeden na połączenie) mniej efektywny.' },
        { p: '**Zastosowania**: hosting współdzielony, aplikacje wymagające .htaccess, środowiska z dynamiczną konfiguracją.' }
      ] },
      { title: 'Apache: konfiguracja i hosty wirtualne', icon: '🧾', blocks: [
        { p: 'Plik główny: `/etc/apache2/apache2.conf` (Debian/Ubuntu) lub `/etc/httpd/conf/httpd.conf` (Red Hat/CentOS).' },
        { code: [
          'Listen 80',
          'DocumentRoot "/var/www/html"',
          'DirectoryIndex index.html index.php',
          '<Directory "/var/www/html">',
          '  Options Indexes FollowSymLinks',
          '  AllowOverride All',
          '  Require all granted',
          '</Directory>',
          '',
          'a2enmod rewrite     # włączanie modułu',
          'a2dismod status     # wyłączanie modułu'
        ] },
        { p: '**Host wirtualny** pozwala obsługiwać wiele domen na jednym serwerze (opartych na nazwie — zwykle; opartych na IP — rzadziej):' },
        { code: [
          '<VirtualHost *:80>',
          '  ServerName example.com',
          '  ServerAlias www.example.com',
          '  DocumentRoot /var/www/example',
          '  ErrorLog  logi/example_error.log',
          '  CustomLog logi/example_access.log combined',
          '</VirtualHost>'
        ] }
      ] },
      { title: 'Nginx (od 2004)', icon: '⚡', blocks: [
        { p: '**Zalety**: architektura asynchroniczna, sterowana zdarzeniami; bardzo wysoka wydajność (tysiące połączeń); niskie zużycie pamięci; świetny jako pośrednik odwrotny (reverse proxy) i do rozkładania obciążenia; efektywne serwowanie plików statycznych.' },
        { p: '**Wady**: brak konfiguracji dynamicznej (.htaccess) — **zmiana konfiguracji wymaga przeładowania**; mniej modułów niż Apache.' },
        { code: [
          'server {',
          '  listen 80;',
          '  server_name example.com www.example.com;',
          '  root /var/www/example;',
          '  index index.html index.php;',
          '',
          '  location ~ \\.php$ {',
          '    fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;',
          '  }',
          '  location ~* \\.(jpg|png|css|js)$ {',
          '    expires 30d;',
          '  }',
          '}'
        ] }
      ] },
      { title: 'Nginx jako pośrednik odwrotny', icon: '🔀', blocks: [
        { p: '**Pośrednik odwrotny (reverse proxy)** przyjmuje żądania w imieniu serwerów aplikacji i przekazuje je dalej. Korzyści: rozkładanie obciążenia (load balancing), pamięć podręczna, kompresja, terminacja SSL.' },
        { code: [
          'upstream backend_servers {',
          '  server 192.168.1.10:8080;',
          '  server 192.168.1.11:8080;',
          '}',
          'server {',
          '  listen 80;',
          '  server_name app.example.com;',
          '  location / {',
          '    proxy_pass http://backend_servers;',
          '    proxy_set_header Host $host;',
          '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
          '  }',
          '}'
        ] },
        { table: { head: ['', 'Apache', 'Nginx'], rows: [
          ['Architektura', 'proces/wątek na połączenie', 'asynchroniczna, sterowana zdarzeniami'],
          ['Konfiguracja', '.htaccess (dynamiczna)', 'tylko globalna'],
          ['Moduły', 'ponad 400', 'mniej, ale ważne'],
          ['Rozkład obciążenia', 'mod_proxy_balancer', 'natywny, zaawansowany']
        ] } }
      ] }
    ],

    questions: [
      {
        id: 'a4q1', title: 'Dyrektywy Apache', digit: 6,
        evidence: { title: 'Dowód 1/5 · konfiguracja serwera listów (Apache)', kind: 'note', lines: [
          'Lupin znalazł fragmenty konfiguracji Apache serwera listów. Każda dyrektywa ma inne zadanie.'
        ] },
        ask: 'Proszę dopasować dyrektywy do ich znaczenia.',
        kind: 'assign',
        items: [
          'Listen 80',
          'DocumentRoot "/var/www/listy"',
          'DirectoryIndex index.html index.php',
          'ServerName listy.cyborgi.example',
          'AllowOverride All'
        ],
        buckets: [
          'port, na którym serwer nasłuchuje',
          'katalog główny dokumentów witryny',
          'pliki wyświetlane domyślnie, gdy żądanie wskazuje katalog',
          'nazwa domenowa hosta wirtualnego',
          'zezwolenie na nadpisywanie ustawień w plikach .htaccess'
        ],
        correct: [0, 1, 2, 3, 4],
        hints: ['Nazwy dyrektyw są mówiące: Listen — słuchać, Root — korzeń, Index — spis, Name — nazwa.',
                'AllowOverride dotyczy plików, które „nadpisują” ustawienia na poziomie katalogów.'],
        explain: 'Listen — port nasłuchiwania; DocumentRoot — katalog główny; DirectoryIndex — plik domyślny; ServerName — nazwa hosta wirtualnego; AllowOverride — zezwolenie na .htaccess.'
      },
      {
        id: 'a4q2', title: 'Co robi ta konfiguracja?', digit: 4,
        evidence: { title: 'Dowód 2/5 · konfiguracja znaleziona na maszynie 203.0.113.66', kind: 'code', lines: [
          'upstream prawdziwe_listy {',
          '    server 198.51.100.5:80;',
          '}',
          'server {',
          '    listen 443 ssl;',
          '    server_name listy.cyborgi.example;',
          '',
          '    location / {',
          '        proxy_pass http://prawdziwe_listy;',
          '        proxy_set_header Host $host;',
          '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
          '        sub_filter \'Kocham\' \'Nie kocham\';   # podmiana tekstu w odpowiedzi (dodatek do wykładu)',
          '        sub_filter_once off;',
          '    }',
          '}'
        ] },
        ask: 'Co robi ta konfiguracja?',
        kind: 'choice',
        options: [
          'Przyjmuje połączenia HTTPS jako domena listów i przekazuje żądania do serwera 198.51.100.5 (pośrednik odwrotny), przy okazji podmieniając fragmenty odpowiedzi.',
          'Rozkłada ruch na trzy serwery aplikacji (rozkładanie obciążenia).',
          'Serwuje pliki statyczne z lokalnego katalogu root.',
          'Przekierowuje wszystkich klientów kodem 301 na inną domenę.',
          'Obsługuje pocztę elektroniczną (SMTP).'
        ],
        correct: 0,
        hints: ['Szukaj dyrektywy, która „przekazuje dalej”: proxy_pass.',
                'W bloku upstream jest tylko jeden serwer, a dyrektywa sub_filter zmienia treść odpowiedzi.'],
        explain: 'To Nginx jako pośrednik odwrotny: przyjmuje ruch pod domeną listów, przekazuje żądania do serwera 198.51.100.5 przez proxy_pass i dodatkowo zmienia treść (sub_filter). Tak działa Człowiek-w-Środku.'
      },
      {
        id: 'a4q3', title: 'Apache czy Nginx?', digit: 8,
        evidence: { title: 'Dowód 3/5 · strzępy konfiguracji z kosza Człowieka-w-Środku', kind: 'note', lines: [
          'Osiem skrawków papieru, część napisana składnią Apache, część Nginx. Sholmes rozdziela je na dwie kupki.'
        ] },
        ask: 'Proszę przypisać każdy fragment do właściwego serwera.',
        kind: 'assign',
        items: [
          '<VirtualHost *:80>',
          'server { listen 80; }',
          'a2enmod rewrite',
          'proxy_pass http://backend;',
          '.htaccess',
          'location ~ \\.php$ { fastcgi_pass … }',
          'Require all granted',
          'upstream backend { server … }'
        ],
        buckets: ['Apache', 'Nginx'],
        correct: [0, 1, 0, 1, 0, 1, 0, 1],
        hints: ['Apache: znaczniki w ostrych nawiasach (<…>), a2enmod, .htaccess, Require. Nginx: bloki w nawiasach klamrowych, location, upstream.',
                'proxy_pass, upstream i location to słownictwo Nginx.'],
        explain: 'Apache: <VirtualHost>, a2enmod, .htaccess, Require. Nginx: bloki server { }, location, proxy_pass, upstream. Na maszynie podejrzanego działa Nginx.'
      },
      {
        id: 'a4q4', title: 'Kiedy Nginx?', digit: 2,
        evidence: { title: 'Dowód 4/5 · pytanie Gulbuddiny do Lupina', kind: 'note', lines: [
          'Pięć sytuacji. W których z nich lepszym wyborem jest Nginx, a nie Apache?'
        ] },
        ask: 'Proszę zaznaczyć WSZYSTKIE sytuacje, w których lepszym wyborem jest Nginx.',
        kind: 'multi',
        options: [
          'Tysiące równoległych połączeń przy niskim zużyciu pamięci.',
          'Klienci hostingu współdzielonego sami konfigurują katalogi w plikach .htaccess.',
          'Pośrednik odwrotny i rozkładanie obciążenia przed kilkoma serwerami aplikacji.',
          'Zmiana konfiguracji ma działać natychmiast, bez przeładowania serwera.',
          'Wydajne serwowanie plików statycznych (obrazy, CSS, JavaScript).'
        ],
        correct: [0, 2, 4],
        hints: ['Apache wygrywa tam, gdzie liczy się .htaccess i dynamiczna konfiguracja.',
                'Nginx wygrywa przy dużym obciążeniu, w roli pośrednika odwrotnego i przy plikach statycznych.'],
        explain: 'Nginx: wysokie obciążenie, pośrednik odwrotny i rozkładanie obciążenia, pliki statyczne. Apache: hosting współdzielony, .htaccess, konfiguracja dynamiczna.'
      },
      {
        id: 'a4q5', title: 'Zmiana konfiguracji', digit: 9,
        evidence: { title: 'Dowód 5/5 · notatka Starej Kornackiej', kind: 'note', lines: [
          'Administrator zmienił regułę w pliku .htaccess na serwerze Apache oraz inną w pliku /etc/nginx/nginx.conf na serwerze Nginx.'
        ] },
        ask: 'Co trzeba zrobić, aby obie zmiany zaczęły działać?',
        kind: 'choice',
        options: [
          'Apache: nic (.htaccess jest czytany przy żądaniach). Nginx: przeładować konfigurację.',
          'Oba wymagają restartu całego komputera.',
          'Apache: przeładować serwer. Nginx: nic.',
          'Żaden z nich nie pozwala zmieniać konfiguracji w trakcie pracy.',
          'Należy napisać serwer od nowa.'
        ],
        correct: 0,
        hints: ['Który serwer ma konfigurację „dynamiczną” na poziomie katalogów?',
                'Nginx ma konfigurację „tylko globalną”, więc jej zmiana wymaga przeładowania.'],
        explain: '.htaccess to konfiguracja dynamiczna: Apache sprawdza go przy obsłudze żądań, więc zmiana działa od razu. Konfiguracja Nginx jest globalna i wymaga przeładowania.'
      }
    ],

    clue: {
      title: 'Dowód IV · Pośrednik to Nginx',
      text: 'W koszu Człowieka-w-Środku znaleziono konfigurację Nginx: upstream, proxy_pass i dyrektywę sub_filter, która zamienia „Kocham” na „Nie kocham”. Pośrednik działa na Nginx.',
      attr: 'server', value: 'Nginx'
    },

    reveal: {
      takeaways: [
        'Apache: modułowy, stabilny, z .htaccess — hosting współdzielony. Nginx: asynchroniczny, wydajny — pośrednik odwrotny i rozkładanie obciążenia.',
        'Apache: dyrektywy Listen, DocumentRoot, ServerName, <Directory>, a2enmod; Nginx: bloki server, location, upstream, proxy_pass.',
        'Zmiana .htaccess działa od razu; zmiana konfiguracji Nginx wymaga przeładowania.'
      ],
      next: 'Za chwilę Akt V: Cyborg w środku. Jak działa HTTPS i dlaczego ma znaczenie?'
    },

    quick: [
      { t: 'Plik .htaccess działa w Nginx tak samo jak w Apache.', a: false, why: 'Nginx nie ma konfiguracji na poziomie katalogów.' },
      { t: 'Nginx ma architekturę asynchroniczną, sterowaną zdarzeniami.', a: true, why: 'Dzięki temu obsługuje tysiące połączeń przy małym zużyciu pamięci.' },
      { t: 'Dyrektywa „Listen 80” w Apache określa port nasłuchiwania.', a: true, why: 'To podstawowa dyrektywa w pliku konfiguracyjnym.' },
      { t: 'Polecenie a2enmod rewrite wyłącza moduł rewrite w Apache.', a: false, why: 'a2enmod włącza moduł; wyłącza go a2dismod.' }
    ],

    hostSay: {
      start: 'Akt IV, najdłuższy. W odprawie są dwie rzeczy do przeczytania: Apache i Nginx — oraz kod pośrednika odwrotnego. Proszę nie czytać wszystkiego: wystarczy szukać słów, które pojawiają się w dowodach.',
      reveal: 'Jedno zdanie: wybór serwera zależy od zastosowania. Apache — elastyczny i dynamiczny (.htaccess), Nginx — szybki i lekki, idealny jako pośrednik odwrotny.'
    }
  };
}));
