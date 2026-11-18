/* Akt V — Cyborg w środku: bezpieczeństwo serwerów WWW i HTTPS. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.actData = root.CM.actData || {}; root.CM.actData[5] = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    roman: 'V',
    icon: '🔐',
    title: 'Cyborg w środku',
    subtitle: 'Bezpieczeństwo serwerów WWW i HTTPS',
    setting: 'W klasztorze w Tybecie (NY) Abhidhammapitaka pokazuje ekran telefonu. Tamtego wieczoru przeglądarka ostrzegała ją czerwoną stroną. Ona jednak bardzo chciała przeczytać list.',
    durSec: 420,
    revealSec: 55,

    briefing: [
      { title: 'Cztery filary bezpieczeństwa', icon: '🛡️', blocks: [
        { ul: [
          '**Aktualizacje**: regularne aktualizacje serwera i modułów, śledzenie biuletynów bezpieczeństwa.',
          '**Minimalizacja powierzchni ataku**: wyłączanie zbędnych modułów, ukrycie wersji serwera (`ServerTokens Prod`), blokada listowania katalogów (`Options -Indexes`).',
          '**Kontrola dostępu**: np. `Require ip 192.168.1.0/24`, `Require valid-user`.',
          '**Ochrona przed atakami**: ModSecurity (zapora aplikacji WWW, WAF), ograniczanie liczby żądań (rate limiting), blokowanie podejrzanych User-Agent.'
        ] },
        { note: 'Uwaga do Apache: kilka dyrektyw Require w jednym bloku domyślnie działa jak „LUB”. Aby wymagać wszystkich warunków naraz, trzeba użyć bloku <RequireAll>.' }
      ] },
      { title: 'HTTPS = HTTP + SSL/TLS', icon: '🔒', blocks: [
        { ul: [
          '**Poufność** — dane są szyfrowane,',
          '**Integralność** — ochrona przed modyfikacją w drodze,',
          '**Autentykacja** — weryfikacja tożsamości serwera (certyfikat),',
          'lepsze pozycjonowanie w wyszukiwarkach (SEO).'
        ] },
        { voice: { who: 'Herlock Sholmes', text: 'Bez HTTPS każdy, kto stoi po drodze, czyta listy i może je poprawiać. Z HTTPS przeglądarka sprawdza, kto stoi po drugiej stronie: cyborg musi pokazać certyfikat, a ten nie będzie pasował do domeny. Chyba że ktoś kliknie „Mimo to przejdź dalej”.' } }
      ] },
      { title: 'Let’s Encrypt: darmowe certyfikaty', icon: '🆓', blocks: [
        { code: [
          '# instalacja narzędzia certbot',
          'apt install certbot python3-certbot-apache',
          '',
          '# uzyskanie certyfikatu dla Apache',
          'certbot --apache -d example.com -d www.example.com',
          '',
          '# automatyczne odnawianie (test)',
          'certbot renew --dry-run'
        ] }
      ] },
      { title: 'Apache z certyfikatem', icon: '📜', blocks: [
        { code: [
          '<VirtualHost *:443>',
          '  ServerName example.com',
          '  SSLEngine on',
          '  SSLCertificateFile    /etc/letsencrypt/live/example.com/fullchain.pem',
          '  SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem',
          '</VirtualHost>'
        ] },
        { note: 'Certyfikat (fullchain.pem) jest publiczny. Klucz prywatny (privkey.pem) musi pozostać tajny.' }
      ] }
    ],

    questions: [
      {
        id: 'a5q1', title: 'Co daje HTTPS?', digit: 7,
        evidence: { title: 'Dowód 1/5 · pytanie Bonda do Sholmesa', kind: 'note', lines: [
          'Bond: „Dlaczego cyborg mógł zmieniać listy bez śladu? Co dokładnie daje HTTPS?”'
        ] },
        ask: 'Proszę zaznaczyć WSZYSTKIE właściwości, które zapewnia HTTPS.',
        kind: 'multi',
        options: [
          'Poufność: dane są szyfrowane.',
          'Integralność: modyfikacja danych w drodze zostanie wykryta.',
          'Autentykacja: klient może sprawdzić tożsamość serwera.',
          'Ukrycie wersji serwera w nagłówkach odpowiedzi.',
          'Automatyczne rozkładanie obciążenia między serwerami.'
        ],
        correct: [0, 1, 2],
        hints: ['Trzy hasła z odprawy: poufność, integralność, autentykacja.',
                'Ukrywanie wersji (ServerTokens) i rozkładanie obciążenia to osobne tematy.'],
        explain: 'HTTPS zapewnia poufność, integralność i autentykację serwera. Ukrycie wersji (ServerTokens Prod) to osobne zabezpieczenie, a rozkładanie obciążenia — zadanie pośrednika.'
      },
      {
        id: 'a5q2', title: 'Pomylone pliki', digit: 3,
        evidence: { title: 'Dowód 2/5 · konfiguracja z podręcznika (example.com)', kind: 'code', lines: [
          '<VirtualHost *:443>',
          '    ServerName example.com',
          '    SSLEngine on',
          '    SSLCertificateFile    /etc/letsencrypt/live/example.com/privkey.pem',
          '    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/fullchain.pem',
          '</VirtualHost>'
        ] },
        ask: 'Administrator pomylił dwa pliki. Proszę zaznaczyć dokładnie dwie błędne linie.',
        kind: 'lines',
        selectable: [1, 2, 3, 4],
        correct: [3, 4],
        hints: ['Błąd jest w dwóch sąsiednich liniach, w nazwach plików.',
                'Certyfikat to fullchain.pem, a klucz prywatny to privkey.pem — a tu jest odwrotnie.'],
        explain: 'SSLCertificateFile powinien wskazywać fullchain.pem (certyfikat z łańcuchem), a SSLCertificateKeyFile — privkey.pem (klucz prywatny).'
      },
      {
        id: 'a5q3', title: 'Certbot krok po kroku', digit: 9,
        evidence: { title: 'Dowód 3/5 · trzy karteczki z polecenia Lupina', kind: 'note', lines: [
          'Lupin: „Aby zdobyć darmowy certyfikat, trzeba wykonać trzy czynności: zainstalować narzędzie, uzyskać certyfikat i sprawdzić odnawianie.”'
        ] },
        ask: 'Proszę ułożyć polecenia w kolejności wykonywania.',
        kind: 'order',
        items: [
          'apt install certbot python3-certbot-apache',
          'certbot --apache -d example.com -d www.example.com',
          'certbot renew --dry-run'
        ],
        hints: ['Najpierw trzeba mieć program.',
                'Test odnawiania ma sens dopiero wtedy, gdy certyfikat już istnieje.'],
        explain: 'Najpierw instalacja certbota, następnie uzyskanie certyfikatu i konfiguracja Apache, na końcu test automatycznego odnawiania (--dry-run).'
      },
      {
        id: 'a5q4', title: 'Dlaczego przeglądarka ostrzega?', digit: 1,
        evidence: { title: 'Dowód 4/5 · ekran telefonu Abhidhammapitaki', kind: 'code', lines: [
          'Otwarto: https://listy.cyborgi.example',
          'Certyfikat przedstawiony przez serwer:',
          '  Wystawiony dla (CN):  listy-cyborgi.example.net',
          '  Wystawca:             Let’s Encrypt',
          '  Data wystawienia:     14 lis 2026',
          '',
          'Komunikat: „Połączenie nie jest prywatne”   [Mimo to przejdź dalej]'
        ] },
        ask: 'Który wiersz tłumaczy ostrzeżenie przeglądarki?',
        kind: 'lines',
        selectable: [2, 3, 4],
        correct: [2],
        hints: ['Przeglądarka porównuje adres, który wpisano, z nazwą w certyfikacie.',
                'Adres to listy.cyborgi.example, a certyfikat jest wystawiony dla listy-cyborgi.example.net.'],
        explain: 'Certyfikat jest wystawiony dla innej domeny niż ta, którą otwarto, więc nie potwierdza tożsamości serwera. Wystawcą jest Let’s Encrypt: bezpłatny urząd certyfikacji, z którego może skorzystać każdy.'
      },
      {
        id: 'a5q5', title: 'Dyrektywa → skutek', digit: 5,
        evidence: { title: 'Dowód 5/5 · lista zabezpieczeń Kornackiej', kind: 'note', lines: [
          'Stara Kornacka: „Pięć zabezpieczeń straganu. Do każdego pasuje jeden skutek.”'
        ] },
        ask: 'Proszę dopasować zabezpieczenia do ich skutków.',
        kind: 'assign',
        items: [
          'ServerTokens Prod',
          'Options -Indexes',
          'Require ip 192.168.1.0/24',
          'ModSecurity',
          'a2dismod status'
        ],
        buckets: [
          'ukrywa wersję serwera',
          'blokuje listowanie katalogów',
          'ogranicza dostęp do wskazanej sieci',
          'zapora aplikacji WWW (WAF)',
          'wyłącza zbędny moduł'
        ],
        correct: [0, 1, 2, 3, 4],
        hints: ['Nazwy są częściowo opisowe: Tokens (wersja), Indexes (spis), ip (adres), a2dismod (wyłącz moduł).',
                'ModSecurity to jedyne zabezpieczenie w tej liście, które działa jak zapora aplikacji WWW.'],
        explain: 'ServerTokens Prod — ukrycie wersji; Options -Indexes — brak listowania katalogów; Require ip — ograniczenie do sieci; ModSecurity — WAF; a2dismod — wyłączenie modułu (mniejsza powierzchnia ataku).'
      }
    ],

    clue: {
      title: 'Dowód V · Fałszywy certyfikat z Let’s Encrypt',
      text: 'Pośrednik pokazał certyfikat wystawiony przez Let’s Encrypt (bezpłatny urząd certyfikacji) dla domeny listy-cyborgi.example.net, a nie dla domeny listów. Przeglądarka ostrzegała, ale Abhidhammapitaka kliknęła „Mimo to przejdź dalej”. Człowiek-w-Środku zna certbota.',
      attr: 'cert', value: 'Let’s Encrypt'
    },

    reveal: {
      takeaways: [
        'Cztery filary: aktualizacje, minimalizacja powierzchni ataku (ServerTokens Prod, Options -Indexes, zbędne moduły), kontrola dostępu (Require) i ochrona przed atakami (ModSecurity, rate limiting).',
        'HTTPS to HTTP + TLS: poufność, integralność, autentykacja serwera. Ostrzeżeń przeglądarki o certyfikacie nie wolno ignorować.',
        'Let’s Encrypt: darmowe certyfikaty (certbot); w Apache SSLCertificateFile = fullchain.pem, SSLCertificateKeyFile = privkey.pem.'
      ],
      next: 'Za chwilę Akt VI: wydajność, monitoring i dziennik varanów.'
    },

    quick: [
      { t: 'Let’s Encrypt wydaje certyfikaty bezpłatnie.', a: true, why: 'Dzięki temu certyfikat uzyska każdy — także Człowiek-w-Środku.' },
      { t: 'Plik privkey.pem można bezpiecznie opublikować w sieci.', a: false, why: 'To klucz prywatny; musi pozostać tajny.' },
      { t: 'Dyrektywa ServerTokens Prod ogranicza informacje o wersji serwera.', a: true, why: 'Utrudnia dobór ataku do konkretnej wersji oprogramowania.' },
      { t: 'HTTPS szyfruje dane, ale nie pozwala sprawdzić tożsamości serwera.', a: false, why: 'Autentykacja serwera (certyfikat) to jedna z trzech podstawowych właściwości.' }
    ],

    hostSay: {
      start: 'Akt V to sedno historii. Jeśli ktoś ma wyjąć z całego wykładu jedną rzecz, niech to będzie ta: certyfikat potwierdza tożsamość serwera, a ostrzeżenie przeglądarki nie jest dekoracją.',
      reveal: 'Zapamiętać wystarczy: HTTPS daje poufność, integralność i autentykację; certyfikaty z Let’s Encrypt są darmowe — z nich korzystają też atakujący, więc ważna jest zgodność domeny.'
    }
  };
}));
