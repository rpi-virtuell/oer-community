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
