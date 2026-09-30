/**
 * Profilbilder der verwiesenen Personen holen (ADR-0039): Der Spiegel lädt sie einmal je
 * Lauf und legt sie auf die Platte; der Leser bekommt sie vom Hub, nie vom
 * Fremdhost. Hier steht nur der Abruf mit seinen Grenzen — wo die Datei
 * liegt, entscheidet der Spiegel.
 */
import { createHash } from 'node:crypto';

/** Größer wird kein Porträt gehalten — ein Banner in voller Auflösung ist keins. */
export const HOECHSTGROESSE = 3 * 1024 * 1024;
const ZEITSCHRANKE_MS = 10000;

/**
 * Dateiendung je Bildtyp. SVG fehlt bewusst: es kann Skript tragen und wäre
 * unter unserer Adresse ausgeliefert.
 * @type {Record<string, string>}
 */
export const ENDUNG_JE_TYP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif'
};

/** @typedef {{ bytes: Uint8Array, typ: string, hash: string }} Profilbilddaten */

/**
 * Holt ein Profilbild. Liefert null, wenn die Adresse nicht https ist, der
 * Server nicht antwortet, kein Bild liefert oder das Bild zu groß ist —
 * alles Betriebszustände, keine Programmfehler. Der Hash ist der SHA-256
 * der Bytes; er wird zum ETag.
 *
 * @param {string} url
 * @param {{ holen?: typeof fetch }} [optionen]  nur zum Prüfen austauschbar
 * @returns {Promise<Profilbilddaten|null>}
 */
export async function profilbildHolen(url, { holen = fetch } = {}) {
  if (!/^https:\/\//i.test(url)) return null;
  try {
    const antwort = await holen(url, { signal: AbortSignal.timeout(ZEITSCHRANKE_MS), redirect: 'follow' });
    if (!antwort.ok) return null;
    const typ = (antwort.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!ENDUNG_JE_TYP[typ]) return null;
    const laenge = Number(antwort.headers.get('content-length') ?? '0');
    if (laenge > HOECHSTGROESSE) return null;
    const bytes = new Uint8Array(await antwort.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > HOECHSTGROESSE) return null;
    return { bytes, typ, hash: createHash('sha256').update(bytes).digest('hex') };
  } catch {
    return null;
  }
}
