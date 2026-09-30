import { describe, expect, it } from 'vitest';
import { leererInhalt } from '../services/spiegel.js';
import { profilbildAntwort } from './profilbild.js';

const PUBKEY = 'a1'.repeat(32);
const BILD = { url: 'https://i.example/a.png', datei: `${PUBKEY}.png`, typ: 'image/png', hash: 'abc123' };
const inhalt = { ...leererInhalt(), profilbilder: { [PUBKEY]: BILD } };
const bildpfad = (/** @type {string} */ d) => `x/${d}`;
const lesen = async (/** @type {string} */ pfad) => {
  if (pfad !== `x/${PUBKEY}.png`) throw new Error('ENOENT');
  return new Uint8Array([1, 2, 3]);
};

describe('profilbildAntwort (ADR-0039)', () => {
  it('liefert das gehaltene Bild mit Typ, ETag und langem Cache', async () => {
    const a = await profilbildAntwort({ pubkey: PUBKEY, ifNoneMatch: null, inhalt, bildpfad, lesen });
    expect(a.status).toBe(200);
    expect(a.headers.get('content-type')).toBe('image/png');
    expect(a.headers.get('etag')).toBe('"abc123"');
    expect(a.headers.get('cache-control')).toContain('max-age=86400');
    expect(new Uint8Array(await a.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('antwortet 304 auf den passenden ETag', async () => {
    const a = await profilbildAntwort({ pubkey: PUBKEY, ifNoneMatch: '"abc123"', inhalt, bildpfad, lesen });
    expect(a.status).toBe(304);
  });

  it('404 für einen unbekannten Pubkey, kein Durchreichen zum Fremdhost', async () => {
    const a = await profilbildAntwort({ pubkey: 'b2'.repeat(32), ifNoneMatch: null, inhalt, bildpfad, lesen });
    expect(a.status).toBe(404);
    expect(await a.text()).toMatch(/kein Profilbild/);
  });

  it('404, wenn die Adresse kein Pubkey ist — auch in Großschreibung wird der Schlüssel erkannt', async () => {
    expect((await profilbildAntwort({ pubkey: 'json', ifNoneMatch: null, inhalt, bildpfad, lesen })).status).toBe(404);
    expect((await profilbildAntwort({ pubkey: PUBKEY.toUpperCase(), ifNoneMatch: null, inhalt, bildpfad, lesen })).status).toBe(200);
  });

  it('404, wenn die Datei auf der Platte fehlt', async () => {
    const a = await profilbildAntwort({ pubkey: PUBKEY, ifNoneMatch: null, inhalt, bildpfad: () => 'x/weg.png', lesen });
    expect(a.status).toBe(404);
    expect(await a.text()).toMatch(/nächste Lauf/);
  });
});
