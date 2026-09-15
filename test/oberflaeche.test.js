/**
 * Prüft Kopfzeile, Fußzeile und Artikelseite in der Darstellung, die der
 * Server ausliefert (ADR-0003) — ohne DOM, mit `svelte/server`.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { render } from 'svelte/server';

import Kopfzeile from '../src/lib/komponenten/Kopfzeile.svelte';
import Fusszeile from '../src/lib/komponenten/Fusszeile.svelte';
import Artikelseite from '../src/lib/komponenten/Detail.svelte';
import Bildbereich from '../src/lib/komponenten/Bildbereich.svelte';
import { GRUND_TEXT } from '../src/lib/models/lizenz.js';
import { HUB_ANSICHTEN } from '../src/lib/routen/struktur.js';

/** @type {any} */
const ARTIKEL = JSON.parse(
  readFileSync(
    new URL('./fixtures/artikel-30023-die-kraft-der-gemeinschaft.json', import.meta.url),
    'utf8'
  )
)[0];

const VEROEFFENTLICHT = new Date(1788433547 * 1000).toISOString();

/** @param {Partial<Record<string, unknown>>} abweichung */
function seitendaten(abweichung = {}) {
  return /** @type {any} */ ({
    pfad: '/die-kraft-der-gemeinschaft',
    stand: { zeitpunkt: '2026-09-14T10:00:00Z', nichtErreichbar: [] },
    artikel: {
      titel: 'Die Kraft der Gemeinschaft',
      zusammenfassung: 'Wahre Stärke liegt in Prozessen.',
      veroeffentlicht: VEROEFFENTLICHT,
      themen: ['OER', 'Community'],
      // Zu 'kein-nachweis' gehört eine Bildadresse — ohne sie wäre der Grund
      // 'kein-bild'. Seit ADR-0022 wird das Bild damit auch ausgeliefert.
      bildUrl: 'https://blossom.edufeed.org/abc.jpeg',
      sprache: 'de'
    },
    uebersetzung: null,
    lizenz: { ok: false, grund: 'kein-nachweis' },
    teile: [{ art: 'html', html: '<p>Absatz.</p>' }],
    fliesstext: {},
    entfernteBilder: ['nosTr-schrein.jpg'],
    befund: null,
    ...abweichung
  });
}

const MENUE = [
  { titel: 'Unser Team', pfad: '/unser-team', d: 'unser-team' },
  { titel: 'Blog', pfad: '/blog', d: '' },
  { titel: 'Themen', pfad: '/themen', d: '' }
];

describe('Kopfzeile', () => {
  // Feed-Hinweis im <head>: das Layout selbst lässt sich mit svelte/server
  // nicht rendern (children-Snippet), deshalb steht der Hinweis hier (ADR-0029).
  it('setzt den Feed-Hinweis im <head>', () => {
    const { head } = render(Kopfzeile, {
      props: { wortmarke: 'Community-Hub', menue: HUB_ANSICHTEN }
    });
    expect(head).toContain('<link rel="alternate" type="application/rss+xml"');
    expect(head).toContain('href="/feed.xml"');
    expect(head).toContain('title="Community-Hub — Blog"');
  });

  it('Kopfzeile: Logo und Wortmarke verlinken auf /, Menü aus der Struktur, aktueller Eintrag markiert', () => {
    const { body } = render(Kopfzeile, {
      props: {
        wortmarke: 'Testquelle',
        logoUrl: 'https://blossom.example/logo.png',
        menue: MENUE,
        aktuellerPfad: '/blog/seite/2'
      }
    });
    expect(body).toContain('<img src="https://blossom.example/logo.png"');
    expect(body).toContain('Testquelle');
    expect(body).toContain('href="/unser-team"');
    expect(body).toMatch(
      /href="\/blog"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/blog"/
    );
    expect(body).not.toMatch(/href="\/themen"[^>]*aria-current/);
  });

  it('nur mit den Hub-Ansichten: genau zwei Men\u00fclinks', () => {
    const { body } = render(Kopfzeile, {
      props: { wortmarke: 'Community-Hub', menue: HUB_ANSICHTEN }
    });
    const links = body.match(/<nav[\s\S]*?<\/nav>/)?.[0].match(/<a /g) ?? [];
    expect(links).toHaveLength(2);
    expect(body).toContain('href="/blog"');
    expect(body).toContain('href="/themen"');
  });

  it('Kopfzeile ohne Logo: nur Wortmarke, kein <img>', () => {
    const { body } = render(Kopfzeile, {
      props: { wortmarke: 'Community-Hub', logoUrl: null, menue: MENUE }
    });
    expect(body).not.toContain('<img');
    expect(body).toContain('Community-Hub');
  });

  it('zeigt den Umschalter DE | EN nur zweisprachig; die aktuelle Sprache ist kein Link (ADR-0033)', () => {
    const de = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN, zweisprachig: true, sprache: 'de', wechselPfad: '/en/our-team' } }).body;
    expect(de).toMatch(/<a[^>]+href="\/en\/our-team"[^>]+hreflang="en"[^>]*>EN<\/a>/);
    expect(de).toMatch(/aria-current="true"[^>]*>DE</);
    const en = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN, zweisprachig: true, sprache: 'en', wechselPfad: '/' } }).body;
    expect(en).toMatch(/<a[^>]+href="\/"[^>]+hreflang="de"[^>]*>DE<\/a>/);
    expect(en).toContain('aria-label="Language"');
    const einsprachig = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN } }).body;
    expect(einsprachig).not.toContain('hreflang=');
  });

  it('die Wortmarke führt auf die Startseite der Sprache (ADR-0033)', () => {
    const en = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN, sprache: 'en' } }).body;
    expect(en).toMatch(/<a href="\/en" class="marke[ "]/);
    const de = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN } }).body;
    expect(de).toMatch(/<a href="\/" class="marke[ "]/);
  });
});

/** @type {import('../src/lib/loaders/struktur.js').Struktur['befund']} */
const BEFUND = {
  profil: 'ok',
  navigation: 'fehlt',
  fusszeile: 'ok',
  startseite: 'fehlt',
  erwartet: {
    profil: 'kind:0 von abc…',
    navigation: 'kind:30004 mit d = "navigation" von abc…',
    fusszeile: 'kind:30004 mit d = "fusszeile" von abc…',
    startseite: 'kind:30023 mit d = "startseite" von abc…'
  },
  uebersprungen: ['fusszeile: „datenschutz“ liegt nicht im Spiegel']
};

describe('Fußzeile', () => {
  it('trägt die Wortmarke und den Debug-Schalter', () => {
    const { body } = render(Fusszeile, { props: { wortmarke: 'Community-Hub' } });
    expect(body).toMatch(/Community-Hub/);
    expect(body).toMatch(/type="checkbox"/);
  });

  // Seit ADR-0029 ist die Adresse das d, nicht das naddr — die Fußzeile darf
  // nichts anderes behaupten.
  it('nennt das d als Adresse und das naddr nur als Weiterleitung', () => {
    const { body } = render(Fusszeile, { props: { wortmarke: 'Community-Hub' } });
    expect(body).toContain('unter seiner stabilen Adresse');
    expect(body).toMatch(/leitet dorthin weiter/);
    expect(body).not.toMatch(/stabilen <code>naddr<\/code>-Adresse/);
  });

  it('nennt kein Relay — Adressen sind Konfiguration, kein Code', () => {
    const { body } = render(Fusszeile, { props: { wortmarke: 'Community-Hub' } });
    expect(body).not.toContain('wss://');
    expect(body).not.toContain('edufeed.org');
  });

  it('nennt das Alter nur, wenn der letzte Lauf scheiterte', () => {
    const alt = render(Fusszeile, {
      props: {
        wortmarke: 'Community-Hub',
        spiegelstand: { zeitpunkt: '2026-09-14T07:00:00Z', veraltet: true, relays: ['wss://r/'] }
      }
    }).body;
    expect(alt).toContain('Stand:');
    expect(alt).toContain('kein Relay erreichbar');

    const frisch = render(Fusszeile, {
      props: {
        wortmarke: 'Community-Hub',
        spiegelstand: { zeitpunkt: '2026-09-14T07:00:00Z', veraltet: false, relays: [] }
      }
    }).body;
    expect(frisch).not.toContain('Stand:');
  });

  it('Fußzeile: Fußtext-HTML, Links und Wortmarke', () => {
    const { body } = render(Fusszeile, {
      props: {
        wortmarke: 'Testquelle',
        fusstextHtml: '<p>CC BY <strong>Testquelle</strong></p>',
        links: [{ titel: 'Impressum', pfad: '/impressum', d: 'impressum' }],
        befund: BEFUND
      }
    });
    expect(body).toContain('<strong>Testquelle</strong>');
    expect(body).toContain('href="/impressum"');
    expect(body).not.toContain('Schaufenster für Beiträge');
  });

  it('ohne Links rendert die Fu\u00dfzeile keine Linkliste', () => {
    const { body } = render(Fusszeile, { props: { wortmarke: 'Community-Hub', links: [] } });
    expect(body).not.toContain('class="links"');
  });

  it('Fußzeile ohne Fußtext zeigt den Rückfallsatz; der Befund erscheint nur im Debug-Modus', () => {
    const zu = render(Fusszeile, {
      props: { wortmarke: 'Community-Hub', befund: BEFUND }
    }).body;
    expect(zu).toContain('Schaufenster für Beiträge');
    expect(zu).not.toContain('erwartet:');

    const offen = render(Fusszeile, {
      props: { wortmarke: 'Community-Hub', befund: BEFUND, debugStart: true }
    }).body;
    expect(offen).toContain('kind:30004 mit d = "navigation"');
    expect(offen).toContain('datenschutz');
  });
});

describe('Artikelseite', () => {
  it('setzt <link rel="canonical"> aus der kanonischenUrl', () => {
    const { head } = render(Artikelseite, {
      props: {
        data: seitendaten(),
        wortmarke: 'T',
        kanonischeUrl: 'https://oer.community/die-kraft-der-gemeinschaft'
      }
    });
    expect(head).toContain('<link rel="canonical" href="https://oer.community/die-kraft-der-gemeinschaft"');
  });

  // Eine leere description ist schlechter als keine: Suchmaschinen und
  // Vorschauen lesen sie als ausdr\u00fcckliche Leerangabe.
  it('setzt <meta name="description"> nur, wenn eine Zusammenfassung da ist', () => {
    const mit = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'T' } });
    expect(mit.head).toContain('name="description"');

    const ohne = render(Artikelseite, {
      props: {
        data: seitendaten({ artikel: { ...seitendaten().artikel, zusammenfassung: '' } }),
        wortmarke: 'T'
      }
    });
    expect(ohne.head).not.toContain('name="description"');
  });

  it('eine Seite zeigt Titel und Inhalt, aber kein Datum, keine Themen, kein Cover', () => {
    const { body, head } = render(Artikelseite, {
      props: {
        data: seitendaten({
          artikel: {
            ...seitendaten().artikel,
            istSeite: true,
            themen: ['X'],
            bildUrl: 'https://blossom.edufeed.org/abc.jpg'
          }
        }),
        wortmarke: 'Testquelle'
      }
    });
    expect(body).toContain('<h1');
    expect(body).not.toContain('<time');
    expect(body).not.toContain('class="marker"');
    expect(body).not.toContain('<img');
    expect(head).toContain('<title>Die Kraft der Gemeinschaft · Testquelle</title>');
  });

  it('ein Artikel behält Datum und Themen; die Startseite trägt nur die Wortmarke im Titel', () => {
    const artikel = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'Testquelle' } });
    expect(artikel.body).toContain('<time');
    const start = render(Artikelseite, {
      props: {
        data: seitendaten({ artikel: { ...seitendaten().artikel, istSeite: true, titel: 'Willkommen' } }),
        wortmarke: 'Testquelle',
        nurWortmarke: true
      }
    });
    expect(start.head).toContain('<title>Testquelle</title>');
  });

  it('setzt das Datum maschinenlesbar als <time>', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'Testquelle' } });
    expect(body).toMatch(new RegExp(`<time[^>]+datetime="${VEROEFFENTLICHT.slice(0, 10)}`));
  });

  it('zeigt jedes Thema als Marker in der Metazeile', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'Testquelle' } });
    for (const thema of ['OER', 'Community']) {
      expect(body).toMatch(new RegExp(`class="marker[^"]*"[^>]*>\\s*${thema}`));
    }
  });

  it('zeigt das Bild auch ohne Nachweis und weist den Stand aus (ADR-0022)', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'Testquelle' } });
    // Das Bild wird ausgeliefert — der Kern von ADR-0022, Punkt 2.
    expect(body).toContain('https://blossom.edufeed.org/abc.jpeg');
    // …aber nicht stillschweigend: der Stand steht daran.
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(GRUND_TEXT['kein-nachweis']);
  });

  it('legt die Lizenzpille über das Cover — bekannt wie ungeklärt — und behält die Unterschrift (ADR-0032)', () => {
    const ohne = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'T' } }).body;
    expect(ohne).toContain('class="pille ungeklaert');
    expect(ohne.indexOf('class="pille')).toBeGreaterThan(ohne.indexOf('<img'));
    expect(ohne.indexOf('class="pille')).toBeLessThan(ohne.indexOf('<figcaption'));

    const mit = render(Artikelseite, {
      props: { data: mitNachweis({ titel: 'nosTr-schrein', credit: 'Comenius-Institut' }), wortmarke: 'T' }
    }).body;
    expect(mit).toContain('class="pille bekannt');
    // Die Pille ist Marke, die Unterschrift bleibt die Attribution nach bildattribution.md.
    expect(mit).toContain('<figcaption');
    expect(mit).toContain('rel="license');
  });

  /** @param {Record<string, unknown>} felder */
  function mitNachweis(felder) {
    return seitendaten({
      lizenz: {
        ok: true,
        nachweis: {
          id: 'a'.repeat(64),
          hash: 'b'.repeat(64),
          url: 'https://blossom.edufeed.org/bild.jpeg',
          titel: null,
          license: 'https://creativecommons.org/publicdomain/zero/1.0/',
          credit: null,
          beschreibung: null,
          quelle: null,
          alt: null,
          urheberUrl: null,
          bearbeitung: null,
          mime: 'image/jpeg',
          ...felder
        }
      },
      entfernteBilder: []
    });
  }

  it('beschriftet ein nachgewiesenes Bild nach bildattribution.md (ADR-0022)', () => {
    const { body } = render(Artikelseite, {
      props: { data: mitNachweis({ titel: 'nosTr-schrein', credit: 'Comenius-Institut' }), wortmarke: 'Testquelle' }
    });
    // Reihenfolge normativ: Titel, Urheber, Lizenz — nur Kommas, keine Wörter.
    // Gesucht wird erst ab der Bildunterschrift: die Lizenzpille über dem
    // Bild nennt Titel und Urheber ebenfalls (ADR-0032), aber vor ihr.
    const start = body.indexOf('<figcaption');
    const titel = body.indexOf('nosTr-schrein</span>', start);
    const urheber = body.indexOf('Comenius-Institut</span>', start);
    const lizenz = body.indexOf('CC0 (Public Domain)</a>', start);
    expect(titel).toBeGreaterThan(-1);
    expect(urheber).toBeGreaterThan(titel);
    expect(lizenz).toBeGreaterThan(urheber);
    expect(body).toMatch(
      /<a[^>]+href="https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/"[^>]*>CC0 \(Public Domain\)<\/a>/
    );
    expect(body).toContain('rel="license');
    expect(body).not.toContain('von Comenius-Institut');
    expect(body).not.toContain('Ursprung');
    expect(body).not.toContain('Lizenz ungeklärt');
  });

  it('verlinkt Titel auf Quelle und Urheber auf authorUrl und nennt die Bearbeitung', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: mitNachweis({
          titel: 'garden rhubarb',
          quelle: 'https://www.inaturalist.org/photos/71812633',
          credit: 'John Sankey',
          urheberUrl: 'https://www.inaturalist.org/users/2831535',
          license: 'https://creativecommons.org/licenses/by-sa/4.0/',
          bearbeitung: 'beschnitten'
        }),
        wortmarke: 'Testquelle'
      }
    });
    expect(body).toMatch(
      /<a[^>]+href="https:\/\/www\.inaturalist\.org\/photos\/71812633"[^>]*>garden rhubarb<\/a>/
    );
    expect(body).toMatch(
      /<a[^>]+href="https:\/\/www\.inaturalist\.org\/users\/2831535"[^>]*>John Sankey<\/a>/
    );
    expect(body).toMatch(
      /<a[^>]+href="https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/"[^>]*>CC BY-SA 4\.0<\/a>/
    );
    expect(body).toContain('beschnitten');
  });

  it('lässt den Urheber weg, wenn credit fehlt (ADR-0022)', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: mitNachweis({
          titel: 'Ein Bild',
          license: 'https://creativecommons.org/licenses/by-sa/4.0/'
        }),
        wortmarke: 'Testquelle'
      }
    });
    expect(body).toContain('CC BY-SA 4.0');
    expect(body).not.toContain('>null<');
    expect(body).not.toContain('Lizenz ungeklärt');
  });

  it('nimmt den Alt-Text aus dem Nachweis — nicht den Titel', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: mitNachweis({
          titel: 'nosTr-schrein',
          alt: 'Schrein als Sinnbild zyklischer Erneuerung'
        }),
        wortmarke: 'Testquelle'
      }
    });
    expect(body).toMatch(/<img[^>]+alt="Schrein als Sinnbild zyklischer Erneuerung"/);
    expect(body).not.toMatch(/<img[^>]+alt="nosTr-schrein"/);
  });

  it('faellt beim Alt-Text auf den Titel des Nachweises zurueck — wie Editor und md2blossom', () => {
    const { body } = render(Artikelseite, {
      props: { data: mitNachweis({ titel: 'nosTr-schrein' }), wortmarke: 'Testquelle' }
    });
    expect(body).toMatch(/<img[^>]+alt="nosTr-schrein"/);
  });

  /** Seite ohne Cover, mit einem Blossom-Bild im Text. @param {object} lizenz */
  function mitFliesstextbild(lizenz) {
    const HASH = 'b'.repeat(64);
    return seitendaten({
      artikel: { ...seitendaten().artikel, bildUrl: null },
      lizenz: { ok: false, grund: 'kein-bild' },
      teile: [
        { art: 'html', html: '<p>Davor</p>' },
        {
          art: 'bild',
          url: 'https://blossom.edufeed.org/bild.jpeg',
          hash: HASH,
          alt: 'Ein Schrein',
          unterschrift:
            'nosTr-schrein, Comenius-Institut, <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>'
        },
        { art: 'html', html: '<p>Danach</p>' }
      ],
      fliesstext: { [HASH]: lizenz },
      entfernteBilder: []
    });
  }

  it('zeigt ein Blossom-Bild im Text als Figur mit Attribution (ADR-0023)', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: mitFliesstextbild({
          ok: true,
          nachweis: {
            id: 'a'.repeat(64),
            hash: 'b'.repeat(64),
            url: 'https://blossom.edufeed.org/bild.jpeg',
            titel: 'nosTr-schrein',
            license: 'https://creativecommons.org/publicdomain/zero/1.0/',
            credit: 'Comenius-Institut',
            beschreibung: null,
            quelle: null,
            alt: null,
            urheberUrl: null,
            bearbeitung: null,
            mime: 'image/jpeg'
          }
        }),
        wortmarke: 'Testquelle'
      }
    });
    const davor = body.indexOf('Davor');
    const bild = body.search(/<img[^>]+src="https:\/\/blossom\.edufeed\.org\/bild\.jpeg"/);
    const danach = body.indexOf('Danach');
    expect(bild).toBeGreaterThan(davor);
    expect(danach).toBeGreaterThan(bild);
    // Alt-Text aus dem Markdown hat Vorrang — er gilt für diese Verwendung.
    expect(body).toMatch(/<img[^>]+alt="Ein Schrein"/);
    expect(body).toContain('CC0 (Public Domain)');
    // Die Konventionszeile aus dem Markdown ist ersetzt, nicht verdoppelt.
    expect(body).not.toContain('>CC0</a>');
    expect(body).not.toContain('Lizenz ungeklärt');
  });

  it('zeigt bei ungeklärter Lizenz die Markdown-Unterschrift als Rückfall', () => {
    const { body } = render(Artikelseite, {
      props: { data: mitFliesstextbild({ ok: false, grund: 'kein-nachweis' }), wortmarke: 'Testquelle' }
    });
    expect(body).toMatch(/<img[^>]+src="https:\/\/blossom\.edufeed\.org\/bild\.jpeg"/);
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain('>CC0</a>');
    expect(body).toContain('Comenius-Institut');
  });

  it('englischer Beitrag: Datum englisch, Lizenzpille englisch, hreflang auf das Gegenstück (ADR-0033)', () => {
    const { body, head } = render(Artikelseite, {
      props: {
        data: seitendaten({
          artikel: { ...seitendaten().artikel, sprache: 'en' },
          uebersetzung: { pfad: '/die-kraft-der-gemeinschaft', sprache: 'de' },
          pfad: '/en/the-power-of-community'
        }),
        wortmarke: 'T',
        basisUrl: 'https://oer.community'
      }
    });
    expect(body).toContain('Licence unclear');
    expect(body).not.toContain('Lizenz ungeklärt');
    expect(body).toMatch(/<time[^>]*>\d{1,2} September 2026<\/time>/);
    // Absolut, sonst wertet keine Suchmaschine die Alternate aus — und mit
    // Selbstverweis, weil ein Alternate-Paar beide Seiten nennen muss.
    expect(head).toContain(
      '<link rel="alternate" hreflang="de" href="https://oer.community/die-kraft-der-gemeinschaft"'
    );
    expect(head).toContain(
      '<link rel="alternate" hreflang="en" href="https://oer.community/en/the-power-of-community"'
    );
    const de = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'T' } });
    expect(de.head).not.toContain('hreflang=');
    expect(de.body).toContain('Lizenz ungeklärt');
  });

  it('erklärt die aus dem Fließtext entfernten Bildverweise', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'Testquelle' } });
    expect(body).toContain('nosTr-schrein.jpg');
    // Der Grund ist ADR-0015 (kein Nachweis), nicht der Pfad: absolute
    // Blossom-Verweise werden genauso entfernt wie relative.
    expect(body).toContain('ohne Lizenznachweis');
    expect(body).not.toContain('alten Website');
  });

  it('zeigt bei kein-bild keinen Hinweis — kein Bild ist kein Fehler', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: seitendaten({
          artikel: { ...seitendaten().artikel, bildUrl: null },
          lizenz: { ok: false, grund: 'kein-bild' },
          entfernteBilder: []
        }),
        wortmarke: 'Testquelle'
      }
    });
    expect(body).not.toContain('Lizenz ungeklärt');
    expect(body).not.toContain('Bild nicht angezeigt');
  });

  it('liefert ein relativ adressiertes Bild nicht aus (ADR-0013, Punkt 5)', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: seitendaten({
          artikel: { ...seitendaten().artikel, bildUrl: 'nosTr-schrein.jpg' },
          lizenz: { ok: false, grund: 'relativ' },
          entfernteBilder: []
        }),
        wortmarke: 'Testquelle'
      }
    });
    expect(body).toContain('Bild nicht angezeigt');
    expect(body).not.toMatch(/<img[^>]+src="nosTr-schrein\.jpg"/);
  });

  it('zeigt für ein Bild von einem abgelösten Host kein <img>, sondern den Hinweis', () => {
    const { body } = render(Bildbereich, {
      props: { lizenz: { ok: false, grund: 'abgeloester-host' }, titel: 'T', bildUrl: 'https://oer.community/b.jpg' }
    });
    expect(body).not.toContain('<img');
    expect(body).toContain(GRUND_TEXT['abgeloester-host']);
  });
});

/**
 * Alle .svelte-Dateien unter src/lib/komponenten/ und src/routes/, als
 * [Pfad, Text] — eigene kleine Kopie der Idee aus kontrast.test.js.
 * @returns {Array<[string, string]>}
 */
function komponentenQuellen() {
  const wurzel = new URL('..', import.meta.url).pathname;
  /** @type {Array<[string, string]>} */
  const gefunden = [];
  /** @param {string} verzeichnis */
  function durchsuchen(verzeichnis) {
    for (const eintrag of readdirSync(verzeichnis)) {
      if (eintrag === 'node_modules' || eintrag.startsWith('.')) continue;
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) {
        durchsuchen(pfad);
      } else if (eintrag.endsWith('.svelte')) {
        gefunden.push([relative(wurzel, pfad), readFileSync(pfad, 'utf8')]);
      }
    }
  }
  durchsuchen(join(wurzel, 'src', 'lib', 'komponenten'));
  durchsuchen(join(wurzel, 'src', 'routes'));
  return gefunden;
}

describe('FOERBICO-Token in Komponenten (ADR-0031)', () => {
  it('kein Alt-Token und kein Hex-Farbwert in Komponenten (ADR-0031)', () => {
    const alt =
      /var\(--(rl-|relilab|magenta|rpi|fau|amber|fuss-text|verlauf|aufmacher|schrift-(ueber|label|text)|marker-amber)/;
    const hex = /#[0-9a-fA-F]{3,8}\b/;
    for (const [pfad, text] of komponentenQuellen()) {
      expect(alt.test(text), `${pfad} nutzt ein Alt-Token`).toBe(false);
      const css = (text.match(/<style>[\s\S]*<\/style>/) ?? [''])[0];
      expect(hex.test(css), `${pfad} hat einen Hex-Farbwert im <style>`).toBe(false);
    }
  });
});
