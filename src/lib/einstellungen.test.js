import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';

import { debugModusLesen, debugModusSchreiben, SPEICHER_SCHLUESSEL } from './einstellungen.js';

/** Ein Speicher, der sich wie localStorage verhält. */
function speicherAttrappe(/** @type {Record<string, string>} */ inhalt = {}) {
  return {
    getItem: (/** @type {string} */ k) => inhalt[k] ?? null,
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => {
      inhalt[k] = v;
    },
    inhalt
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('debugModusLesen', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('ist aus, solange nichts gespeichert ist', () => {
    vi.stubGlobal('localStorage', speicherAttrappe());

    expect(debugModusLesen()).toBe(false);
  });

  it('liest einen gespeicherten Wert', () => {
    vi.stubGlobal(
      'localStorage',
      speicherAttrappe({ [SPEICHER_SCHLUESSEL]: JSON.stringify({ debugModus: true }) })
    );

    expect(debugModusLesen()).toBe(true);
  });

  it('ist aus, wenn der gespeicherte Wert unlesbar ist', () => {
    vi.stubGlobal('localStorage', speicherAttrappe({ [SPEICHER_SCHLUESSEL]: 'kein json{' }));

    expect(debugModusLesen()).toBe(false);
  });

  it('ist aus, wenn es keinen localStorage gibt — etwa beim Rendern auf dem Server', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(debugModusLesen()).toBe(false);
  });

  it('wirft nicht, wenn localStorage den Zugriff verweigert', () => {
    // Privates Fenster, blockierte Website-Daten: der Zugriff selbst wirft.
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('Zugriff verweigert');
      },
      setItem() {
        throw new Error('Zugriff verweigert');
      }
    });

    expect(debugModusLesen()).toBe(false);
    expect(() => debugModusSchreiben(true)).not.toThrow();
  });
});

describe('debugModusSchreiben', () => {
  it('speichert unter einem eigenen Schluessel, ohne fremde Werte zu verlieren', () => {
    const speicher = speicherAttrappe({
      [SPEICHER_SCHLUESSEL]: JSON.stringify({ debugModus: false, etwasAnderes: 'bleibt' })
    });
    vi.stubGlobal('localStorage', speicher);

    debugModusSchreiben(true);

    const gespeichert = JSON.parse(speicher.inhalt[SPEICHER_SCHLUESSEL]);
    expect(gespeichert.debugModus).toBe(true);
    expect(gespeichert.etwasAnderes).toBe('bleibt');
  });

  it('legt den Eintrag an, wenn es noch keinen gab', () => {
    const speicher = speicherAttrappe();
    vi.stubGlobal('localStorage', speicher);

    debugModusSchreiben(true);

    expect(JSON.parse(speicher.inhalt[SPEICHER_SCHLUESSEL]).debugModus).toBe(true);
  });
});
