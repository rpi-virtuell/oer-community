/**
 * Lizenzpille (ADR-0032): der Lizenzstand als Overlay auf dem Bild, in der
 * Darstellung, die der Server ausliefert (ADR-0003).
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Lizenzpille from '../src/lib/komponenten/Lizenzpille.svelte';
import { GRUND_TEXT } from '../src/lib/models/lizenz.js';

/** @type {any} */
const NACHWEIS = {
  id: 'n', hash: 'h', url: 'https://blossom.edufeed.org/h.jpg', titel: 'Schrein',
  license: 'https://creativecommons.org/licenses/by/4.0/', credit: 'laoc42',
  beschreibung: null, quelle: null, alt: null, urheberUrl: null, bearbeitung: null, ki: null, mime: 'image/jpeg'
};

describe('Lizenzpille (ADR-0032)', () => {
  it('bekannt: Lizenzkürzel und Urheber, kein Link, volle Attribution im title', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: true, nachweis: NACHWEIS } } });
    expect(body).toContain('class="pille bekannt');
    expect(body).toContain('CC BY 4.0');
    expect(body).toContain('laoc42');
    expect(body).not.toContain('<a ');
    expect(body).toContain('title="Schrein, laoc42, CC BY 4.0"');
    expect(body).not.toContain('KI-');
  });

  it('bekannt ohne credit: nur das Kürzel, kein Trenner', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: true, nachweis: { ...NACHWEIS, credit: null } } } });
    expect(body).toContain('CC BY 4.0');
    expect(body).not.toContain('>null<');
    expect(body).not.toContain('·');
  });

  it('KI-Marke steht vor dem Kürzel (ADR-0025)', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: true, nachweis: { ...NACHWEIS, ki: 'generated' } } } });
    // title trägt die normative Attributionsreihenfolge (Lizenz vor KI, ADR-0022);
    // die Pille selbst zeigt die Marke zuerst (ADR-0025) — verglichen wird der sichtbare Inhalt.
    const sichtbar = body.replace(/ title="[^"]*"/g, '');
    expect(sichtbar).toContain('KI-generiert');
    expect(sichtbar).toContain('class="ki-icon');
    expect(sichtbar.indexOf('KI-generiert')).toBeLessThan(sichtbar.indexOf('CC BY 4.0'));
  });

  it('ungeklärt: „Lizenz ungeklärt", Grund im title, kein Kürzel', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: false, grund: 'kein-nachweis' } } });
    expect(body).toContain('class="pille ungeklaert');
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(GRUND_TEXT['kein-nachweis']);
    expect(body).not.toContain('CC ');
    expect(body).not.toContain('<a ');
  });

  it('spricht Englisch, wenn die Seite es tut', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: false, grund: 'kein-nachweis' }, sprache: 'en' } });
    expect(body).toContain('Licence unclear');
  });
});
