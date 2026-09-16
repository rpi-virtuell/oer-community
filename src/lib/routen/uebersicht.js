/**
 * Gemeinsame Ladefunktionen der Übersichten: /, /blog, /blog/seite/[n],
 * /themen, /themen/[thema] und /themen/[thema]/seite/[n]. Die Routen selbst
 * bleiben dünn (Task-12-Vorgabe): sie lesen Konfiguration und Spiegel und
 * reichen sie hier hinein.
 */
import { error, redirect } from '@sveltejs/kit';
import { artikelListe, themenListe } from '../loaders/uebersicht.js';
import { artikelAusSpiegel } from '../loaders/artikel.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { detailLaden } from './detail.js';
import { naechsteTermine } from './termine.js';

/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

/** Seitennummer aus der URL: positive Ganzzahl oder 404. @param {string|undefined} roh */
export function seitennummer(roh) {
  if (roh === undefined) return 1;
  if (!/^[1-9]\d*$/.test(roh)) error(404, `Es gibt keine Seite „${roh}“.`);
  return Number(roh);
}

/**
 * Seitennummer der Route `/seite/[n]`: wie {@link seitennummer}, aber Seite 1
 * leitet dauerhaft auf die Basis. Sonst hätte dieselbe Liste zwei Adressen
 * (`/blog` und `/blog/seite/1`) — und damit zwei kanonische URLs (ADR-0029).
 * @param {string|undefined} roh @param {string} basis
 */
export function seitennummerOhneEins(roh, basis) {
  const n = seitennummer(roh);
  if (n === 1) redirect(301, basis);
  return n;
}

/** @param {Konfig} konfig @param {Inhalt} inhalt */
function leerOderWeiter(konfig, inhalt) {
  const m = leerstandMeldung(inhalt, konfig);
  if (m) error(503, m);
}

/** @param {{ konfig: Konfig, inhalt: Inhalt, seite?: number }} e */
export function blogLaden({ konfig, inhalt, seite = 1 }) {
  leerOderWeiter(konfig, inhalt);
  const liste = artikelListe(inhalt, konfig, { seite });
  if (seite > liste.seiten) error(404, `Der Blog hat ${liste.seiten} Seiten, nicht ${seite}.`);
  return { ...liste, basis: '/blog', ueberschrift: 'Blog', hinweis: null, breit: true };
}

/** @param {{ konfig: Konfig, inhalt: Inhalt, slug: string, seite?: number }} e */
export function themaLaden({ konfig, inhalt, slug, seite = 1 }) {
  leerOderWeiter(konfig, inhalt);
  const liste = artikelListe(inhalt, konfig, { seite, themaSlug: slug });
  if (liste.thema === null) error(404, `Ein Thema „${slug}“ gibt es nicht. Alle Themen stehen unter /themen.`);
  if (seite > liste.seiten) error(404, `Zum Thema gibt es ${liste.seiten} Seiten, nicht ${seite}.`);
  return { ...liste, basis: `/themen/${slug}`, ueberschrift: liste.thema, hinweis: null, breit: true };
}

/** @param {{ konfig: Konfig, inhalt: Inhalt }} e */
export function themenLaden({ konfig, inhalt }) {
  leerOderWeiter(konfig, inhalt);
  return { themen: themenListe(inhalt), breit: true };
}

/**
 * `/` und `/en`: die Startseite der Sprache (kind:30023, d = startseiteD bzw.
 * en/startseiteD) als Seite. Fehlt die deutsche, steht der Blog mit dem
 * Hinweis da, welches Event erwartet wird (ADR-0027); fehlt die englische,
 * geht es nach / — eine leere englische Startseite wäre eine Sackgasse
 * (ADR-0033).
 *
 * Beide Zweige tragen `naechste`: den Block der kommenden Termine unter dem
 * Inhalt (ADR-0034). Ohne Termine ist er leer, und die Komponente zeigt
 * nichts — nicht `undefined`, sonst müsste jede Startseite selbst prüfen.
 *
 * `breit` schaltet das Layout auf die Rasterbreite (ADR-0035): Startkopf
 * und Kartenraster brauchen sie, der Beitragstext liegt in der Lesebreite.
 * @param {{ konfig: Konfig, inhalt: Inhalt, sprache?: 'de'|'en', jetzt?: () => Date }} e
 */
export async function startLaden({ konfig, inhalt, sprache = 'de', jetzt }) {
  leerOderWeiter(konfig, inhalt);
  const naechste = naechsteTermine({ konfig, inhalt, jetzt });
  if (sprache === 'en') {
    const { artikel: englisch } = artikelAusSpiegel(inhalt, { d: `en/${konfig.startseiteD}` });
    // 302, nicht 301: Die englische Startseite fehlt nur vorläufig — eine
    // dauerhafte Weiterleitung bliebe in den Browser-Caches stehen, wenn sie
    // erscheint (ADR-0033, Entscheidung 3).
    if (!englisch) redirect(302, '/');
    const { seite } = await detailLaden({ d: konfig.startseiteD, sprache: 'en', konfig, inhalt, istStartseite: true });
    return /** @type {const} */ ({ art: 'seite', seite, naechste, breit: true });
  }
  const { artikel } = artikelAusSpiegel(inhalt, { d: konfig.startseiteD });
  if (artikel) {
    const { seite } = await detailLaden({ d: konfig.startseiteD, sprache: artikel.sprache, konfig, inhalt, istStartseite: true });
    return /** @type {const} */ ({ art: 'seite', seite, naechste, breit: true });
  }
  const blog = blogLaden({ konfig, inhalt, seite: 1 });
  const { seite: blogSeite, ...rest } = blog;
  return /** @type {const} */ ({
    art: 'blog', ...rest, naechste, breit: true, seitennummer: blogSeite, ueberschrift: 'Beiträge',
    hinweis: `Es ist noch keine Startseite publiziert: erwartet wird ein kind:30023 mit d = "${konfig.startseiteD}" unter dem Autor dieser Quelle. Bis dahin steht hier der Blog.`
  });
}
