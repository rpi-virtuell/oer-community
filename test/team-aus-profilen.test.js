/**
 * Teamseite aus den kind:0 der Personen (ADR-0039): Verweis im Markdown →
 * Profil im Spiegel → Karte in der Darstellung, die der Server ausliefert.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { npubEncode, nprofileEncode } from 'nostr-tools/nip19';

import Artikelseite from '../src/lib/komponenten/Detail.svelte';
import { inhaltAufbereiten } from '../src/lib/inhalt.js';
import { beitragLaden } from '../src/lib/loaders/beitrag.js';
import { personAusEvent, personenVerweise } from '../src/lib/models/profil.js';
import { leererInhalt, personenSammeln, spiegelErstellen } from '../src/lib/services/spiegel.js';

/** @param {string} datei */
const fixture = (datei) => JSON.parse(readFileSync(new URL(`./fixtures/${datei}`, import.meta.url), 'utf8'));

const PROFIL = fixture('profil-0-foerbico.json')[0];
const AUTOR = PROFIL.pubkey;
const JENS = 'f0a250fda57445e71fca119fdd6179ac3d915f043bb4594856e79a733145a00f';
const GINA = '1c5ff3caacd842c01dca8f378231b16617516d214da75c7aeabbe9e1efe9c0f6';
const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';

/** @param {string} pubkey @param {object} inhalt @param {number} [created_at] */
const kind0 = (pubkey, inhalt, created_at = 1790000000) => ({
  kind: 0, id: `${pubkey.slice(0, 8)}${created_at}`.padEnd(64, '0'), pubkey, created_at,
  content: JSON.stringify(inhalt), tags: [], sig: ''
});

const JENS_PROFIL = kind0(JENS, {
  name: 'jens', display_name: 'Dr. Jens Dechow',
  picture: 'https://blossom.edufeed.org/jens.jpg',
  about: 'Jens ist Direktor des Comenius-Institutes und verantwortet **FOERBICO**.',
  email: 'dechow@comenius.de', website: 'https://comenius.de/'
});

const TEAM_MD = [
  '## Comenius-Institut',
  '',
  'Das Comenius-Institut fördert Bildung.',
  '',
  `nostr:${npubEncode(JENS)}`,
  '',
  `nostr:${nprofileEncode({ pubkey: GINA, relays: ['wss://boese/'] })}`,
  '',
  `Im Satz bleibt nostr:${npubEncode(JENS)} Text.`
].join('\n');

const TEAMSEITE = {
  kind: 30023, id: 'e'.repeat(64), pubkey: AUTOR, created_at: 1790000000, sig: '',
  content: TEAM_MD,
  tags: [['d', 'unser-team'], ['title', 'Unser Team'], ['published_at', '1790000000'], ['l', 'seite', 'foerbico/typ']]
};

const KONFIG = {
  autor: AUTOR, hTag: null, relays: [RELAY, RPI],
  blossomUrl: 'https://blossom.edufeed.org/', abgeloesteHosts: ['oer.community'],
  spiegelPfad: 'x.json', spiegelIntervallS: 600, spiegelStartwartezeitS: 20,
  startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile',
  redaktionD: 'redaktion', community: null, edufeedUrl: 'https://dev.edufeed.org',
  profilRelays: [], profilbilderPfad: 'x'
};

describe('personenVerweise und personAusEvent', () => {
  it('findet npub und nprofile auf eigener Zeile, nicht im Satz, ohne Dubletten', () => {
    expect(personenVerweise(TEAM_MD)).toEqual([JENS, GINA]);
    expect(personenVerweise(`Text nostr:${npubEncode(JENS)} Text`)).toEqual([]);
    expect(personenVerweise('nostr:npub1kaputt')).toEqual([]);
  });

  it('liest Bild, Name, about und Kontakt; display_name vor name', () => {
    expect(personAusEvent(/** @type {any} */ (JENS_PROFIL))).toEqual({
      pubkey: JENS, name: 'Dr. Jens Dechow', bildUrl: 'https://blossom.edufeed.org/jens.jpg',
      about: 'Jens ist Direktor des Comenius-Institutes und verantwortet **FOERBICO**.',
      website: 'https://comenius.de/', email: 'dechow@comenius.de', nip05: null
    });
  });

  it('nimmt kein http-Bild und keine unsaubere Mailadresse', () => {
    const p = personAusEvent(/** @type {any} */ (kind0(JENS, { name: 'x', picture: 'http://a/b.jpg', email: 'x" onclick="y@z.de' })));
    expect(p?.bildUrl).toBeNull();
    expect(p?.email).toBeNull();
    expect(personAusEvent(/** @type {any} */ ({ ...JENS_PROFIL, kind: 1 }))).toBeNull();
  });
});

describe('inhaltAufbereiten — Personenverweise (ADR-0039)', () => {
  it('macht aus Verweiszeilen Personen-Teile in Textreihenfolge', () => {
    const { teile } = inhaltAufbereiten(TEAM_MD);
    expect(teile.filter((t) => t.art === 'person')).toEqual([
      { art: 'person', pubkey: JENS }, { art: 'person', pubkey: GINA }
    ]);
    const html = teile.map((t) => (t.art === 'html' ? t.html : '')).join('');
    expect(html).toContain('Comenius-Institut');
    expect(html).toContain(`Im Satz bleibt nostr:${npubEncode(JENS)} Text.`);
    expect(html).not.toContain('@@PERSON');
  });
});

describe('Spiegel holt die kind:0 der verwiesenen Personen', () => {
  it('fragt alle Relays nach den Verweisen und behält je Person das neueste', async () => {
    /** @type {Record<string, unknown>[]} */
    const gefragt = [];
    const alt = kind0(JENS, { name: 'alt' }, 1780000000);
    /** @type {import('../src/lib/services/relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(30023)) return { events: url === RELAY ? [/** @type {any} */ (TEAMSEITE)] : [], erreicht: true };
      if (kinds.includes(0) && /** @type {string[]|undefined} */ (filter.authors)?.includes(JENS)) {
        gefragt.push({ url, authors: filter.authors });
        return { events: /** @type {any} */ (url === RPI ? [JENS_PROFIL] : [alt]), erreicht: true };
      }
      if (kinds.includes(0)) return { events: url === RELAY ? [PROFIL] : [], erreicht: true };
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({
      konfig: KONFIG, holen, etagHolen: async () => undefined,
      speicher: { lesen: async () => null, schreiben: async () => {} },
      pruefen: () => true, // Fixtures sind unsigniert; die Prüfung selbst testet signatur.test.js
      bildHolen: async () => null, bildspeicher: { pfadVon: (d) => d, vorhanden: async () => false, schreiben: async () => {} }
    });
    const { inhalt } = await s.auffrischen();
    expect(gefragt.map((g) => g.url).sort()).toEqual([RELAY, RPI].sort());
    expect(gefragt[0].authors).toEqual([JENS, GINA]);
    expect(inhalt.personen?.map((e) => e.id)).toEqual([JENS_PROFIL.id]);
    expect(inhalt.profil?.id).toBe(PROFIL.id);
  });

  it('übernimmt nur Profile mit gültiger Signatur (ADR-0036)', async () => {
    const gefaelscht = { ...kind0(JENS, { name: 'untergeschoben' }, 1795000000), sig: 'falsch' };
    /** @type {import('../src/lib/services/relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(30023)) return { events: url === RELAY ? [/** @type {any} */ (TEAMSEITE)] : [], erreicht: true };
      if (kinds.includes(0) && /** @type {string[]|undefined} */ (filter.authors)?.includes(JENS)) {
        return { events: /** @type {any} */ (url === RPI ? [JENS_PROFIL, gefaelscht] : []), erreicht: true };
      }
      if (kinds.includes(0)) return { events: url === RELAY ? [PROFIL] : [], erreicht: true };
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({
      konfig: KONFIG, holen, etagHolen: async () => undefined,
      speicher: { lesen: async () => null, schreiben: async () => {} },
      pruefen: (e) => e.sig !== 'falsch',
      bildHolen: async () => null, bildspeicher: { pfadVon: (d) => d, vorhanden: async () => false, schreiben: async () => {} }
    });
    const { inhalt } = await s.auffrischen();
    // Das neuere, aber gefälschte Profil verdrängt das echte nicht.
    expect(inhalt.personen?.map((e) => e.id)).toEqual([JENS_PROFIL.id]);
    expect(inhalt.stand?.verworfen).toBe(1);
  });

  it('sammelt nur Verweise auf eigener Zeile', () => {
    expect(personenSammeln([/** @type {any} */ (TEAMSEITE)])).toEqual([JENS, GINA]);
  });
});

describe('Teamseite in der Server-Darstellung', () => {
  const inhalt = {
    ...leererInhalt(),
    stand: { zeitpunkt: '2026-09-30T10:00:00Z', dauerMs: 1, gefragteRelays: [RELAY], nichtErreichbar: [], anzahl: { artikel: 1, listen: 0, nachweise: 0, profil: 0, termine: 0 } },
    artikel: [/** @type {any} */ (TEAMSEITE)],
    personen: [/** @type {any} */ (JENS_PROFIL)],
    profilbilder: { [JENS]: { url: 'https://blossom.edufeed.org/jens.jpg', datei: `${JENS}.jpg`, typ: 'image/jpeg', hash: 'f'.repeat(64) } }
  };

  it('beitragLaden liefert Karten je Person und nennt fehlende Profile als npub', async () => {
    const r = await beitragLaden({ adresse: { kind: 30023, author: AUTOR, d: 'unser-team', relays: [] }, konfig: KONFIG, inhalt });
    if (!r.ok) throw new Error(r.meldung);
    expect(Object.keys(r.personen)).toEqual([JENS]);
    expect(r.personen[JENS].aboutHtml).toContain('<strong>FOERBICO</strong>');
    expect(r.personen[JENS].bildUrl).toBe(`/profilbild/${JENS}?v=${'f'.repeat(12)}`);
    expect(r.fehlendeProfile).toEqual([npubEncode(GINA)]);
  });

  it('ohne gehaltenes Bild gibt es kein Bild — der Leser spricht nie mit dem Fremdhost', async () => {
    const r = await beitragLaden({ adresse: { kind: 30023, author: AUTOR, d: 'unser-team', relays: [] }, konfig: KONFIG, inhalt: { ...inhalt, profilbilder: {} } });
    if (!r.ok) throw new Error(r.meldung);
    expect(r.personen[JENS].bildUrl).toBeNull();
  });

  it('rendert Porträt, Name, Bio und Kontakt; keine leere Karte ohne Profil', async () => {
    const r = await beitragLaden({ adresse: { kind: 30023, author: AUTOR, d: 'unser-team', relays: [] }, konfig: KONFIG, inhalt });
    if (!r.ok) throw new Error(r.meldung);
    const { body } = render(Artikelseite, {
      props: {
        wortmarke: 'FOERBICO',
        data: /** @type {any} */ ({
          pfad: '/unser-team', stand: null, uebersetzung: null, befund: null,
          artikel: { titel: 'Unser Team', zusammenfassung: '', veroeffentlicht: '2026-09-30T00:00:00Z', themen: [], bildUrl: null, sprache: 'de', istSeite: true },
          lizenz: r.lizenz, teile: r.teile, fliesstext: r.fliesstext, entfernteBilder: [],
          personen: r.personen, fehlendeProfile: r.fehlendeProfile
        })
      }
    });
    expect(body).toContain(`src="/profilbild/${JENS}?v=${'f'.repeat(12)}"`);
    expect(body).not.toContain('blossom.edufeed.org/jens.jpg');
    expect(body).toContain('alt="Dr. Jens Dechow"');
    expect(body).toContain('<strong>FOERBICO</strong>');
    expect(body).toContain('href="mailto:dechow@comenius.de"');
    expect(body).toContain('comenius.de');
    expect(body.match(/class="person/g)).toHaveLength(1);
    expect(body).toContain(npubEncode(GINA));
  });
});
