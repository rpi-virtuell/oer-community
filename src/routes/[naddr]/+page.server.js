import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { naddrDekodieren } from '$lib/naddr.js';
import { beitragLaden } from '$lib/loaders/beitrag.js';
import { befundErstellen } from '$lib/models/entwickleransicht.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // Fehlt ein Pflichtwert, bricht es hier ab — nicht mit leerer Seite.
  const konfig = konfigLesen(env);

  let adresse;
  try {
    adresse = naddrDekodieren(params.naddr);
  } catch (ursache) {
    error(400, ursache instanceof Error ? ursache.message : 'Unlesbare Adresse.');
  }

  // Adressprüfung, Relay-Abfrage und Lizenzauflösung liegen im Loader —
  // dieselbe Vorarbeit nutzt die Entwickleransicht (ADR-0016).
  const ergebnis = await beitragLaden({ adresse, konfig });

  if (!ergebnis.ok) {
    error(ergebnis.status, ergebnis.meldung);
  }

  const { artikel, lizenz, teile, fliesstext, entfernteBilder } = ergebnis;

  // Der Befund wird immer mitgeliefert, nicht erst auf Knopfdruck: Der
  // Debug-Schalter liegt im Browser (localStorage), der Server weiss also
  // nicht, ob er gebraucht wird. Ihn nachzuladen brauchte eine zweite
  // Datenschicht im Browser — genau das, was CLAUDE.md ausschliesst.
  const befund = befundErstellen({
    artikelEvent: ergebnis.artikelEvent,
    artikelAbfrage: ergebnis.artikelAbfrage,
    bildUrl: artikel.bildUrl,
    bildHash: artikel.bildHash,
    lizenzEvents: ergebnis.lizenzEvents,
    lizenzAbfrage: ergebnis.lizenzAbfrage,
    nachweis: ergebnis.nachweis,
    etag: ergebnis.etag
  });

  return {
    artikel: {
      titel: artikel.titel,
      zusammenfassung: artikel.zusammenfassung,
      veroeffentlicht: artikel.veroeffentlicht.toISOString(),
      themen: artikel.themen,
      bildUrl: artikel.bildUrl
    },
    lizenz,
    teile,
    fliesstext,
    entfernteBilder,
    befund,
    // Für den Verweis auf die Entwickleransicht — der naddr, wie er in der
    // URL stand, nicht neu kodiert.
    naddr: params.naddr
  };
}
