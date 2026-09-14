/**
 * Entwickleransicht: die Rohdaten hinter einem Beitrag als JSON.
 *
 * **Warum es diese Route gibt:** Der Lizenznachweis steht nicht im Artikel.
 * Der `kind:30023` trägt nur den Hash im `x`-Tag; der `kind:1063` ist ein
 * eigenes Event auf einem anderen Relay (ADR-0013). Bleibt ein Bild aus,
 * zeigt die Artikelseite nur das Ergebnis — welcher der fünf Prüfschritte
 * kippte und warum, steht hier.
 *
 * Sie läuft durch **dieselbe Ladefunktion** wie die Artikelseite
 * (`routen/detail.js`), damit diese Route kein Umweg an den Wächtern aus
 * ADR-0016 vorbei ist.
 *
 * Roh-HTML aus dem Event geht hier ungesäubert hinaus — als JSON, nie als
 * HTML. `content-type: application/json` und `X-Content-Type-Options:
 * nosniff` halten das fest; ohne nosniff könnte ein Browser den Inhalt als
 * HTML deuten und das Event würde zum Skriptträger.
 *
 * Eine Funktion für /[d]/json und /en/[d]/json — die Routen selbst bleiben
 * dünn und unterscheiden sich nur in der Sprache.
 */

import { json } from '@sveltejs/kit';
import { detailLaden } from './detail.js';

/**
 * @param {object} e
 * @param {string} e.d
 * @param {'de'|'en'} e.sprache
 * @param {import('../konfig.js').Konfig} e.konfig
 * @param {import('../services/spiegel.js').Inhalt} e.inhalt
 */
export async function detailAlsJson({ d, sprache, konfig, inhalt }) {
  // Ein naddr führt hier auf die JSON-Adresse des Beitrags, nicht auf seine
  // Seite — wer die Rohdaten anfragt, will sie auch nach der Weiterleitung.
  const { seite, ergebnis } = await detailLaden({ d, sprache, konfig, inhalt, anhang: '/json' });

  return json(
    {
      hinweis:
        'Entwickleransicht. Der Lizenznachweis (kind:1063) ist ein eigenes ' +
        'Event und steht nicht im Artikel (kind:30023) — siehe ADR-0013.',
      adresse: { d, pfad: seite.pfad },
      artikel: seite.befund.artikel,
      lizenz: seite.befund.lizenz,
      kette: seite.befund.kette,
      hashes: seite.befund.hashes,
      // Was die Anzeige aus dem Befund macht.
      anzeige: {
        bildWirdAusgeliefert: ergebnis.lizenz.ok,
        entfernteBilderImText: ergebnis.entfernteBilder,
        // Bilder im Text mit Hash-URL, je Hash das Ergebnis der Kette (ADR-0023).
        fliesstextbilder: ergebnis.fliesstext
      },
      spiegel: inhalt.stand
    },
    {
      headers: {
        // Der Inhalt ist ungesäubertes Markdown aus dem Event — er darf nie
        // als HTML gedeutet werden.
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store'
      }
    }
  );
}
