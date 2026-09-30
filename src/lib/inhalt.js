import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { hashAusUrl, hostAbgeloest } from './models/lizenz.js';
import { PERSONENVERWEIS, pubkeyAusVerweis } from './models/profil.js';

/** Bild-Syntax in Markdown: ![alt](quelle) — irgendwo im Text. */
const BILD = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * Ein Bild, das allein auf seiner Zeile steht — mit optionaler Unterschrift
 * auf der Folgezeile. `bildattribution.md`: „Die Caption-Zeile steht auf der
 * Zeile direkt nach dem Bild (Zeilenumbruch, kein Leerzeichen dazwischen)."
 * Eine Leerzeile oder ein weiteres Bild beendet den Absatz — dann gibt es
 * keine Unterschrift. Gruppen: 1 alt, 2 quelle, 3 Unterschrift.
 */
const BILD_MIT_UNTERSCHRIFT =
  /^[ \t]*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)[ \t]*(?:\n(?![ \t]*\n)(?![ \t]*!\[)([^\n]+))?/gm;

/** Wo ein Bild- oder Personen-Teil im gerenderten HTML steht. marked setzt den Platzhalter in ein <p>. */
const PLATZHALTER = /(?:<p>)?\s*@@(BILD|PERSON):(\d+)@@\s*(?:<\/p>)?/g;

/**
 * @typedef {{ art: 'html', html: string }} HtmlTeil
 * @typedef {{ art: 'bild', url: string, hash: string, alt: string, unterschrift: string|null }} BildTeil
 * @typedef {{ art: 'fremdbild', url: string, alt: string, unterschrift: string }} FremdbildTeil
 * @typedef {{ art: 'person', pubkey: string }} PersonTeil
 * @typedef {HtmlTeil|BildTeil|FremdbildTeil|PersonTeil} Teil
 */

/** Ein Link in der entschärften Unterschrift — der Quellverweis (ADR-0038). */
const QUELLENLINK = /<a href="https:\/\/[^"]+"/;

/**
 * Säubert Markdown und zerlegt es in Teile: gerendertes HTML und Bilder.
 *
 * **Bilder mit Hash-URL werden zu Bild-Teilen** (ADR-0023). Der Hash im
 * Blossom-Pfad ist der Zeiger auf den `kind:1063`; die Seite baut daraus
 * dieselbe Figur wie beim Cover und löst den Nachweis auf. Die Zeile direkt
 * unter dem Bild ist nach `bildattribution.md` die Unterschrift — sie wird
 * dem Bild-Teil zugeordnet, nicht dem Text, sonst stünde sie doppelt.
 *
 * **Bilder ohne Hash werden entfernt** (ADR-0015) — relative wie absolute.
 * Zu ihnen gibt es keinen Hash und damit keinen auffindbaren Nachweis. Sie
 * werden gezählt; die Zahl ist die Redaktions-Aufgabenliste.
 *
 * **Ausnahme: Fremdbilder mit Quellenzeile** (ADR-0038). Ein absolutes
 * `https`-Bild, das allein auf seiner Zeile steht und direkt darunter eine
 * Zeile mit Link trägt — Rechtehinweis und Quellverweis, z. B. das Logo
 * einer Partnerinstitution von deren Website —, wird als Fremdbild-Teil
 * gezeigt. Die Zeile *ist* hier der Nachweis; ohne sie bleibt es beim
 * Entfernen. Abgelöste Hosts (ADR-0030) bleiben ausgeschlossen.
 *
 * Diese Datei rendert keine Figur: Die Datenschicht kennt die Oberfläche
 * nicht (CLAUDE.md). Sie liefert, was die Seite braucht.
 *
 * **Personenverweise werden zu Personen-Teilen** (ADR-0039): Eine Zeile, die
 * nur `nostr:npub1…` oder `nostr:nprofile1…` enthält, wird zur Karte aus dem
 * `kind:0` dieser Person. Unlesbare Verweise bleiben als Text stehen.
 *
 * Blockquotes bleiben stehen — bei FOERBICO sind es echte Zitate (ADR-0012).
 *
 * @param {string} markdown
 * @param {{ abgeloesteHosts?: string[] }} [optionen]
 * @returns {{ teile: Teil[], entfernteBilder: string[] }}
 */
export function inhaltAufbereiten(markdown, { abgeloesteHosts = [] } = {}) {
  const roh = markdown ?? '';
  if (roh.trim() === '') return { teile: [], entfernteBilder: [] };

  /** @type {string[]} */
  const entfernteBilder = [];
  /** @type {(BildTeil|FremdbildTeil)[]} */
  const bilder = [];

  /**
   * Merkt ein Bild vor — als Bild-Teil (Hash) oder als entfernt (kein Hash).
   * @param {string} alt
   * @param {string} quelle
   * @param {string|null} unterschrift  Markdown der Zeile unter dem Bild
   * @returns {string|null}  Platzhalter für den Text, null wenn entfernt
   */
  const merken = (alt, quelle, unterschrift) => {
    const hash = hashAusUrl(quelle);
    if (!hash) {
      const zeile = unterschrift ? inlineEntschaerfen(unterschrift) : '';
      if (fremdbildZeigbar(quelle, zeile, abgeloesteHosts)) {
        bilder.push({ art: 'fremdbild', url: quelle, alt, unterschrift: zeile });
        return `\n\n@@BILD:${bilder.length - 1}@@\n\n`;
      }
      entfernteBilder.push(quelle);
      return null;
    }
    bilder.push({
      art: 'bild',
      url: quelle,
      hash,
      alt,
      unterschrift: unterschrift ? inlineEntschaerfen(unterschrift) : null
    });
    return `\n\n@@BILD:${bilder.length - 1}@@\n\n`;
  };

  // Durchgang 1: Bilder, die allein auf ihrer Zeile stehen — mit Unterschrift.
  let text = roh.replace(BILD_MIT_UNTERSCHRIFT, (_treffer, alt, quelle, unterschrift) => {
    const platzhalter = merken(alt, quelle, unterschrift ?? null);
    if (platzhalter) return platzhalter;
    // Hashlos: das Bild fällt weg, die Zeile der Autor:in bleibt als Text.
    return unterschrift ?? '';
  });

  // Durchgang 2: Bilder mitten im Text — ohne Unterschrift.
  text = text.replace(BILD, (_treffer, alt, quelle) => merken(alt, quelle, null) ?? '');

  // Durchgang 2b: Personenverweise auf eigener Zeile (ADR-0039).
  /** @type {PersonTeil[]} */
  const personen = [];
  text = text.replace(PERSONENVERWEIS, (treffer, verweis) => {
    const pubkey = pubkeyAusVerweis(verweis);
    if (!pubkey) return treffer;
    personen.push({ art: 'person', pubkey });
    return `\n\n@@PERSON:${personen.length - 1}@@\n\n`;
  });

  const gerendert = marked.parse(text, { async: false, gfm: true });
  const html = typeof gerendert === 'string' ? entschaerfen(gerendert) : '';

  // Durchgang 3: am Platzhalter in Teile schneiden.
  /** @type {Teil[]} */
  const teile = [];
  let bisher = 0;
  for (const treffer of html.matchAll(PLATZHALTER)) {
    const davor = html.slice(bisher, treffer.index);
    if (davor.trim() !== '') teile.push({ art: 'html', html: davor });
    const teil = treffer[1] === 'BILD' ? bilder[Number(treffer[2])] : personen[Number(treffer[2])];
    if (teil) teile.push(teil);
    bisher = (treffer.index ?? 0) + treffer[0].length;
  }
  const rest = html.slice(bisher);
  if (rest.trim() !== '') teile.push({ art: 'html', html: rest });

  return { teile, entfernteBilder };
}

/**
 * Darf ein hashloses Bild als Fremdbild erscheinen (ADR-0038)? Nur absolut
 * über `https`, nicht von einem abgelösten Host, und nur mit einer
 * Unterschrift, die einen Quellenlink trägt.
 * @param {string} quelle
 * @param {string} zeile  entschärfte Unterschrift, '' wenn keine
 * @param {string[]} abgeloesteHosts
 * @returns {boolean}
 */
function fremdbildZeigbar(quelle, zeile, abgeloesteHosts) {
  if (!/^https:\/\//i.test(quelle)) return false;
  if (hostAbgeloest(quelle, abgeloesteHosts)) return false;
  return QUELLENLINK.test(zeile);
}

/**
 * Rendert eine Markdown-Zeile ohne Absatz und entschärft sie — für die
 * Bildunterschrift, die Links wie `[CC0](https://…)` enthalten darf.
 * @param {string} markdown
 * @returns {string}
 */
function inlineEntschaerfen(markdown) {
  const gerendert = marked.parseInline(markdown, { async: false, gfm: true });
  return typeof gerendert === 'string' ? entschaerfen(gerendert) : '';
}

/**
 * Entfernt aus gerendertem HTML alles, was ausführen oder einbetten kann.
 *
 * Nötig, weil Markdown Roh-HTML durchlässt und das Ergebnis über `{@html}`
 * in die Seite geht. Im FOERBICO-Bestand stehen nur harmlose `<br>` — aber
 * Events sind unveränderlich und nicht unser Code, und die Quelle kann sich
 * ändern (ADR-0016). Eine erprobte Bibliothek statt eigener Filter: bei
 * Sanitizern sind Eigenbauten regelmäßig lückenhaft.
 *
 * `img` steht bewusst **nicht** auf der Liste: Bilder mit Hash sind vorher zu
 * Bild-Teilen geworden (ADR-0023), Fremdbilder mit Quellenzeile zu
 * Fremdbild-Teilen (ADR-0038), alle übrigen entfernt (ADR-0015). Ein `<img>`
 * im Roh-HTML des Events käme an beiden vorbei — also raus.
 *
 * @param {string} html
 * @returns {string}
 */
function entschaerfen(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'del', 's', 'sup', 'sub',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
      a: ['href', 'title'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan']
    },
    // Nur diese Schemata in href — schliesst javascript: und data: aus.
    allowedSchemes: ['http', 'https', 'mailto'],
    // Verweise nach draussen oeffnen kein Fenster mit Zugriff auf uns.
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener nofollow' })
    }
  });
}
