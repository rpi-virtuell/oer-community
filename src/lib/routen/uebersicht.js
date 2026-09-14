/**
 * Gemeinsame Ladefunktionen der Übersichten: /, /blog, /blog/seite/[n],
 * /themen, /themen/[thema] und /themen/[thema]/seite/[n]. Die Routen selbst
 * bleiben dünn (Task-12-Vorgabe): sie lesen Konfiguration und Spiegel und
 * reichen sie hier hinein.
 */
import { error } from '@sveltejs/kit';
import { artikelListe, themenListe } from '../loaders/uebersicht.js';
import { leerstandMeldung } from '../models/leerstand.js';

/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

/** Seitennummer aus der URL: positive Ganzzahl oder 404. @param {string|undefined} roh */
export function seitennummer(roh) {
  if (roh === undefined) return 1;
  if (!/^[1-9]\d*$/.test(roh)) error(404, `Es gibt keine Seite „${roh}“.`);
  return Number(roh);
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
  return { ...liste, basis: '/blog', ueberschrift: 'Blog', hinweis: null };
}

/** @param {{ konfig: Konfig, inhalt: Inhalt, slug: string, seite?: number }} e */
export function themaLaden({ konfig, inhalt, slug, seite = 1 }) {
  leerOderWeiter(konfig, inhalt);
  const liste = artikelListe(inhalt, konfig, { seite, themaSlug: slug });
  if (liste.thema === null) error(404, `Ein Thema „${slug}“ gibt es nicht. Alle Themen stehen unter /themen.`);
  if (seite > liste.seiten) error(404, `Zum Thema gibt es ${liste.seiten} Seiten, nicht ${seite}.`);
  return { ...liste, basis: `/themen/${slug}`, ueberschrift: liste.thema, hinweis: null };
}

/** @param {{ konfig: Konfig, inhalt: Inhalt }} e */
export function themenLaden({ konfig, inhalt }) {
  leerOderWeiter(konfig, inhalt);
  return { themen: themenListe(inhalt) };
}

/**
 * Stufe 1: Es gibt noch keine Startseite aus Nostr (ADR-0027, Stufe 2). Bis
 * dahin zeigt / den Blog und sagt der Redaktion, welches Event fehlt.
 * @param {{ konfig: Konfig, inhalt: Inhalt }} e
 */
export function startLaden({ konfig, inhalt }) {
  const blog = blogLaden({ konfig, inhalt, seite: 1 });
  return {
    ...blog,
    ueberschrift: 'Beiträge',
    hinweis:
      'Es ist noch keine Startseite publiziert: erwartet wird ein kind:30023 mit d = "startseite" unter dem Autor dieser Quelle. Bis dahin steht hier der Blog.'
  };
}
