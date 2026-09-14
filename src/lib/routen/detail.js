/**
 * Gemeinsame Ladefunktion der Detailansichten /[d] und /en/[d] — hier, damit
 * die Route für Englisch keine Kopie ist. Wirft SvelteKit-Fehler und
 * -Weiterleitungen; die Datenschicht darunter (beitragLaden) tut das nicht.
 */
import { error, redirect } from '@sveltejs/kit';
import { beitragLaden } from '../loaders/beitrag.js';
import { artikelAusSpiegel } from '../loaders/artikel.js';
import { adressePruefen } from '../models/adresse.js';
import { beitragsPfad } from '../models/artikel.js';
import { befundErstellen } from '../models/entwickleransicht.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { naddrDekodieren } from '../naddr.js';

/**
 * Ist das Segment ein naddr der eigenen Quelle, kommt der Zielpfad zurück
 * (ADR-0029). Fremde naddr: null → die Route behandelt es als unbekanntes d
 * und antwortet 404, ohne zu verraten, was interessant wäre (ADR-0016).
 * @param {string} segment @param {import('../konfig.js').Konfig} konfig @param {import('../services/spiegel.js').Inhalt} inhalt
 */
export function naddrWeiterleitung(segment, konfig, inhalt) {
  if (!segment.startsWith('naddr1')) return null;
  let adresse;
  try {
    adresse = naddrDekodieren(segment);
  } catch {
    return null;
  }
  if (!adressePruefen(adresse, konfig).ok) return null;
  const { artikel } = artikelAusSpiegel(inhalt, { d: adresse.d });
  return beitragsPfad({ d: adresse.d, sprache: artikel?.sprache ?? 'de' });
}

/**
 * @param {object} e
 * @param {string} e.d
 * @param {'de'|'en'} e.sprache
 * @param {import('../konfig.js').Konfig} e.konfig
 * @param {import('../services/spiegel.js').Inhalt} e.inhalt
 * @param {string} [e.anhang]  Suffix des Weiterleitungsziels, für /[d]/json
 * @param {boolean} [e.istStartseite]  Der Aufruf kommt von / selbst — dann
 *   entfällt die Weiterleitung der Startseite dorthin (sonst eine Schleife).
 */
export async function detailLaden({ d, sprache, konfig, inhalt, anhang = '', istStartseite = false }) {
  const ziel = naddrWeiterleitung(d, konfig, inhalt);
  if (ziel) redirect(301, ziel + anhang);

  // Die Startseite wohnt unter / — zwei Adressen für denselben Text wären
  // eine zu viel (bis Stufe 4 die Seitenroute bringt). Die JSON-Route bleibt
  // erreichbar: sie ist die Entwickleransicht, keine zweite Leseadresse.
  if (d === konfig.startseiteD && !anhang && !istStartseite) redirect(301, '/');

  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);

  const adresse = { kind: 30023, author: konfig.autor, d, relays: [] };
  const ergebnis = await beitragLaden({ adresse, konfig, inhalt });
  if (!ergebnis.ok) error(ergebnis.status, ergebnis.meldung);

  const { artikel } = ergebnis;
  // In der falschen Sprache aufgerufen: dorthin, wo der Beitrag wohnt — für
  // /[d]/json auf die dortige JSON-Adresse.
  if (artikel.sprache !== sprache) redirect(301, beitragsPfad(artikel) + anhang);

  const befund = befundErstellen({
    artikelEvent: ergebnis.artikelEvent, artikelAbfrage: ergebnis.artikelAbfrage,
    bildUrl: artikel.bildUrl, bildHash: artikel.bildHash, lizenzEvents: ergebnis.lizenzEvents,
    lizenzAbfrage: ergebnis.lizenzAbfrage, nachweis: ergebnis.nachweis, etag: ergebnis.etag,
    abgeloesteHosts: konfig.abgeloesteHosts
  });

  // Zwei Hälften: `seite` ist serialisierbar und geht an die Page-Route;
  // `ergebnis` trägt die rohen Events (mit Symbol-Schlüsseln, siehe
  // `reinesEvent`) und ist nur für die JSON-Route.
  return {
    seite: {
      artikel: {
        titel: artikel.titel, zusammenfassung: artikel.zusammenfassung,
        veroeffentlicht: artikel.veroeffentlicht.toISOString(), themen: artikel.themen,
        bildUrl: artikel.bildUrl, sprache: artikel.sprache, istSeite: artikel.istSeite
      },
      lizenz: ergebnis.lizenz, teile: ergebnis.teile, fliesstext: ergebnis.fliesstext,
      entfernteBilder: ergebnis.entfernteBilder, befund,
      pfad: beitragsPfad(artikel),
      stand: inhalt.stand ? { zeitpunkt: inhalt.stand.zeitpunkt, nichtErreichbar: inhalt.stand.nichtErreichbar } : null
    },
    ergebnis
  };
}
