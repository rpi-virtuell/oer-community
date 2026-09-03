import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/** Bild-Syntax in Markdown: ![alt](quelle) */
const BILD = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * Säubert Markdown und rendert es zu HTML.
 *
 * **Bilder im Fließtext werden ausnahmslos entfernt** — auch absolute.
 * Der Lizenznachweis wird über den SHA-256 aus dem `x`-Tag des Artikels
 * gefunden (ADR-0013), und das gibt es nur für das Aufmacherbild. Zu
 * einem Bild im Markdown existiert kein Hash und damit keine Möglichkeit,
 * einen Nachweis zu finden — es dürfte also nie ausgeliefert werden.
 *
 * Zwei Sorten, ein Verhalten:
 * - *relativ* (`nosTr-schrein.jpg`) löst nur gegen WordPress auf; das
 *   aufzulösen hieße WordPress voraussetzen statt ablösen.
 * - *absolut* (`https://cdn.midjourney.com/…`) ist erreichbar, aber
 *   unattestiert. Im FOERBICO-Bestand sind das 25 Bilder in 10 Artikeln,
 *   von Hosts wie midjourney und Wikimedia — Lizenzlage ungeklärt.
 *
 * Die entfernten Verweise werden gezählt und zurückgegeben; die Zahl ist
 * die Redaktions-Aufgabenliste.
 *
 * Blockquotes bleiben stehen — bei FOERBICO sind es echte Zitate, keine
 * Autorenzeilen wie beim relilab-Bot (ADR-0012).
 *
 * @param {string} markdown
 * @returns {{ html: string, entfernteBilder: string[] }}
 */
export function inhaltAufbereiten(markdown) {
  const roh = markdown ?? '';
  if (roh.trim() === '') return { html: '', entfernteBilder: [] };

  /** @type {string[]} */
  const entfernteBilder = [];

  const gesaeubert = roh.replace(BILD, (_treffer, _alt, quelle) => {
    entfernteBilder.push(quelle);
    return '';
  });

  const gerendert = marked.parse(gesaeubert, { async: false, gfm: true });
  const html = typeof gerendert === 'string' ? entschaerfen(gerendert) : '';
  return { html, entfernteBilder };
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
 * `img` steht bewusst **nicht** auf der Liste — Bilder im Fließtext sind
 * schon vorher entfernt (ADR-0015).
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
