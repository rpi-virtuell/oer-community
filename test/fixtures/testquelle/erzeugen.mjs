/**
 * Erzeugt die Fixtures der Testquelle: signierte Events eines Wegwerf-Schlüssels,
 * mit dem der Hub Seiten, Listen und Profil prüfen kann, bevor der FOERBICO-Key
 * sie publiziert (Spec 14.09., „Tests"). Aufruf: node test/fixtures/testquelle/erzeugen.mjs
 * Der geheime Schlüssel steht nur hier und ist wertlos — er signiert nichts Echtes.
 */
import { writeFileSync } from 'node:fs';
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';

const GEHEIM = Uint8Array.from(Buffer.from('7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26', 'hex'));
const PUBKEY = getPublicKey(GEHEIM);
const FREMD = 'b'.repeat(64);
const ZEIT = 1789400000;
const SEITE = [['L', 'foerbico/typ'], ['l', 'seite', 'foerbico/typ']];
const a = (/** @type {string} */ d, pk = PUBKEY) => ['a', `30023:${pk}:${d}`];

/** @param {number} kind @param {string[][]} tags @param {string} content */
const ev = (kind, tags, content) => finalizeEvent({ kind, created_at: ZEIT, tags, content }, GEHEIM);

const events = [
  ev(0, [], JSON.stringify({ name: 'Testquelle', display_name: 'TQ', picture: 'https://blossom.example/logo.png', about: 'CC BY **Testquelle** — [Impressum](https://example.org/impressum)', website: 'https://test.example' })),
  ev(30023, [['d', 'startseite'], ['title', 'Willkommen'], ['published_at', String(ZEIT)], ['inLanguage', 'de'], ...SEITE], 'Willkommen bei der **Testquelle**.\n\nZweiter Absatz.'),
  ev(30023, [['d', 'impressum'], ['title', 'Impressum'], ['published_at', String(ZEIT)], ['inLanguage', 'de'], ...SEITE], 'Verantwortlich: Testquelle.'),
  ev(30023, [['d', 'unser-team'], ['title', 'Unser Team'], ['published_at', String(ZEIT)], ['inLanguage', 'de'], ...SEITE], 'Drei Menschen.'),
  ev(30023, [['d', 'our-team'], ['title', 'Our team'], ['published_at', String(ZEIT)], ['inLanguage', 'en'], ...SEITE], 'Three people.'),
  ev(30023, [['d', 'artikel-a'], ['title', 'Artikel A'], ['summary', 'Anriss A', 'de'], ['published_at', '1789300000'], ['inLanguage', 'de'], ['t', 'Testthema']], 'Text von Artikel A.'),
  ev(30004, [['d', 'navigation'], ['title', 'Hauptmenü'], a('unser-team'), a('oer-und-oep'), a('startseite'), a('artikel-a'), a('x', FREMD)], ''),
  ev(30004, [['d', 'fusszeile'], ['title', 'Fußzeile'], a('impressum'), a('datenschutz')], '')
];

writeFileSync(new URL('./events.json', import.meta.url), JSON.stringify(events, null, 2) + '\n');
writeFileSync(new URL('./schluessel.json', import.meta.url), JSON.stringify({ pubkey: PUBKEY }, null, 2) + '\n');
console.log(`${events.length} Events für ${PUBKEY.slice(0, 12)}… geschrieben`);
