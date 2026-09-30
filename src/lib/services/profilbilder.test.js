import { describe, expect, it } from 'vitest';
import { HOECHSTGROESSE, profilbildHolen } from './profilbilder.js';

/** @param {{ status?: number, typ?: string, bytes?: Uint8Array, laenge?: string }} [a] */
function antwort({ status = 200, typ = 'image/png', bytes = new Uint8Array([1, 2, 3]), laenge } = {}) {
  /** @type {any} */
  const holen = async () => ({
    ok: status >= 200 && status < 300,
    headers: { get: (/** @type {string} */ n) => (n === 'content-type' ? typ : n === 'content-length' ? (laenge ?? String(bytes.byteLength)) : null) },
    arrayBuffer: async () => bytes.buffer
  });
  return holen;
}

describe('profilbildHolen (ADR-0039)', () => {
  it('liefert Bytes, Typ und SHA-256 für ein Bild', async () => {
    const b = await profilbildHolen('https://i.example/p.png', { holen: antwort() });
    expect(b?.typ).toBe('image/png');
    expect(b?.bytes).toEqual(new Uint8Array([1, 2, 3]));
    expect(b?.hash).toBe('039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81');
  });
  it('nur https; kein Bild, SVG, Fehlerstatus oder zu groß ergibt null', async () => {
    expect(await profilbildHolen('http://i.example/p.png', { holen: antwort() })).toBeNull();
    expect(await profilbildHolen('https://i.example/p', { holen: antwort({ typ: 'text/html; charset=utf-8' }) })).toBeNull();
    expect(await profilbildHolen('https://i.example/p.svg', { holen: antwort({ typ: 'image/svg+xml' }) })).toBeNull();
    expect(await profilbildHolen('https://i.example/p.png', { holen: antwort({ status: 404 }) })).toBeNull();
    expect(await profilbildHolen('https://i.example/p.png', { holen: antwort({ laenge: String(HOECHSTGROESSE + 1) }) })).toBeNull();
    expect(await profilbildHolen('https://i.example/p.png', { holen: antwort({ bytes: new Uint8Array(0) }) })).toBeNull();
  });
  it('ein Netzfehler ist ein Betriebszustand: null, kein Wurf', async () => {
    /** @type {any} */
    const kaputt = async () => { throw new Error('offline'); };
    expect(await profilbildHolen('https://i.example/p.png', { holen: kaputt })).toBeNull();
  });
  it('nimmt den Typ ohne Parameter, klein geschrieben', async () => {
    const b = await profilbildHolen('https://i.example/p.jpg', { holen: antwort({ typ: 'Image/JPEG; charset=binary' }) });
    expect(b?.typ).toBe('image/jpeg');
  });
});
