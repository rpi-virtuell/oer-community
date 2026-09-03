import { marked } from 'marked';

/** Bild-Syntax in Markdown: ![alt](quelle) */
const BILD = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * Säubert Markdown und rendert es zu HTML.
 *
 * Relative Bildverweise werden entfernt, nicht aufgelöst: Sie zeigen auf
 * WordPress, und das aufzulösen hieße WordPress voraussetzen statt
 * ablösen (ADR-0013). Blockquotes bleiben stehen — bei FOERBICO sind es
 * echte Zitate, keine Autorenzeilen wie beim relilab-Bot (ADR-0012).
 *
 * @param {string} markdown
 * @returns {{ html: string, entfernteBilder: string[] }}
 */
export function inhaltAufbereiten(markdown) {
  const roh = markdown ?? '';
  if (roh.trim() === '') return { html: '', entfernteBilder: [] };

  /** @type {string[]} */
  const entfernteBilder = [];

  const gesaeubert = roh.replace(BILD, (treffer, _alt, quelle) => {
    if (/^https?:\/\//.test(quelle)) return treffer;
    entfernteBilder.push(quelle);
    return '';
  });

  const html = marked.parse(gesaeubert, { async: false, gfm: true });
  return { html: typeof html === 'string' ? html : '', entfernteBilder };
}
