/**
 * Bildattribution nach `bildattribution.md` (Wissensgrundlagen FOERBICO),
 * ADR-0022 Punkt 4.
 *
 *   [title](sourceUrl), [author](authorUrl), [licence](licenceUrl), KI-Kennzeichnung, modification
 *
 * Die KI-Kennzeichnung (ADR-0025) steht direkt hinter der Lizenz — das Wiki
 * verlangt die KI-Marke „neben dem Lizenz-Badge". Reihenfolge normativ, Trenner `, `, keine Wörter wie „von" oder „Quelle".
 * Mindestform ist der Lizenz-Link allein. Inhaltlich ist das TULLU (Titel,
 * Urheber, Lizenz, Link, Ursprung) — die Form ist die eigene, nicht edufeeds
 * `buildTulluCaption`, damit Hub, foerbico-editor und md2blossom dasselbe
 * schreiben.
 *
 * Liefert Glieder statt Text: Der Hub rendert serverseitig HTML, und die
 * Links sollen echte Links sein.
 *
 * @typedef {import('./models/lizenz.js').Nachweis} Nachweis
 */

import { lizenzLabel } from './lizenzlabel.js';

/**
 * Lesbarer Text zum ai-Tag — dieselben Wörter schreiben foerbico-editor
 * (bilder.js) und md2blossom in die Caption.
 * @type {Record<import('./models/lizenz.js').KiWert, string>}
 */
export const KI_TEXT = { generated: 'KI-generiert', modified: 'KI-verändert' };

/**
 * @typedef {object} Glied
 * @property {'titel'|'urheber'|'lizenz'|'ki'|'bearbeitung'} art
 * @property {string} text
 * @property {string|null} href
 */

/**
 * @param {Nachweis|null|undefined} nachweis
 * @returns {Glied[]|null}  null ohne Lizenz-URL — dann gibt es nichts zu beschriften
 */
export function attributionsGlieder(nachweis) {
  if (!nachweis?.license) return null;

  /** @type {Glied[]} */
  const glieder = [];

  const titel = nachweis.titel?.trim();
  if (titel) glieder.push({ art: 'titel', text: titel, href: nachweis.quelle?.trim() || null });

  const urheber = nachweis.credit?.trim();
  if (urheber) {
    glieder.push({ art: 'urheber', text: urheber, href: nachweis.urheberUrl?.trim() || null });
  }

  glieder.push({
    art: 'lizenz',
    text: lizenzLabel(nachweis.license) || nachweis.license,
    href: nachweis.license
  });

  if (nachweis.ki && KI_TEXT[nachweis.ki]) {
    glieder.push({ art: 'ki', text: KI_TEXT[nachweis.ki], href: null });
  }

  const bearbeitung = nachweis.bearbeitung?.trim();
  if (bearbeitung) glieder.push({ art: 'bearbeitung', text: bearbeitung, href: null });

  return glieder;
}
