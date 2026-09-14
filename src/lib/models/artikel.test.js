import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { artikelAusEvent, beitragsPfad, dNormalisieren } from './artikel.js';

const referenz = JSON.parse(
  readFileSync(
    new URL(
      '../../../test/fixtures/artikel-30023-die-kraft-der-gemeinschaft.json',
      import.meta.url
    ),
    'utf8'
  )
)[0];

/** @param {string[][]} tags */
function event(tags, content = 'Text') {
  return {
    id: 'a'.repeat(64),
    pubkey: 'b'.repeat(64),
    created_at: 1000,
    kind: 30023,
    tags,
    content,
    sig: 'c'.repeat(128)
  };
}

describe('artikelAusEvent', () => {
  it('liest den Referenzfall', () => {
    const a = artikelAusEvent(referenz);
    expect(a.titel).toContain('Die Kraft der Gemeinschaft');
    expect(a.d).toBe('die-kraft-der-gemeinschaft');
    expect(a.bildUrl).toBe(
      'https://blossom.edufeed.org/a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b.jpeg'
    );
    expect(a.bildHash).toBe(
      'a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b'
    );
    expect(a.zusammenfassung).toContain('FOERBICO');
  });

  it('nimmt published_at, nicht created_at', () => {
    const a = artikelAusEvent(
      event([
        ['d', 'x'],
        ['title', 'T'],
        ['published_at', '1788433547']
      ])
    );
    expect(a.veroeffentlicht.getTime()).toBe(1788433547 * 1000);
  });

  it('faellt auf created_at zurueck, wenn published_at fehlt', () => {
    const a = artikelAusEvent(event([['d', 'x'], ['title', 'T']]));
    expect(a.veroeffentlicht.getTime()).toBe(1000 * 1000);
  });

  it('liefert null, wenn kein Bild gesetzt ist', () => {
    const a = artikelAusEvent(event([['d', 'x'], ['title', 'T']]));
    expect(a.bildUrl).toBe(null);
    expect(a.bildHash).toBe(null);
  });

  it('sammelt alle t-Tags als Themen', () => {
    const a = artikelAusEvent(
      event([['d', 'x'], ['title', 'T'], ['t', 'OER'], ['t', 'Community']])
    );
    expect(a.themen).toEqual(['OER', 'Community']);
  });

  it('nimmt d als Titel, wenn title fehlt', () => {
    expect(artikelAusEvent(event([['d', 'ohne-titel']])).titel).toBe('ohne-titel');
  });
});

describe('Sprache, Seite und Pfad (Spec 14.09.)', () => {
  const basis = { id: 'x', pubkey: 'p', created_at: 1, kind: 30023, content: '', sig: 's' };

  it('liest inLanguage, Standard de, en auch als en-US', () => {
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a']] }).sprache).toBe('de');
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a'], ['inLanguage', 'en']] }).sprache).toBe('en');
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a'], ['inLanguage', 'en-US']] }).sprache).toBe('en');
    // mdparser schrieb bei 19 Artikeln "d" — das ist deutsch, kein Fehler hier.
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a'], ['inLanguage', 'd']] }).sprache).toBe('de');
  });

  it('erkennt eine Seite am Selbst-Label foerbico/typ = seite', () => {
    const seite = artikelAusEvent({
      ...basis, tags: [['d', 'impressum'], ['L', 'foerbico/typ'], ['l', 'seite', 'foerbico/typ']]
    });
    expect(seite.istSeite).toBe(true);
    const fremd = artikelAusEvent({ ...basis, tags: [['d', 'x'], ['l', 'seite', 'anderer/raum']] });
    expect(fremd.istSeite).toBe(false);
  });

  it('baut den Pfad aus Sprache und d', () => {
    expect(beitragsPfad({ d: 'canva', sprache: 'de' })).toBe('/canva');
    expect(beitragsPfad({ d: 'our-team', sprache: 'en' })).toBe('/en/our-team');
    expect(beitragsPfad({ d: 'ä ö', sprache: 'de' })).toBe('/%C3%A4%20%C3%B6');
  });

  // Drei Live-Artikel tragen das Prozentzeichen literal im d-Tag
  // (oer-visuelle-qualit%C3%A4t). SvelteKit dekodiert Params, also muss der
  // Pfad die dekodierte Form einmal kodieren — sonst 404 unter der echten
  // oer.community-Adresse (ADR-0029).
  it('kodiert ein bereits prozent-kodiertes d nicht ein zweites Mal', () => {
    expect(beitragsPfad({ d: 'oer-visuelle-qualit%C3%A4t', sprache: 'de' })).toBe(
      '/oer-visuelle-qualit%C3%A4t'
    );
  });
});

describe('dNormalisieren', () => {
  it('dekodiert ein prozent-kodiertes d', () => {
    expect(dNormalisieren('oer-visuelle-qualit%C3%A4t')).toBe('oer-visuelle-qualität');
  });

  it('lässt ein bereits dekodiertes d unangetastet', () => {
    expect(dNormalisieren('oer-visuelle-qualität')).toBe('oer-visuelle-qualität');
    expect(dNormalisieren('die-kraft-der-gemeinschaft')).toBe('die-kraft-der-gemeinschaft');
  });

  it('gibt eine kaputte Kodierung roh zurück, statt zu werfen', () => {
    expect(dNormalisieren('100%-frei')).toBe('100%-frei');
  });
});
