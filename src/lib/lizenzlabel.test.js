import { describe, expect, it } from 'vitest';
import { lizenzLabel } from './lizenzlabel.js';

describe('lizenzLabel', () => {
  it('kennt CC0 — der Referenzfall', () => {
    expect(lizenzLabel('https://creativecommons.org/publicdomain/zero/1.0/')).toBe(
      'CC0 (Public Domain)'
    );
  });

  it('setzt CC-Lizenzen aus Kürzel und Version zusammen', () => {
    expect(lizenzLabel('https://creativecommons.org/licenses/by-sa/4.0/')).toBe('CC BY-SA 4.0');
    expect(lizenzLabel('https://creativecommons.org/licenses/by/4.0')).toBe('CC BY 4.0');
  });

  it('nimmt die Rechtsordnung mit', () => {
    expect(lizenzLabel('https://creativecommons.org/licenses/by-nc-sa/3.0/de/')).toBe(
      'CC BY-NC-SA 3.0 DE'
    );
  });

  it('kennt die Unsplash-Lizenz auch unter ihrem deutschen Pfad', () => {
    expect(lizenzLabel('https://unsplash.com/license')).toBe('Unsplash License');
    expect(lizenzLabel('https://unsplash.com/de/lizenz')).toBe('Unsplash License');
    expect(lizenzLabel('https://unsplash.com/fr/licence')).toBe('Unsplash License');
    expect(lizenzLabel('https://unsplash.com/de/fotos/irgendwas')).toBe('https://unsplash.com/de/fotos/irgendwas');
  });

  it('gibt Unbekanntes unverändert zurück, statt einen Namen zu erfinden', () => {
    expect(lizenzLabel('https://example.org/meine-lizenz')).toBe(
      'https://example.org/meine-lizenz'
    );
  });

  it('verträgt fehlende Werte', () => {
    expect(lizenzLabel(null)).toBe('');
    expect(lizenzLabel(undefined)).toBe('');
    expect(lizenzLabel('')).toBe('');
  });
});
