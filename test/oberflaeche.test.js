/**
 * Prüft Kopfzeile, Fußzeile und Artikelseite in der Darstellung, die der
 * Server ausliefert (ADR-0003) — ohne DOM, mit `svelte/server`.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';

import Kopfzeile from '../src/lib/komponenten/Kopfzeile.svelte';
import Fusszeile from '../src/lib/komponenten/Fusszeile.svelte';
import Artikelseite from '../src/routes/[naddr]/+page.svelte';
import Bildbereich from '../src/lib/komponenten/Bildbereich.svelte';
import { GRUND_TEXT } from '../src/lib/models/lizenz.js';

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
    naddr: 'naddr1beispiel',
    artikel: {
      titel: 'Die Kraft der Gemeinschaft',
      zusammenfassung: 'Wahre Stärke liegt in Prozessen.',
      veroeffentlicht: VEROEFFENTLICHT,
      themen: ['OER', 'Community'],
      // Zu 'kein-nachweis' gehört eine Bildadresse — ohne sie wäre der Grund
      // 'kein-bild'. Seit ADR-0022 wird das Bild damit auch ausgeliefert.
      bildUrl: 'https://blossom.edufeed.org/abc.jpeg'
    },
    lizenz: { ok: false, grund: 'kein-nachweis' },
    teile: [{ art: 'html', html: '<p>Absatz.</p>' }],
    fliesstext: {},
    entfernteBilder: ['nosTr-schrein.jpg'],
    befund: null,
    ...abweichung
  });
}

describe('Kopfzeile', () => {
  const { body } = render(Kopfzeile);

  it('trägt die Wortmarke und führt zur Startseite', () => {
    expect(body).toMatch(/<a[^>]+href="\/"/);
    expect(body).toMatch(/Community-<span[^>]*>Hub/);
  });

  it('bietet keine Navigation an — es gibt nichts, wohin (CLAUDE.md)', () => {
    expect(body).not.toMatch(/<nav\b/);
  });
});

describe('Fußzeile', () => {
  const { body } = render(Fusszeile);

  it('trägt die Wortmarke und den Debug-Schalter', () => {
    expect(body).toMatch(/Community-<span[^>]*>Hub/);
    expect(body).toMatch(/type="checkbox"/);
  });

  it('nennt kein Relay — Adressen sind Konfiguration, kein Code', () => {
    expect(body).not.toContain('wss://');
    expect(body).not.toContain('edufeed.org');
  });
});

describe('Artikelseite', () => {
  it('setzt das Datum maschinenlesbar als <time>', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    expect(body).toMatch(new RegExp(`<time[^>]+datetime="${VEROEFFENTLICHT.slice(0, 10)}`));
  });

  it('zeigt jedes Thema als Marker in der Metazeile', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    for (const thema of ['OER', 'Community']) {
      expect(body).toMatch(new RegExp(`class="marker[^"]*"[^>]*>\\s*${thema}`));
    }
  });

  it('zeigt das Bild auch ohne Nachweis und weist den Stand aus (ADR-0022)', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    // Das Bild wird ausgeliefert — der Kern von ADR-0022, Punkt 2.
    expect(body).toContain('https://blossom.edufeed.org/abc.jpeg');
    // …aber nicht stillschweigend: der Stand steht daran.
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(GRUND_TEXT['kein-nachweis']);
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
      props: { data: mitNachweis({ titel: 'nosTr-schrein', credit: 'Comenius-Institut' }) }
    });
    // Reihenfolge normativ: Titel, Urheber, Lizenz — nur Kommas, keine Wörter.
    const titel = body.indexOf('nosTr-schrein</span>');
    const urheber = body.indexOf('Comenius-Institut</span>');
    const lizenz = body.indexOf('CC0 (Public Domain)</a>');
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
        })
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
        })
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
        })
      }
    });
    expect(body).toMatch(/<img[^>]+alt="Schrein als Sinnbild zyklischer Erneuerung"/);
    expect(body).not.toMatch(/<img[^>]+alt="nosTr-schrein"/);
  });

  it('faellt beim Alt-Text auf den Titel des Nachweises zurueck — wie Editor und md2blossom', () => {
    const { body } = render(Artikelseite, {
      props: { data: mitNachweis({ titel: 'nosTr-schrein' }) }
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
        })
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
      props: { data: mitFliesstextbild({ ok: false, grund: 'kein-nachweis' }) }
    });
    expect(body).toMatch(/<img[^>]+src="https:\/\/blossom\.edufeed\.org\/bild\.jpeg"/);
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain('>CC0</a>');
    expect(body).toContain('Comenius-Institut');
  });

  it('erklärt die aus dem Fließtext entfernten Bildverweise', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    expect(body).toContain('nosTr-schrein.jpg');
    // Der Grund ist ADR-0015 (kein Nachweis), nicht der Pfad: absolute
    // Blossom-Verweise werden genauso entfernt wie relative.
    expect(body).toContain('keinen Lizenznachweis');
    expect(body).not.toContain('alten Website');
  });

  it('zeigt bei kein-bild keinen Hinweis — kein Bild ist kein Fehler', () => {
    const { body } = render(Artikelseite, {
      props: {
        data: seitendaten({
          artikel: { ...seitendaten().artikel, bildUrl: null },
          lizenz: { ok: false, grund: 'kein-bild' },
          entfernteBilder: []
        })
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
        })
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
