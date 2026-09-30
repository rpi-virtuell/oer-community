/**
 * Ein gehaltenes Profilbild ausliefern (ADR-0039): Der Spiegel hat es geholt
 * und auf die Platte gelegt; hier bekommt der Leser es mit ETag aus dem
 * SHA-256 und langem Cache. Kein Leser spricht mit dem Fremdhost. Was der
 * Spiegel nicht hält, gibt es nicht: 404, kein Durchreichen.
 */
import { readFile } from 'node:fs/promises';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

const PUBKEY = /^[0-9a-f]{64}$/;

/** @param {string} text */
const nichtDa = (text) => new Response(text, { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

/**
 * @param {{
 *   pubkey: string,
 *   ifNoneMatch: string|null,
 *   inhalt: Inhalt,
 *   bildpfad: (datei: string) => string,
 *   lesen?: (pfad: string) => Promise<Uint8Array>
 * }} e
 * @returns {Promise<Response>}
 */
export async function profilbildAntwort({ pubkey, ifNoneMatch, inhalt, bildpfad, lesen = readFile }) {
  const schluessel = pubkey.toLowerCase();
  if (!PUBKEY.test(schluessel)) return nichtDa('Kein Profilbild: die Adresse ist kein Pubkey.');
  const bild = inhalt.profilbilder?.[schluessel];
  if (!bild) return nichtDa('Der Spiegel hält zu diesem Pubkey kein Profilbild.');

  const etag = `"${bild.hash}"`;
  const kopf = {
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    ETag: etag
  };
  if (ifNoneMatch === etag) return new Response(null, { status: 304, headers: kopf });

  let bytes;
  try {
    bytes = await lesen(bildpfad(bild.datei));
  } catch {
    return nichtDa('Die Bilddatei fehlt auf der Platte; der nächste Lauf des Spiegels holt sie nach.');
  }
  return new Response(/** @type {BodyInit} */ (bytes), {
    headers: { ...kopf, 'Content-Type': bild.typ, 'Content-Length': String(bytes.byteLength) }
  });
}
