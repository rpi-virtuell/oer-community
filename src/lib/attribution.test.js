import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nachweisAusEvents } from './models/lizenz.js';
import { attributionsGlieder } from './attribution.js';

const nachweisEvents = JSON.parse(
  readFileSync(
    new URL('../../test/fixtures/lizenz-1063-nostr-schrein.json', import.meta.url),
    'utf8'
  )
);

/** @param {Partial<import('./models/lizenz.js').Nachweis>} felder */
function nachweis(felder = {}) {
  return {
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
  };
}

describe('attributionsGlieder — bildattribution.md', () => {
  it('beschriftet den Referenzfall: Titel, Urheber, Lizenz-Link', () => {
    expect(attributionsGlieder(nachweisAusEvents(nachweisEvents))).toEqual([
      { art: 'titel', text: 'nosTr-schrein', href: null },
      { art: 'urheber', text: 'Comenius-Institut', href: null },
      {
        art: 'lizenz',
        text: 'CC0 (Public Domain)',
        href: 'https://creativecommons.org/publicdomain/zero/1.0/'
      }
    ]);
  });

  it('verlinkt Titel auf die Quelle und Urheber auf authorUrl, haengt die Bearbeitung an', () => {
    // Das Beispiel aus bildattribution.md.
    const g = attributionsGlieder(
      nachweis({
        titel: 'garden rhubarb',
        quelle: 'https://www.inaturalist.org/photos/71812633',
        credit: 'John Sankey',
        urheberUrl: 'https://www.inaturalist.org/users/2831535',
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        bearbeitung: 'beschnitten'
      })
    );
    expect(g).toEqual([
      { art: 'titel', text: 'garden rhubarb', href: 'https://www.inaturalist.org/photos/71812633' },
      { art: 'urheber', text: 'John Sankey', href: 'https://www.inaturalist.org/users/2831535' },
      { art: 'lizenz', text: 'CC BY-SA 4.0', href: 'https://creativecommons.org/licenses/by-sa/4.0/' },
      { art: 'bearbeitung', text: 'beschnitten', href: null }
    ]);
  });

  it('haelt die normative Reihenfolge auch bei Luecken', () => {
    const g = attributionsGlieder(nachweis({ credit: 'Wer', bearbeitung: 'skaliert' }));
    expect(g?.map((x) => x.art)).toEqual(['urheber', 'lizenz', 'bearbeitung']);
  });

  it('Mindestform: nur der Lizenz-Link', () => {
    expect(attributionsGlieder(nachweis())).toEqual([
      {
        art: 'lizenz',
        text: 'CC0 (Public Domain)',
        href: 'https://creativecommons.org/publicdomain/zero/1.0/'
      }
    ]);
  });

  it('faellt beim Kuerzel auf die URL zurueck, wenn sie unbekannt ist', () => {
    const g = attributionsGlieder(nachweis({ license: 'https://example.org/lizenz' }));
    expect(g?.[0]).toEqual({
      art: 'lizenz',
      text: 'https://example.org/lizenz',
      href: 'https://example.org/lizenz'
    });
  });

  it('liefert null ohne Lizenz — dann gibt es nichts zu beschriften', () => {
    expect(attributionsGlieder(nachweis({ license: '' }))).toBe(null);
    expect(attributionsGlieder(null)).toBe(null);
  });

  it('benutzt den Alt-Text nicht als Titel — alt gehoert ans Bild, nicht in die Zeile', () => {
    const g = attributionsGlieder(nachweis({ alt: 'Rhabarberpflanze im Beet' }));
    expect(g?.some((x) => x.text === 'Rhabarberpflanze im Beet')).toBe(false);
  });
});
