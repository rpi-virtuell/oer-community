/**
 * @typedef {object} Konfig
 * @property {string} autor
 * @property {string|null} hTag
 * @property {string[]} relays
 * @property {string} blossomUrl
 * @property {string[]} abgeloesteHosts       Bild-Hosts, die der Hub ersetzt (ADR-0030)
 * @property {string} spiegelPfad             JSON-Datei des Spiegels (ADR-0028)
 * @property {number} spiegelIntervallS       Abstand zwischen zwei Läufen
 * @property {number} spiegelStartwartezeitS  wie lange der Start auf den ersten Lauf wartet
 * @property {string} startseiteD             Kennung (d) der Startseite; Konvention mit Standard (ADR-0027)
 * @property {string} navigationD             Kennung (d) der Navigation; Konvention mit Standard (ADR-0027)
 * @property {string} fusszeileD              Kennung (d) der Fußzeile; Konvention mit Standard (ADR-0027)
 * @property {string|null} community          Community, deren Termine der Hub zeigt (ADR-0034); null = kein Kalender
 * @property {string} edufeedUrl              Wohin „Im Kalender öffnen" führt (ADR-0034)
 */

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Positive Ganzzahl aus der Umgebung, mit Standard. Ein gesetzter, aber
 * unbrauchbarer Wert bricht ab — stiller Rückfall auf den Standard würde
 * eine Fehlkonfiguration verstecken.
 * @param {string|undefined} roh @param {number} standard @param {string} name
 */
function positiveGanzzahl(roh, standard, name) {
  const text = (roh ?? '').trim();
  if (text === '') return standard;
  const wert = Number(text);
  if (!Number.isInteger(wert) || wert <= 0) {
    throw new Error(`${name} muss eine positive Ganzzahl sein, ist aber "${text}".`);
  }
  return wert;
}

/**
 * Kennung mit Standard: getrimmt; leer oder nicht gesetzt heißt Standard.
 * @param {string|undefined} roh @param {string} standard
 */
function kennung(roh, standard) {
  return (roh ?? '').trim() || standard;
}

/**
 * Liest die Konfiguration und bricht bei fehlendem Pflichtwert ab.
 * Lieber hier abbrechen als später leere Seiten liefern (CLAUDE.md).
 *
 * @param {Record<string, string|undefined>} quelle
 * @returns {Konfig}
 */
export function konfigLesen(quelle) {
  const autor = (quelle.QUELLE_AUTOR ?? '').trim();
  if (!HEX64.test(autor)) {
    throw new Error(
      'QUELLE_AUTOR fehlt oder ist kein 64-stelliger Hex-Schlüssel. ' +
        'In .env eintragen — siehe .env.example.'
    );
  }

  const relays = (quelle.RELAYS ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (relays.length === 0) {
    throw new Error(
      'RELAYS fehlt. Mindestens ein Relay angeben, komma-getrennt — ' +
        'z. B. wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/'
    );
  }
  const falsch = relays.filter((r) => !r.startsWith('wss://'));
  if (falsch.length > 0) {
    throw new Error(`RELAYS: keine wss-Adresse: ${falsch.join(', ')}`);
  }

  const blossomUrl = (quelle.BLOSSOM_URL ?? '').trim();
  if (!blossomUrl.startsWith('https://')) {
    throw new Error(
      'BLOSSOM_URL fehlt oder ist nicht https — z. B. https://blossom.edufeed.org/'
    );
  }

  // ADR-0030: Standard ist die Domain, die der Hub ablöst. Ein leerer Wert
  // schaltet die Regel bewusst ab — leer ist nicht "nicht gesetzt".
  const abgeloesteHosts =
    quelle.ABGELOESTE_HOSTS === undefined
      ? ['oer.community']
      : quelle.ABGELOESTE_HOSTS.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

  const spiegelPfad = (quelle.SPIEGEL_PFAD ?? '').trim() || 'daten/spiegel.json';
  const spiegelIntervallS = positiveGanzzahl(quelle.SPIEGEL_INTERVALL_S, 600, 'SPIEGEL_INTERVALL_S');
  const spiegelStartwartezeitS = positiveGanzzahl(
    quelle.SPIEGEL_STARTWARTEZEIT_S, 20, 'SPIEGEL_STARTWARTEZEIT_S'
  );

  // ADR-0034: Standard ist die Community rpi-virtuell. Ein leerer Wert
  // schaltet den Kalender bewusst ab — leer ist nicht "nicht gesetzt".
  const rohCommunity = quelle.COMMUNITY_PUBKEY === undefined
    ? 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2'
    : quelle.COMMUNITY_PUBKEY.trim().toLowerCase();
  if (rohCommunity !== '' && !HEX64.test(rohCommunity)) {
    throw new Error('COMMUNITY_PUBKEY muss leer oder ein 64-stelliger Hex-Schlüssel sein.');
  }
  const community = rohCommunity === '' ? null : rohCommunity;
  const edufeedUrl = ((quelle.EDUFEED_URL ?? '').trim() || 'https://dev.edufeed.org').replace(/\/+$/, '');
  if (!edufeedUrl.startsWith('https://')) throw new Error('EDUFEED_URL muss mit https:// beginnen.');

  const rohHTag = (quelle.QUELLE_H_TAG ?? '').trim();
  return {
    community, edufeedUrl,
    autor, hTag: rohHTag === '' ? null : rohHTag, relays, blossomUrl,
    abgeloesteHosts, spiegelPfad, spiegelIntervallS, spiegelStartwartezeitS,
    startseiteD: kennung(quelle.STARTSEITE_D, 'startseite'),
    navigationD: kennung(quelle.NAVIGATION_D, 'navigation'),
    fusszeileD: kennung(quelle.FUSSZEILE_D, 'fusszeile')
  };
}
