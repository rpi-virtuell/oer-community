/**
 * Der Diagnosebefund für die Entwickleransicht.
 *
 * **Warum es diese Datei gibt:** Der Lizenznachweis steht nicht im Artikel.
 * Der `kind:30023` trägt nur einen Hash im `x`-Tag — die Behauptung, es gebe
 * irgendwo einen Nachweis. Der `kind:1063` ist ein eigenes, eigenständig
 * signiertes Event mit eigenem Lebenszyklus, das auf einem anderen Relay
 * liegen kann und meist auch liegt (ADR-0013). Bleibt ein Bild aus, ist ohne
 * die Rohdaten beider Events nicht entscheidbar, woran es lag.
 *
 * Diese Datei rechnet nur — kein Relay, kein `fetch`. Alles, was sie braucht,
 * bekommt sie übergeben. Dadurch ist sie ohne Netz vollständig prüfbar.
 *
 * **Die Prüfkette wird hier nicht neu implementiert.** Sie kommt aus
 * `lizenzPruefen`; dessen `grund` sagt, welcher Schritt kippte — alle davor
 * sind bestanden, alle danach ungeprüft. Zwei Implementierungen derselben
 * Regel würden auseinanderlaufen, und die Diagnose würde dann etwas anderes
 * behaupten als die Anzeige.
 */

import { getEventHash, verifyEvent } from 'nostr-tools/pure';

import { ABFRAGEGRUND_TEXT } from '../services/relay.js';
import { GRUND_TEXT, lizenzPruefen } from './lizenz.js';

/**
 * @typedef {import('../services/relay.js').Event} Event
 * @typedef {import('../services/relay.js').Abfragegrund} Abfragegrund
 * @typedef {import('./lizenz.js').Nachweis} Nachweis
 * @typedef {import('./lizenz.js').Grund} Grund
 */

/**
 * Was ein Loader über seine Abfrage berichtet.
 *
 * @typedef {object} Abfrage
 * @property {string[]} gefragteRelays
 * @property {string[]} fehler
 * @property {string[]} [ohneTreffer]
 * @property {Record<string, string[]>} quellen
 * @property {Abfragegrund} grund
 */

/**
 * @typedef {object} Herkunft
 * @property {string[]} gefragt
 * @property {string[]} geliefertVon      Relays, die dieses Event hatten
 * @property {string[]} ohneTreffer       antworteten, hatten es nicht
 * @property {string[]} nichtErreichbar
 * @property {Abfragegrund} grund
 * @property {string|null} grundText
 * @property {boolean} [anderesRelayAlsArtikel]
 * @property {string[]} [artikelRelaysOhneNachweis]  hatten den Artikel, nicht den Nachweis
 */

/** @typedef {'gueltig'|'ungueltig'|null} Signaturbefund */

/**
 * Ein Schritt der Kette. `ok: null` heißt: nicht geprüft, weil ein früherer
 * Schritt abbrach — nicht dasselbe wie „gescheitert".
 *
 * @typedef {object} Schritt
 * @property {number} nr
 * @property {string} frage
 * @property {boolean|null} ok
 * @property {string|null} wert
 */

/**
 * Die fünf Schritte aus ADR-0013, erweitert durch ADR-0030, in ihrer Reihenfolge.
 * Jeder mit dem `grund`, den `lizenzPruefen` meldet, wenn genau er scheitert.
 *
 * Schritt 1 hat drei Gründe: absolut adressiert, nicht relativ, und nicht von
 * einem Host, den der Hub ablöst. Schritt 4 hat zwei Gründe: `pflichtfeld-fehlt`
 * deckt sowohl den unvollständigen Nachweis (in `nachweisAusEvents` verworfen)
 * als auch den Nachweis zu einem anderen Bild ab.
 *
 * @type {Array<{ nr: number, frage: string, gruende: Grund[] }>}
 */
const KETTE = [
  { nr: 1, frage: 'Ist ein Bild angegeben, absolut adressiert und nicht von einem abgelösten Host?', gruende: ['kein-bild', 'relativ', 'abgeloester-host'] },
  { nr: 2, frage: 'Trägt der Artikel ein x-Tag mit dem Hash?', gruende: ['kein-x-tag'] },
  { nr: 3, frage: 'Wurde auf einem Relay ein kind:1063 gefunden?', gruende: ['kein-nachweis'] },
  { nr: 4, frage: 'Hat der Nachweis eine Lizenzangabe und gehört er zu diesem Bild?', gruende: ['pflichtfeld-fehlt'] },
  { nr: 5, frage: 'Stimmt der Hash des ausgelieferten Bildes?', gruende: ['hash-widerspruch'] }
];

/**
 * Ein Event als reines Datenobjekt, nur mit den Feldern aus NIP-01.
 *
 * **Nötig, weil Events vom Relay Symbol-Schlüssel tragen** (interne Marker
 * der Nostr-Bibliotheken). SvelteKit serialisiert alles, was `load`
 * zurückgibt, und bricht bei Symbolen ab — am laufenden System als HTTP 500
 * belegt. `JSON.stringify` verschluckt sie dagegen stumm, die JSON-Route
 * allein hätte den Fehler also nie gezeigt.
 *
 * @param {Event|null} event
 * @returns {Event|null}
 */
function reinesEvent(event) {
  if (!event) return null;
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: (event.tags ?? []).map((t) => [...t]),
    content: event.content,
    sig: event.sig
  };
}

/**
 * Der Hash aus einem etag, ohne Anführungszeichen und `W/`-Präfix.
 *
 * Dieselbe Normalisierung wie in `lizenzPruefen` — hier, um den Wert
 * anzuzeigen, dort, um ihn zu vergleichen.
 *
 * @param {string|undefined} etag
 * @returns {string|null}
 */
function hashAusEtag(etag) {
  if (!etag) return null;
  return etag.replace(/^W\//, '').replace(/"/g, '').trim();
}

/**
 * Prüft Signatur **und** Event-Hash.
 *
 * **`verifyEvent` allein genügt nicht.** Es prüft `sig` gegen `id` — nicht
 * gegen den Inhalt. Wer `content` oder `tags` verändert und `id` und `sig`
 * unangetastet lässt, kommt damit durch (hier am Referenzfall belegt:
 * `verifyEvent` sagt `true` für ein Event mit angefasstem `content`). Erst
 * der Vergleich mit `getEventHash` — der `id` als SHA-256 über die
 * NIP-01-Serialisierung — bindet die Signatur an den Inhalt.
 *
 * `verifyEvent` wirft bei unvollständigen Feldern; für die Diagnose ist das
 * kein Absturzgrund, sondern das Ergebnis „ungültig".
 *
 * @param {Event|null} event
 * @returns {Signaturbefund}
 */
function signaturPruefen(event) {
  if (!event) return null;
  try {
    const inhaltPasstZurId = getEventHash(event) === event.id;
    return inhaltPasstZurId && verifyEvent(event) ? 'gueltig' : 'ungueltig';
  } catch {
    return 'ungueltig';
  }
}

/**
 * Text zu einer Abfrage, die gar nicht gestellt wurde.
 *
 * Ohne `x`-Tag am Artikel wird kein Relay gefragt: kein Hash, keine Frage
 * (CLAUDE.md). Eine leere Relay-Liste ohne Erklärung liesse den Fehler bei
 * der Verbindung suchen statt bei der fehlenden Angabe.
 */
const NIE_GEFRAGT_TEXT =
  'Es wurde kein Relay gefragt: Ohne x-Tag am Artikel gibt es keinen Hash ' +
  'und damit nichts nachzuschlagen. Das ist eine fehlende Angabe, kein ' +
  'fehlender Nachweis.';

/**
 * @param {Abfrage} abfrage
 * @param {Event|null} event
 * @param {boolean} [nieGefragt]  true, wenn es mangels Hash keine Abfrage gab
 * @returns {Herkunft}
 */
function herkunftBauen(abfrage, event, nieGefragt = false) {
  const grund = abfrage.grund ?? null;
  return {
    gefragt: abfrage.gefragteRelays ?? [],
    geliefertVon: event ? (abfrage.quellen?.[event.id] ?? []) : [],
    ohneTreffer: abfrage.ohneTreffer ?? [],
    nichtErreichbar: abfrage.fehler ?? [],
    grund,
    grundText: grund
      ? ABFRAGEGRUND_TEXT[grund]
      : nieGefragt
        ? NIE_GEFRAGT_TEXT
        : null
  };
}

/**
 * Warum aus mehreren kind:1063 gerade dieser gewählt wurde.
 *
 * Nachvollziehbar zu machen, was `nachweisAusEvents` entscheidet: neuestes
 * `created_at`, bei Gleichstand kleinste `id` (ADR-0010).
 *
 * @param {Event[]} kandidaten
 * @param {Event|null} gewaehlt
 * @returns {string|null}
 */
function auswahlgrundNennen(kandidaten, gewaehlt) {
  if (!gewaehlt) return null;
  if (kandidaten.length === 1) return 'einziger Kandidat';

  const gleichAlt = kandidaten.filter((e) => e.created_at === gewaehlt.created_at);
  return gleichAlt.length > 1
    ? `created_at gleich, kleinste id von ${kandidaten.length}`
    : `neuestes created_at von ${kandidaten.length}`;
}

/**
 * @typedef {object} Befund
 * @property {{ event: Event|null, herkunft: Herkunft, signatur: Signaturbefund }} artikel
 * @property {{ event: Event|null, herkunft: Herkunft, signatur: Signaturbefund,
 *   kandidaten: number, auswahlgrund: string|null }} lizenz
 * @property {{ ok: boolean, grund: Grund|null, text: string|null,
 *   schritte: Schritt[] }} kette
 * @property {{ amArtikel: string|null, amNachweis: string|null,
 *   amBild: string|null }} hashes
 */

/**
 * Baut den Befund aus den Rohdaten beider Abfragen.
 *
 * @param {object} eingabe
 * @param {Event|null} eingabe.artikelEvent
 * @param {Abfrage} eingabe.artikelAbfrage
 * @param {string|null} eingabe.bildUrl
 * @param {string|null} eingabe.bildHash
 * @param {Event[]} eingabe.lizenzEvents      alle gefundenen kind:1063
 * @param {Abfrage} eingabe.lizenzAbfrage
 * @param {Nachweis|null} eingabe.nachweis    der gewählte, aus nachweisAusEvents
 * @param {string} [eingabe.etag]
 * @param {string[]} [eingabe.abgeloesteHosts]  Hosts, die dieser Hub ablöst (ADR-0030)
 * @returns {Befund}
 */
export function befundErstellen({
  artikelEvent,
  artikelAbfrage,
  bildUrl,
  bildHash,
  lizenzEvents,
  lizenzAbfrage,
  nachweis,
  etag,
  abgeloesteHosts = []
}) {
  const kandidaten = lizenzEvents ?? [];
  // Das Event zum gewählten Nachweis — nicht neu auswählen, sondern das
  // Ergebnis von nachweisAusEvents wiederfinden.
  const nachweisEvent = nachweis
    ? (kandidaten.find((e) => e.id === nachweis.id) ?? null)
    : null;

  const artikelHerkunft = herkunftBauen(artikelAbfrage, artikelEvent);
  // Kein Hash am Artikel heisst: Der Lookup fand nie statt.
  const lizenzHerkunft = herkunftBauen(lizenzAbfrage, nachweisEvent, !bildHash);

  // Die Aussage von ADR-0013, am Einzelfall belegt statt nur behauptet.
  //
  // **Nicht als disjunkte Mengen prüfen.** Am 03.09.2026 am laufenden System
  // beobachtet: Der Referenzartikel liegt auf beiden Relays, sein Nachweis
  // nur auf relay-rpi. Die Frage „liegt der Nachweis auf keinem der
  // Artikel-Relays" wäre dann falsch, obwohl die Trennung bestehen bleibt.
  // Entscheidend ist die andere Richtung: Gibt es ein Relay, das den Artikel
  // hat und den Nachweis nicht? Genau dort holt das Bild sich kein Recht.
  // Fand keine Abfrage statt, hat kein Relay "den Nachweis nicht" — es
  // wurde nie gefragt. Die Artikel-Relays hier zu nennen behauptete eine
  // Antwort, die es nicht gab.
  lizenzHerkunft.artikelRelaysOhneNachweis =
    lizenzHerkunft.gefragt.length === 0
      ? []
      : artikelHerkunft.geliefertVon.filter((r) => !lizenzHerkunft.geliefertVon.includes(r));
  lizenzHerkunft.anderesRelayAlsArtikel =
    lizenzHerkunft.geliefertVon.length > 0 &&
    lizenzHerkunft.artikelRelaysOhneNachweis.length > 0;

  const ergebnis = lizenzPruefen({ bildUrl, bildHash, nachweis, etag, abgeloesteHosts });
  const grund = ergebnis.ok ? null : ergebnis.grund;

  // Der gescheiterte Schritt ist der, dessen Gründe den gemeldeten enthalten.
  // Davor bestanden, danach ungeprüft.
  const gescheitertIndex = grund
    ? KETTE.findIndex((s) => s.gruende.includes(grund))
    : -1;

  const bildHashAusEtag = hashAusEtag(etag);

  /** @type {Record<number, string|null>} */
  const werte = {
    1: bildUrl,
    2: bildHash,
    3: nachweisEvent ? `kind:1063 ${nachweisEvent.id}` : null,
    // credit ist seit ADR-0022 optional — fehlt es, bleibt es weg, statt
    // als "null" in der Diagnose zu stehen.
    4: nachweis
      ? [nachweis.license, nachweis.credit, nachweis.ki ? `ai=${nachweis.ki}` : null]
          .filter(Boolean)
          .join(' · ')
      : null,
    5: bildHashAusEtag
  };

  const schritte = KETTE.map((s, i) => ({
    nr: s.nr,
    frage: s.frage,
    // Schritt 5 ohne etag: übersprungen, nicht bestanden — sonst behauptete
    // die Ansicht eine Prüfung, die nicht stattgefunden hat.
    ok:
      gescheitertIndex === i
        ? false
        : gescheitertIndex !== -1 && i > gescheitertIndex
          ? null
          : s.nr === 5 && !bildHashAusEtag
            ? null
            : true,
    wert: werte[s.nr] ?? null
  }));

  return {
    artikel: {
      event: reinesEvent(artikelEvent ?? null),
      herkunft: artikelHerkunft,
      signatur: signaturPruefen(artikelEvent ?? null)
    },
    lizenz: {
      event: reinesEvent(nachweisEvent),
      herkunft: lizenzHerkunft,
      signatur: signaturPruefen(nachweisEvent),
      kandidaten: kandidaten.length,
      auswahlgrund: auswahlgrundNennen(kandidaten, nachweisEvent)
    },
    kette: {
      ok: ergebnis.ok,
      grund,
      text: grund ? GRUND_TEXT[grund] : null,
      schritte
    },
    hashes: {
      amArtikel: bildHash ?? null,
      amNachweis: nachweis?.hash ?? null,
      amBild: bildHashAusEtag
    }
  };
}
