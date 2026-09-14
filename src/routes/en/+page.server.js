import { redirect } from '@sveltejs/kit';

/** /en ohne d: Es gibt keine englische Startseite (Spec) — dorthin, wo die Startseite ist. */
export function load() {
  redirect(301, '/');
}
