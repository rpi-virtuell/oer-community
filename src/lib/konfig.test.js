import { describe, expect, it } from 'vitest';
import { konfigLesen } from './konfig.js';

const vollstaendig = {
  QUELLE_AUTOR: '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf',
  RELAYS: 'wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/',
  BLOSSOM_URL: 'https://blossom.edufeed.org/'
};

describe('konfigLesen', () => {
  it('liest die Pflichtwerte', () => {
    const k = konfigLesen(vollstaendig);
    expect(k.autor).toBe(vollstaendig.QUELLE_AUTOR);
    expect(k.relays).toEqual([
      'wss://relay.edufeed.org/',
      'wss://relay-rpi.edufeed.org/'
    ]);
    expect(k.blossomUrl).toBe('https://blossom.edufeed.org/');
  });

  it('nimmt ein leeres h-Tag als nicht gesetzt', () => {
    expect(konfigLesen({ ...vollstaendig, QUELLE_H_TAG: '' }).hTag).toBe(null);
  });

  it('bricht ab, wenn der Autor fehlt', () => {
    const { QUELLE_AUTOR, ...ohne } = vollstaendig;
    expect(() => konfigLesen(ohne)).toThrow(/QUELLE_AUTOR/);
  });

  it('bricht ab, wenn kein Relay gesetzt ist', () => {
    expect(() => konfigLesen({ ...vollstaendig, RELAYS: '' })).toThrow(/RELAYS/);
  });

  it('bricht ab bei einem Autorenschluessel, der kein 64-stelliger Hex ist', () => {
    expect(() => konfigLesen({ ...vollstaendig, QUELLE_AUTOR: 'abc' })).toThrow(
      /QUELLE_AUTOR/
    );
  });

  it('verwirft Relays, die nicht wss sind', () => {
    expect(() =>
      konfigLesen({ ...vollstaendig, RELAYS: 'http://relay.example/' })
    ).toThrow(/RELAYS/);
  });
});

describe('konfigLesen: Spiegel und abgelöste Hosts (Spec 14.09.)', () => {
  const GUELTIG = {
    QUELLE_AUTOR: 'a'.repeat(64),
    RELAYS: 'wss://relay.edufeed.org/',
    BLOSSOM_URL: 'https://blossom.edufeed.org/'
  };

  it('nimmt Standardwerte, wenn nichts gesetzt ist', () => {
    const k = konfigLesen(GUELTIG);
    expect(k.abgeloesteHosts).toEqual(['oer.community']);
    expect(k.spiegelPfad).toBe('daten/spiegel.json');
    expect(k.spiegelIntervallS).toBe(600);
    expect(k.spiegelStartwartezeitS).toBe(20);
  });

  it('liest mehrere Hosts, klein und ohne Leerzeichen', () => {
    const k = konfigLesen({ ...GUELTIG, ABGELOESTE_HOSTS: ' OER.community , alt.example ' });
    expect(k.abgeloesteHosts).toEqual(['oer.community', 'alt.example']);
  });

  it('leere ABGELOESTE_HOSTS heißt: keiner', () => {
    expect(konfigLesen({ ...GUELTIG, ABGELOESTE_HOSTS: '' }).abgeloesteHosts).toEqual([]);
  });

  it('bricht ab, wenn ein Intervall keine positive Ganzzahl ist', () => {
    expect(() => konfigLesen({ ...GUELTIG, SPIEGEL_INTERVALL_S: 'zehn' })).toThrow(/SPIEGEL_INTERVALL_S/);
    expect(() => konfigLesen({ ...GUELTIG, SPIEGEL_STARTWARTEZEIT_S: '0' })).toThrow(/SPIEGEL_STARTWARTEZEIT_S/);
  });
});

describe('konfigLesen: Struktur-Kennungen (ADR-0027)', () => {
  const GUELTIG = { QUELLE_AUTOR: 'a'.repeat(64), RELAYS: 'wss://relay.edufeed.org/', BLOSSOM_URL: 'https://blossom.edufeed.org/' };
  it('nimmt die Konventionen als Standard', () => {
    const k = konfigLesen(GUELTIG);
    expect(k.startseiteD).toBe('startseite');
    expect(k.navigationD).toBe('navigation');
    expect(k.fusszeileD).toBe('fusszeile');
  });
  it('lässt andere Namen zu, getrimmt; leer heißt Standard', () => {
    const k = konfigLesen({ ...GUELTIG, STARTSEITE_D: ' start ', NAVIGATION_D: '', FUSSZEILE_D: 'footer' });
    expect(k.startseiteD).toBe('start');
    expect(k.navigationD).toBe('navigation');
    expect(k.fusszeileD).toBe('footer');
  });
});

describe('konfigLesen: Kalender aus der Community (ADR-0034)', () => {
  const GUELTIG = { QUELLE_AUTOR: 'a'.repeat(64), RELAYS: 'wss://relay.edufeed.org/', BLOSSOM_URL: 'https://blossom.edufeed.org/' };

  it('nimmt rpi-virtuell und die dev-edufeed-Adresse als Standard', () => {
    const k = konfigLesen(GUELTIG);
    expect(k.community).toBe('ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2');
    expect(k.edufeedUrl).toBe('https://dev.edufeed.org');
  });

  it('leeres COMMUNITY_PUBKEY schaltet den Kalender ab', () => {
    expect(konfigLesen({ ...GUELTIG, COMMUNITY_PUBKEY: '' }).community).toBe(null);
  });

  it('bricht ab, wenn COMMUNITY_PUBKEY kein 64-stelliger Hex ist', () => {
    expect(() => konfigLesen({ ...GUELTIG, COMMUNITY_PUBKEY: 'abc' })).toThrow(/COMMUNITY_PUBKEY/);
  });

  it('schneidet Schrägstriche am Ende der EDUFEED_URL ab', () => {
    expect(konfigLesen({ ...GUELTIG, EDUFEED_URL: 'https://app.edufeed.org//' }).edufeedUrl).toBe('https://app.edufeed.org');
  });

  it('bricht ab, wenn EDUFEED_URL nicht https ist', () => {
    expect(() => konfigLesen({ ...GUELTIG, EDUFEED_URL: 'http://app.edufeed.org' })).toThrow(/EDUFEED_URL/);
  });
});
