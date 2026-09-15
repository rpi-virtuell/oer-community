import { describe, expect, it } from 'vitest';
import { englischVorhanden, gegenstueck } from './uebersetzungen.js';
import { artikelAusSpiegel } from './artikel.js';
import { leererInhalt } from '../services/spiegel.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('gegenstueck (ADR-0033)', () => {
  const { inhalt } = inhaltDerTestquelle();
  const hole = (/** @type {string} */ d) => /** @type {NonNullable<ReturnType<typeof artikelAusSpiegel>['artikel']>} */ (artikelAusSpiegel(inhalt, { d }).artikel);

  it('vorwärts: our-team nennt unser-team als Übersetzung', () => {
    expect(gegenstueck(inhalt, hole('our-team'))?.d).toBe('unser-team');
  });
  it('rückwärts: unser-team hat kein a-Tag, findet our-team trotzdem', () => {
    expect(gegenstueck(inhalt, hole('unser-team'))?.d).toBe('our-team');
  });
  it('die Startseiten sind Gegenstücke', () => {
    expect(gegenstueck(inhalt, hole('startseite'))?.d).toBe('en/startseite');
    expect(gegenstueck(inhalt, hole('en/startseite'))?.d).toBe('startseite');
  });
  it('ohne Gegenstück null', () => {
    expect(gegenstueck(inhalt, hole('impressum'))).toBeNull();
  });
  it('englischVorhanden: Testquelle ja, leerer Spiegel nein', () => {
    expect(englischVorhanden(inhalt)).toBe(true);
    expect(englischVorhanden(leererInhalt())).toBe(false);
  });
});
