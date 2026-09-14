/**
 * Entwickleransicht: die Rohdaten hinter einem Beitrag als JSON.
 *
 * **Warum es diese Route gibt:** Der Lizenznachweis steht nicht im Artikel.
 * Der `kind:30023` trägt nur den Hash im `x`-Tag; der `kind:1063` ist ein
 * eigenes Event auf einem anderen Relay (ADR-0013). Bleibt ein Bild aus,
 * zeigt die Artikelseite nur das Ergebnis — welcher der fünf Prüfschritte
 * kippte und warum, steht hier.
 *
 * Sie läuft durch **dieselben Wächter** wie die Artikelseite: Adressprüfung
 * gegen die eigene Quelle, Relay-Hinweise aus dem `naddr` ignoriert
 * (ADR-0016). Beides liegt in `beitragLaden`, damit diese Route kein Umweg
 * daran vorbei ist.
 *
 * Roh-HTML aus dem Event geht hier ungesäubert hinaus — als JSON, nie als
 * HTML. `content-type: application/json` und `X-Content-Type-Options:
 * nosniff` halten das fest; ohne nosniff könnte ein Browser den Inhalt als
 * HTML deuten und das Event würde zum Skriptträger.
 */

import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { naddrDekodieren } from '$lib/naddr.js';
import { beitragLaden } from '$lib/loaders/beitrag.js';
import { befundErstellen } from '$lib/models/entwickleransicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  const konfig = konfigLesen(env);

  let adresse;
  try {
    adresse = naddrDekodieren(params.naddr);
  } catch (ursache) {
    error(400, ursache instanceof Error ? ursache.message : 'Unlesbare Adresse.');
  }

  const ergebnis = await beitragLaden({ adresse, konfig, inhalt: spiegelHolen().lesen() });

  if (!ergebnis.ok) {
    error(ergebnis.status, ergebnis.meldung);
  }

  const befund = befundErstellen({
    artikelEvent: ergebnis.artikelEvent,
    artikelAbfrage: ergebnis.artikelAbfrage,
    bildUrl: ergebnis.artikel.bildUrl,
    bildHash: ergebnis.artikel.bildHash,
    lizenzEvents: ergebnis.lizenzEvents,
    lizenzAbfrage: ergebnis.lizenzAbfrage,
    nachweis: ergebnis.nachweis,
    etag: ergebnis.etag
  });

  return json(
    {
      hinweis:
        'Entwickleransicht. Der Lizenznachweis (kind:1063) ist ein eigenes ' +
        'Event und steht nicht im Artikel (kind:30023) — siehe ADR-0013.',
      adresse: {
        naddr: params.naddr,
        kind: adresse.kind,
        author: adresse.author,
        d: adresse.d,
        // Was im naddr stand und bewusst ignoriert wurde (ADR-0016).
        relaysImNaddrIgnoriert: adresse.relays ?? []
      },
      artikel: befund.artikel,
      lizenz: befund.lizenz,
      kette: befund.kette,
      hashes: befund.hashes,
      // Was die Anzeige aus dem Befund macht.
      anzeige: {
        bildWirdAusgeliefert: ergebnis.lizenz.ok,
        entfernteBilderImText: ergebnis.entfernteBilder,
        // Bilder im Text mit Hash-URL, je Hash das Ergebnis der Kette (ADR-0023).
        fliesstextbilder: ergebnis.fliesstext
      }
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
