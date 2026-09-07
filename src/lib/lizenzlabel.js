/**
 * Lesbares Kürzel zu einer Lizenz-URL (ADR-0022, Punkt 3).
 *
 * **Kopiert aus der edufeed-app**, nicht verlinkt — `formatLicenseUrl` in
 * `src/lib/helpers/educational/licenseLabel.js`, Stand 2026-09-07. Beide
 * Oberflächen zeigen dieselben Events; sie sollen dieselben Namen dafür
 * verwenden. Eine Abhängigkeit zur App wäre der falsche Weg dorthin
 * (CLAUDE.md: „Werte kopieren, nie verlinken").
 *
 * Unbekannte URLs kommen unverändert zurück — lieber die rohe URL als ein
 * erfundener Lizenzname.
 *
 * @param {string|null|undefined} url
 * @returns {string}
 */
export function lizenzLabel(url) {
  if (!url || typeof url !== 'string') return '';
  const roh = url.replace(/\/+$/, '');

  if (/creativecommons\.org\/publicdomain\/zero\/1\.0/i.test(roh)) {
    return 'CC0 (Public Domain)';
  }
  if (/creativecommons\.org\/publicdomain\/mark\/1\.0/i.test(roh)) {
    return 'Public Domain';
  }
  if (/unsplash\.com\/license/i.test(roh)) return 'Unsplash License';
  if (/pixabay\.com\/service\/license/i.test(roh)) return 'Pixabay License';
  if (/canva\.com\/policies\/content-license/i.test(roh)) {
    return 'Canva Content License';
  }
  if (/wikipedia\.org\/wiki\/Urheberrecht/i.test(roh)) {
    return 'Urheberrechtlich geschützt';
  }
  if (/opensource\.org\/licenses\/MIT/i.test(roh)) return 'MIT License';

  // CC-Lizenz: /licenses/{kuerzel}/{version}[/{land}]
  const cc = roh.match(
    /creativecommons\.org\/licenses\/([a-z-]+)\/(\d+\.\d+)(?:\/([a-z]{2,3}))?/i
  );
  if (cc) {
    const [, kuerzel, version, land] = cc;
    const basis = `CC ${kuerzel.toUpperCase()} ${version}`;
    return land ? `${basis} ${land.toUpperCase()}` : basis;
  }

  return url;
}
