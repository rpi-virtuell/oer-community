import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { artikelAusEvent } from './artikel.js';

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
