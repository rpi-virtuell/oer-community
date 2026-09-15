# Lizenzpille Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Lizenzstand jedes Bildes steht als Pille unten rechts auf dem Bild — in der Übersichtskarte wie in der Detailansicht —, und die Karte zeigt das Cover auch ohne aufgelösten Nachweis, wie es ADR-0022 für die Detailansicht schon verlangt.

**Architecture:** Eine neue Komponente `Lizenzpille.svelte` rendert aus einem `Ergebnis` (`lizenzPruefen`) die zwei Zustände „bekannt" (KI-Marke, Lizenzkürzel, Urheber) und „ungeklärt" (Hinweis mit Grund im `title`). Die KI-Marke wandert aus `Lizenzzeile.svelte` in ein eigenes `KiMarke.svelte`, damit Zeile und Pille dasselbe SVG nutzen. Der Übersichts-Loader liefert das Cover mit seinem `Ergebnis` statt nur bei `ok`; `Karte.svelte` und `Bildbereich.svelte` legen die Pille über das Bild. Alles serverseitig gerendert, ohne JavaScript, ohne Popover.

**Tech Stack:** SvelteKit 2, Svelte 5 Runes, JSDoc unter `checkJs`+`strict`, Vitest mit `svelte/server`, FOERBICO-Token aus `src/app.css`.

**Spec:** `docs/entscheidungen/0032-lizenzpille-lizenzstand-als-overlay.md` (entsteht in Task 1 und hält die im Chat am 15.09.2026 abgestimmte Gestaltung fest) sowie ADR-0022 (Bild immer ausliefern, Stand daran), ADR-0025 (KI-Marke), ADR-0031 (Token, kein Weiß auf Akzent). Vorbild: `ImageLicenseOverlay.svelte` der edufeed-app (Pille unten rechts: AI-Marke · Lizenzkürzel · Credit; bei fehlendem Nachweis neutraler Hinweis statt verstecktem Bild).

## Global Constraints

- Sprache: Oberfläche, Bezeichner, Kommentare, Commits Deutsch; Nostr-Namen (`kind`, `d`, `x`, `published_at`) bleiben englisch (CLAUDE.md).
- Komponenten kennen nur Token `--fb-*`; kein Hex-Farbwert in `<style>`; `--fb-akzent` nie Grund für `--fb-weiss` (ADR-0031; `test/oberflaeche.test.js`, `test/kontrast.test.js`).
- Datenschicht (`src/lib/loaders|models|services`) importiert nichts aus `routes/`, `components/` oder `$app`; `.svelte` importiert zur Laufzeit nichts aus `lib/routen|loaders|services` (`src/lib/architektur.test.js`). Import aus `$lib/models/lizenz.js` in eine Komponente ist erlaubt (nur `routen`, `loaders`, `services` sind gesperrt).
- Komponententests rendern mit `svelte/server` (ADR-0003), kein DOM-Nachbau.
- Events werden nie verändert; Attribution folgt `bildattribution.md` (ADR-0022, Punkt 4) — die Pille ersetzt die Attributionszeile in der Detailansicht **nicht**.
- Bilder, die sich nicht zeigen lassen (`kein-bild`, `relativ`, `abgeloester-host`), bleiben unsichtbar (ADR-0013 Punkt 5, ADR-0030).
- Vor jedem Commit: `pnpm check && pnpm test` grün. Commit-Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Keine Subagents aus Implementer-Sicht; kein bare `git stash`.

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `docs/entscheidungen/0032-lizenzpille-lizenzstand-als-overlay.md` (neu) | Entscheidung: Pille auf jedem Bild, Cover in der Übersicht auch ohne Nachweis, kein Popover |
| `src/lib/komponenten/KiMarke.svelte` (neu) | Die EU-„AI"-Marke mit Text — aus `Lizenzzeile.svelte` herausgelöst |
| `src/lib/komponenten/Lizenzzeile.svelte` | nutzt `KiMarke` statt eigenem SVG |
| `src/lib/komponenten/Lizenzpille.svelte` (neu) | Overlay-Pille aus einem `Ergebnis` |
| `test/lizenzpille.test.js` (neu) | beide Zustände, KI-Marke, kein Link, `title` |
| `src/lib/models/lizenz.js` | exportiert `NICHT_ZEIGBAR` |
| `src/lib/loaders/uebersicht.js` | `cover` liefert `{ url, alt, lizenz }` auch ohne Nachweis |
| `src/lib/loaders/uebersicht.test.js` | Cover-Fälle mit Fixture-Bestand |
| `src/lib/komponenten/Karte.svelte` | Cover mit Pille, keine Textzeile mehr |
| `test/uebersicht.test.js` | Karte mit Pille |
| `src/lib/komponenten/Bildbereich.svelte` | Pille über dem Bild, Unterschrift bleibt |
| `test/oberflaeche.test.js` | Artikelseite: Pille und Unterschrift |
| `test/kontrast.test.js` | Pillengrund über Schwarz trägt `--fb-text` |
| `docs/designsystem.md` | Baustein Lizenzpille, Kontrastzeile |
| `CLAUDE.md`, `docs/STATUS.md` | Regel und Logbuch |

---

### Task 1: ADR-0032 schreiben

**Files:**
- Create: `docs/entscheidungen/0032-lizenzpille-lizenzstand-als-overlay.md`

**Interfaces:**
- Produces: die Entscheidung, auf die Tasks 2–5 in Kommentaren und Doku verweisen („ADR-0032").

- [ ] **Step 1: ADR anlegen**

```markdown
# ADR-0032: Lizenzpille — der Lizenzstand liegt auf jedem Bild, auch in der Übersicht

**Status:** angenommen (2026-09-15)
**Beteiligte:** Jörg

Ergänzt ADR-0022 (Punkt 2 gilt auch für die Übersicht) und ADR-0025 (die
KI-Marke steht auch in der Pille). Ersetzt nichts.

## Kontext

ADR-0022 hat entschieden: Das Bild wird immer ausgeliefert, der Lizenzstand
steht daran. Umgesetzt war das nur in der Detailansicht. Die Übersichtskarte
(`Karte.svelte`) zeigte ein Cover nur bei vollständig aufgelöster Kette und
ließ es sonst ganz weg — am 15.09.2026 hatten deshalb 2 von 20 Karten im
Blog ein Bild, obwohl weitere Artikel ein absolut adressiertes Blossom-Bild
tragen. Die Attribution stand als Textzeile unter der Karte, nicht am Bild.

Die edufeed-app löst dieselbe Frage mit einer Komponente für alle Stellen,
an denen ein Bild erscheint (`ImageLicenseOverlay.svelte`, Stand
15.09.2026): eine Pille unten rechts auf dem Bild — EU-„AI"-Marke, wenn
das `ai`-Tag gesetzt ist, dann Lizenzkürzel, dann Credit; bei fehlendem
Nachweis eine neutrale Pille mit „i"-Symbol und Erklärung statt eines
versteckten Bildes. Zwei Oberflächen auf denselben Events sollen denselben
Stand auf dieselbe Art zeigen (Begründung in ADR-0022).

## Entscheidung

1. **Eine Pille auf jedem ausgelieferten Bild.** `Lizenzpille.svelte`
   rendert aus dem `Ergebnis` von `lizenzPruefen` zwei Zustände:
   - *bekannt* (`ok: true`): KI-Marke (nur mit `ai`-Tag, ADR-0025) ·
     Lizenzkürzel (`lizenzLabel`, ADR-0022 Punkt 3) · Credit, wenn
     vorhanden. Kein Link — die Pille liegt auf einem verlinkten Bild. Die
     vollständige Attribution steht im `title`.
   - *ungeklärt* (`ok: false`): „Lizenz ungeklärt" mit dem Grund
     (`GRUND_TEXT`) im `title`.
   Die Pille sitzt unten rechts, Grund ist `--fb-weiss` zu 90 % über dem
   Bild, Text `--fb-text`, Rahmen `--fb-rahmen`, voll gerundet.
2. **Die Übersicht liefert das Cover auch ohne Nachweis.** Der Loader
   gibt `{ url, alt, lizenz }` zurück, sobald das Bild zeigbar ist; nur
   `kein-bild`, `relativ` und `abgeloester-host` ergeben kein Cover —
   dieselben drei Gründe wie im `Bildbereich`, deshalb als `NICHT_ZEIGBAR`
   im Modell. Ohne `x`-Tag gibt es wie in der Detailansicht keinen Lookup
   (`kein-x-tag`).
3. **Die Karte trägt nur die Pille.** Die Textzeile unter der Karte
   entfällt; die verlinkte Attribution nach `bildattribution.md` steht auf
   der Artikelseite, einen Klick entfernt. Dort bleiben Pille **und**
   Unterschrift — die Pille ist Marke, die Unterschrift ist die Attribution.
4. **Kein Popover, kein Fokus.** edufeeds Pille öffnet bei Hover und
   Fokus eine Erklärung. Der Hub ist ohne JavaScript lesbar und die Pille
   ist kein Bedienelement: sichtbarer Text plus `title` genügen; der
   ausführliche Grund steht auf der Artikelseite in der Bildunterschrift.
   Die Pille steht neben dem Link, nicht darin — der Cover-Link der Karte
   ist `aria-hidden`.

## Konsequenzen

- **Der Blog wird bildreicher, und ehrlicher.** Jedes zeigbare Cover
  erscheint; was ihm fehlt, steht darauf. Die Zahl der Pillen „Lizenz
  ungeklärt" in der Übersicht ist die Redaktionsliste.
- **Die Attributionsform bleibt die des Projekts.** Die Pille ist eine
  Kurzform (Kürzel · Credit), keine zweite Attributionskonvention; die
  normative Zeile (Titel, Urheber, Lizenz, KI, Bearbeitung) bleibt allein in
  `Lizenzzeile.svelte`.
- **Ein gemeinsames SVG.** Die EU-Marke liegt in `KiMarke.svelte` und wird
  von Zeile und Pille genutzt; Pfade weiterhin kopiert aus edufeeds
  `AiLabelIcon.svelte` (ADR-0025).
- **Woran wir merken, dass es falsch war:** Wenn die Redaktion die
  Kurzform der Pille als Attribution missversteht und die Zeile darunter
  für überflüssig hält, oder wenn Betrachter den Grund für „ungeklärt" in
  der Übersicht vermissen. Dann ist der Grund als sichtbarer Text auf die
  Karte zu holen — nicht die Pille zu streichen.
```

- [ ] **Step 2: Commit**

```bash
git add docs/entscheidungen/0032-lizenzpille-lizenzstand-als-overlay.md
git commit -m "ADR-0032: Lizenzpille — Lizenzstand als Overlay, Cover in der Übersicht auch ohne Nachweis

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: `KiMarke.svelte` und `Lizenzpille.svelte`

**Files:**
- Create: `src/lib/komponenten/KiMarke.svelte`
- Modify: `src/lib/komponenten/Lizenzzeile.svelte` (KI-Zweig und `<style>`)
- Create: `src/lib/komponenten/Lizenzpille.svelte`
- Test: `test/lizenzpille.test.js`

**Interfaces:**
- Consumes: `Ergebnis`, `GRUND_TEXT` aus `src/lib/models/lizenz.js`; `attributionsGlieder`, `KI_TEXT` aus `src/lib/attribution.js`; `lizenzLabel` aus `src/lib/lizenzlabel.js`.
- Produces: `Lizenzpille` mit Prop `lizenz: Ergebnis`; `KiMarke` mit Prop `text: string`. Beide ohne weitere Props. Die Pille positioniert sich selbst absolut (`right: 8px; bottom: 8px`); der Aufrufer stellt `position: relative` am Bildcontainer.

- [ ] **Step 1: Failing Test schreiben** — `test/lizenzpille.test.js`

```js
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
    expect(body).toContain('KI-generiert');
    expect(body).toContain('class="ki-icon');
    expect(body.indexOf('KI-generiert')).toBeLessThan(body.indexOf('CC BY 4.0'));
  });

  it('ungeklärt: „Lizenz ungeklärt", Grund im title, kein Kürzel', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: false, grund: 'kein-nachweis' } } });
    expect(body).toContain('class="pille ungeklaert');
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(GRUND_TEXT['kein-nachweis']);
    expect(body).not.toContain('CC ');
    expect(body).not.toContain('<a ');
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehler bestätigen**

Run: `pnpm vitest run test/lizenzpille.test.js`
Expected: FAIL — `Failed to resolve import "../src/lib/komponenten/Lizenzpille.svelte"`.

- [ ] **Step 3: `KiMarke.svelte` anlegen** — SVG-Block **unverändert** aus `Lizenzzeile.svelte` übernehmen (dort Zeilen 25–37: von `<svg` bis `></svg`), ebenso die Regeln `.ki` und `.ki-icon` aus dem `<style>` der Lizenzzeile.

```svelte
<script>
  /**
   * Rundes „AI"-Label des EU AI Office neben einem Text (ADR-0025) — eine
   * Marke, kein Link. Zur freien Nutzung ohne Namensnennung veröffentlicht;
   * Pfade kopiert aus edufeeds AiLabelIcon.svelte. Genutzt von Lizenzzeile
   * und Lizenzpille (ADR-0032), damit beide dasselbe Zeichen zeigen.
   * @type {{ text: string }}
   */
  let { text } = $props();
</script>

<span class="ki" title="KI-Beteiligung laut Lizenznachweis (ai-Tag), Kennzeichnung nach EU AI Act"
  ><svg class="ki-icon" viewBox="89 100 366 366" aria-hidden="true" focusable="false"
    ><!-- hier der unveränderte Inhalt des <svg> aus Lizenzzeile.svelte: <circle …/> und <g fill="var(--fb-weiss, #fff)">…</g> --></svg
  >{text}</span
>

<style>
  /* Marke, kein Link: soll neben dem Lizenz-Link auffallen, ohne ihn zu überschreien. */
  .ki {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-size: 0.85em;
    line-height: 1.5;
    white-space: nowrap;
  }
  .ki-icon {
    width: 1em;
    height: 1em;
    flex: none;
  }
</style>
```

Hinweis: `fill="var(--fb-weiss, #fff)"` im SVG steht im Markup, nicht im `<style>` — `test/oberflaeche.test.js` prüft Hex nur im `<style>`; so ist es heute schon in der Lizenzzeile.

- [ ] **Step 4: `Lizenzzeile.svelte` auf `KiMarke` umstellen**

Im `<script>`: `import KiMarke from './KiMarke.svelte';` ergänzen. Den Zweig `{:else if g.art === 'ki'}<span class="ki" …>…</span>` (die gesamte Spanne bis vor `{:else}<span>{g.text}</span>`) ersetzen durch:

```svelte
{:else if g.art === 'ki'}<KiMarke text={g.text} />{:else}<span>{g.text}</span>{/if}{/each}
```

Den `<style>`-Block der Lizenzzeile komplett entfernen (er enthielt nur `.ki` und `.ki-icon`). Den Kommentar über dem Markup („Die KI-Kennzeichnung … ist eine Marke direkt hinter der Lizenz") beibehalten.

- [ ] **Step 5: `Lizenzpille.svelte` anlegen**

```svelte
<script>
  import { GRUND_TEXT } from '$lib/models/lizenz.js';
  import { KI_TEXT, attributionsGlieder } from '$lib/attribution.js';
  import { lizenzLabel } from '$lib/lizenzlabel.js';
  import KiMarke from './KiMarke.svelte';

  /**
   * Der Lizenzstand als Pille unten rechts auf dem Bild (ADR-0032) — Vorbild
   * ist edufeeds ImageLicenseOverlay: KI-Marke · Kürzel · Credit, sonst ein
   * neutraler Hinweis. Kein Link (die Pille liegt auf einem verlinkten Bild),
   * kein Popover (ohne JavaScript lesbar): die volle Attribution bzw. der
   * Grund stehen im title, ausführlich auf der Artikelseite.
   * Der Aufrufer setzt `position: relative` am Bildcontainer.
   * @type {{ lizenz: import('$lib/models/lizenz.js').Ergebnis }}
   */
  let { lizenz } = $props();

  const label = $derived(
    lizenz.ok ? lizenzLabel(lizenz.nachweis.license) || lizenz.nachweis.license : ''
  );
  const credit = $derived(lizenz.ok ? lizenz.nachweis.credit?.trim() || null : null);
  const ki = $derived(lizenz.ok && lizenz.nachweis.ki ? KI_TEXT[lizenz.nachweis.ki] : null);
  const titel = $derived(
    lizenz.ok
      ? (attributionsGlieder(lizenz.nachweis) ?? []).map((g) => g.text).join(', ')
      : `Lizenz ungeklärt. ${GRUND_TEXT[lizenz.grund]}`
  );
</script>

{#if lizenz.ok}
  <span class="pille bekannt" title={titel}>
    {#if ki}<KiMarke text={ki} /><span class="trenner" aria-hidden="true">·</span>{/if}
    <span class="lizenz">{label}</span>
    {#if credit}<span class="trenner" aria-hidden="true">·</span><span class="urheber">{credit}</span>{/if}
  </span>
{:else}
  <span class="pille ungeklaert" title={titel}>
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2" />
      <path d="M12 16v-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="12" cy="8" r=".9" fill="currentColor" />
    </svg>
    Lizenz ungeklärt
  </span>
{/if}

<style>
  /* Grund: Weiß zu 90 % über dem Bild — trägt --fb-text auch über Schwarz
     (10,1:1, nachgerechnet in test/kontrast.test.js). */
  .pille {
    position: absolute;
    right: 8px;
    bottom: 8px;
    max-width: calc(100% - 16px);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border: 1px solid var(--fb-rahmen);
    border-radius: 999px;
    background: color-mix(in srgb, var(--fb-weiss) 90%, transparent);
    backdrop-filter: blur(4px);
    color: var(--fb-text);
    font-size: 0.78rem;
    line-height: 1.6;
    white-space: nowrap;
  }
  .lizenz {
    font-weight: 700;
  }
  .urheber {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icon {
    width: 1em;
    height: 1em;
    flex: none;
  }
</style>
```

- [ ] **Step 6: Tests laufen lassen**

Run: `pnpm vitest run test/lizenzpille.test.js test/oberflaeche.test.js test/uebersicht.test.js src/lib/attribution.test.js && pnpm check`
Expected: alle grün, `svelte-check` 0 Fehler. Schlägt `title="Schrein, laoc42, CC BY 4.0"` fehl, weil Svelte das Attribut anders serialisiert, den tatsächlichen Body ansehen — die Reihenfolge Titel, Urheber, Lizenz aus `attributionsGlieder` ist normativ, der Test bleibt.

- [ ] **Step 7: Commit**

```bash
git add src/lib/komponenten/KiMarke.svelte src/lib/komponenten/Lizenzzeile.svelte src/lib/komponenten/Lizenzpille.svelte test/lizenzpille.test.js
git commit -m "Lizenzpille und KiMarke: Lizenzstand als Overlay, gemeinsames EU-AI-Zeichen (ADR-0032)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Übersicht — Cover mit Lizenzstand, Karte mit Pille

**Files:**
- Modify: `src/lib/models/lizenz.js` (Export `NICHT_ZEIGBAR` nach `GRUND_TEXT`)
- Modify: `src/lib/loaders/uebersicht.js` (Typedef `Karte`, Funktion `cover`)
- Modify: `src/lib/komponenten/Karte.svelte`
- Test: `src/lib/loaders/uebersicht.test.js`, `test/uebersicht.test.js`

**Interfaces:**
- Consumes: `Lizenzpille` (Task 2, Prop `lizenz: Ergebnis`).
- Produces: `NICHT_ZEIGBAR: readonly Grund[]` in `models/lizenz.js`; `Karte.cover: { url: string, alt: string, lizenz: Ergebnis } | null` (Feld `nachweis` entfällt). Task 4 nutzt `NICHT_ZEIGBAR` im `Bildbereich`.

- [ ] **Step 1: Failing Loader-Test** — in `src/lib/loaders/uebersicht.test.js` den Test `'zeigt das Cover nur, wenn die Kette ok ist; abgelöste Hosts nie'` ersetzen durch:

```js
  it('liefert das Cover auch ohne Nachweis, mit Lizenzstand; relative und abgelöste nie (ADR-0032)', () => {
    const karten = [1, 2, 3, 4, 5].flatMap((seite) => artikelListe(inhalt, KONFIG, { seite, tabelle: TABELLE }).karten);
    const referenz = karten.find((k) => k.d === 'die-kraft-der-gemeinschaft');
    expect(referenz?.cover?.lizenz.ok).toBe(true);
    expect(referenz?.cover?.url).toContain('blossom.edufeed.org');
    // Blossom-Bild ohne x-Tag: zeigbar, Stand „kein-x-tag", Adresse vom Artikel.
    const ohneX = karten.find((k) => k.d === '4g2mkzxv');
    expect(ohneX?.cover?.url).toContain('blossom.edufeed.org');
    expect(ohneX?.cover?.lizenz).toEqual({ ok: false, grund: 'kein-x-tag' });
    // Abgelöste Hosts (74 Artikel auf oer.community) bleiben ohne Cover (ADR-0030).
    expect(karten.filter((k) => k.cover && /oer\.community/.test(k.cover.url))).toEqual([]);
    // 1 mit Nachweis + 3 Blossom-Bilder ohne x-Tag (2× blossom.primal.net, 1× blossom.edufeed.org).
    expect(karten.filter((k) => k.cover)).toHaveLength(4);
  });
```

Die Zahl 4 folgt aus dem Fixture `foerbico-artikel-30023.json` (ausgezählt am 15.09.2026: 74 `oer.community`, 6 ohne Bild, 2 relativ, 2 `blossom.primal.net` ohne `x`, 1 `blossom.edufeed.org` ohne `x`, 1 mit `x`). Weicht die Zahl ab, erst die Ursache prüfen (ist einer davon eine Seite? fehlt einer durch die Paginierung?), nicht den Wert anpassen.

- [ ] **Step 2: Failing Karten-Test** — in `test/uebersicht.test.js` oben `import { GRUND_TEXT } from '../src/lib/models/lizenz.js';` ergänzen und den Test `'zeigt das Cover mit Lizenzzeile, wenn eines da ist, sonst kein <img>'` ersetzen durch:

```js
  it('zeigt das Cover mit Lizenzpille statt Textzeile; ohne Cover kein <img> (ADR-0032)', () => {
    const mit = render(Karte, { props: { karte: karte({ cover: { url: NACHWEIS.url, alt: 'Ein Schrein', lizenz: { ok: true, nachweis: NACHWEIS } } }) } }).body;
    expect(mit).toContain('<img');
    expect(mit).toContain('alt="Ein Schrein"');
    expect(mit).toContain('CC0 (Public Domain)');
    expect(mit).toContain('Comenius-Institut');
    expect(mit).not.toContain('bildnachweis');
    // Die Pille steht neben dem Cover-Link, nicht darin — der Link ist aria-hidden.
    expect(mit.indexOf('class="pille')).toBeGreaterThan(mit.indexOf('</a>'));
    expect(render(Karte, { props: { karte: karte() } }).body).not.toContain('<img');
  });

  it('zeigt ein Cover ohne Nachweis mit der Pille „Lizenz ungeklärt" (ADR-0032)', () => {
    const body = render(Karte, {
      props: { karte: karte({ cover: { url: 'https://blossom.edufeed.org/x.jpg', alt: 'Canva für OER', lizenz: { ok: false, grund: 'kein-x-tag' } } }) }
    }).body;
    expect(body).toContain('src="https://blossom.edufeed.org/x.jpg"');
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(GRUND_TEXT['kein-x-tag']);
  });
```

- [ ] **Step 3: Tests laufen lassen, Fehler bestätigen**

Run: `pnpm vitest run src/lib/loaders/uebersicht.test.js test/uebersicht.test.js`
Expected: FAIL — `toHaveLength(4)` bekommt 1; Karte rendert `nachweis` statt `lizenz` (`Cannot read properties of undefined`) bzw. keine Pille.

- [ ] **Step 4: `NICHT_ZEIGBAR` exportieren** — in `src/lib/models/lizenz.js` direkt nach dem `GRUND_TEXT`-Block:

```js
/**
 * Gründe, bei denen es nichts Anzeigbares gibt: keine Adresse, eine nur
 * gegen WordPress auflösbare (ADR-0013, Punkt 5) oder eine auf einem Host,
 * den dieser Hub ablöst (ADR-0030). Jeder andere Grund liefert das Bild mit
 * seinem Lizenzstand aus — in der Detailansicht wie in der Übersicht
 * (ADR-0022, ADR-0032).
 * @type {readonly Grund[]}
 */
export const NICHT_ZEIGBAR = ['kein-bild', 'relativ', 'abgeloester-host'];
```

- [ ] **Step 5: Loader umstellen** — in `src/lib/loaders/uebersicht.js`:

Import ändern: `import { NICHT_ZEIGBAR, lizenzPruefen } from '../models/lizenz.js';`

Typedefs: die Zeile `/** @typedef {import('../models/lizenz.js').Nachweis} Nachweis */` ersetzen durch `/** @typedef {import('../models/lizenz.js').Ergebnis} Ergebnis */` und im `Karte`-Typedef `@property {{ url: string, alt: string, nachweis: Nachweis }|null} cover` durch `@property {{ url: string, alt: string, lizenz: Ergebnis }|null} cover`.

Funktion `cover` samt Kommentar ersetzen:

```js
/**
 * Das Cover einer Karte mit seinem Lizenzstand (ADR-0032): Wie in der
 * Detailansicht wird das Bild auch ohne Nachweis ausgeliefert (ADR-0022);
 * nur was sich nicht zeigen lässt, ergibt null. Ohne x-Tag gibt es keinen
 * Lookup — derselbe Weg wie in beitragLaden, damit Karte und Artikelseite
 * denselben Stand nennen.
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {import('../models/artikel.js').Artikel} a
 * @returns {{ url: string, alt: string, lizenz: Ergebnis }|null}
 */
function cover(inhalt, konfig, a) {
  if (!a.bildUrl) return null;
  const nachweis = a.bildHash ? nachweiseAusSpiegel(inhalt, a.bildHash).nachweis : null;
  const lizenz = lizenzPruefen({
    bildUrl: a.bildUrl, bildHash: a.bildHash, nachweis,
    etag: etagAusSpiegel(inhalt, a.bildUrl), abgeloesteHosts: konfig.abgeloesteHosts
  });
  if (!lizenz.ok && NICHT_ZEIGBAR.includes(lizenz.grund)) return null;
  if (lizenz.ok) {
    return { url: lizenz.nachweis.url, alt: lizenz.nachweis.alt ?? lizenz.nachweis.titel ?? a.titel, lizenz };
  }
  return { url: a.bildUrl, alt: a.titel, lizenz };
}
```

- [ ] **Step 6: Karte umstellen** — `src/lib/komponenten/Karte.svelte` vollständig:

```svelte
<script>
  import Lizenzpille from './Lizenzpille.svelte';
  /** @type {{ karte: import('$lib/loaders/uebersicht.js').Karte }} */
  let { karte } = $props();
  const datum = $derived(new Date(karte.veroeffentlicht).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<article class="karte">
  {#if karte.cover}
    <!-- Cover mit Lizenzstand als Pille (ADR-0032). Der Bild-Link ist
         aria-hidden (der Titel darunter ist der Link); die Pille steht deshalb
         neben ihm, nicht darin. Die verlinkte Attribution steht auf der
         Artikelseite. -->
    <div class="cover">
      <a href={karte.pfad} tabindex="-1" aria-hidden="true">
        <img src={karte.cover.url} alt={karte.cover.alt} loading="lazy" />
      </a>
      <Lizenzpille lizenz={karte.cover.lizenz} />
    </div>
  {/if}
  <div class="text">
    <h2><a href={karte.pfad}>{karte.titel}</a></h2>
    <p class="metazeile"><time datetime={karte.veroeffentlicht}>{datum}</time></p>
    {#if karte.zusammenfassung}<p class="anriss">{karte.zusammenfassung}</p>{/if}
    {#if karte.themen.length > 0}
      <ul class="metazeile themen">
        {#each karte.themen as thema (thema.slug)}
          <li><a class="marker" href={`/themen/${thema.slug}`}>{thema.name}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
</article>

<style>
  .karte { border: 1px solid var(--fb-rahmen); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; background: var(--fb-weiss); }
  .cover { position: relative; }
  .cover a { display: block; }
  .cover img { display: block; width: 100%; height: auto; max-height: 360px; object-fit: cover; }
  .text { padding: 20px 24px 24px; }
  h2 { font-size: 1.5rem; margin-bottom: 6px; }
  h2 a { color: inherit; text-decoration: none; }
  h2 a:hover { text-decoration: underline; }
  .anriss { margin: 10px 0 12px; }
  .themen { list-style: none; padding: 0; margin: 0 0 8px; }
  .marker { text-decoration: none; }
</style>
```

- [ ] **Step 7: Tests und Check**

Run: `pnpm vitest run src/lib/loaders/uebersicht.test.js test/uebersicht.test.js test/uebersicht-routen.test.js && pnpm check`
Expected: grün, 0 Fehler. `grep -rn "cover.nachweis\|cover?.nachweis" src test` muss leer sein.

- [ ] **Step 8: Commit**

```bash
git add src/lib/models/lizenz.js src/lib/loaders/uebersicht.js src/lib/loaders/uebersicht.test.js src/lib/komponenten/Karte.svelte test/uebersicht.test.js
git commit -m "Übersicht: Cover auch ohne Nachweis, Lizenzpille auf der Karte (ADR-0032)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Bildbereich mit Pille, Kontrastnachweis, Designsystem

**Files:**
- Modify: `src/lib/komponenten/Bildbereich.svelte`
- Modify: `test/oberflaeche.test.js` (neuer Test im `describe('Artikelseite')`)
- Modify: `test/kontrast.test.js` (neues `it`)
- Modify: `docs/designsystem.md` (Baustein, Kontrastzeile)

**Interfaces:**
- Consumes: `Lizenzpille` (Task 2), `NICHT_ZEIGBAR` (Task 3), `getoent`/`kontrast`/`token` aus `test/kontrast.test.js` (dort bereits definiert).

- [ ] **Step 1: Failing Oberflächentest** — in `test/oberflaeche.test.js` innerhalb `describe('Artikelseite')` nach dem Test `'zeigt das Bild auch ohne Nachweis und weist den Stand aus (ADR-0022)'` einfügen:

```js
  it('legt die Lizenzpille über das Cover — bekannt wie ungeklärt — und behält die Unterschrift (ADR-0032)', () => {
    const ohne = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'T' } }).body;
    expect(ohne).toContain('class="pille ungeklaert');
    expect(ohne.indexOf('class="pille')).toBeGreaterThan(ohne.indexOf('<img'));
    expect(ohne.indexOf('class="pille')).toBeLessThan(ohne.indexOf('<figcaption'));

    const mit = render(Artikelseite, {
      props: { data: mitNachweis({ titel: 'nosTr-schrein', credit: 'Comenius-Institut' }), wortmarke: 'T' }
    }).body;
    expect(mit).toContain('class="pille bekannt');
    // Die Pille ist Marke, die Unterschrift bleibt die Attribution nach bildattribution.md.
    expect(mit).toContain('<figcaption');
    expect(mit).toContain('rel="license');
  });
```

- [ ] **Step 2: Failing Kontrasttest** — in `test/kontrast.test.js` im `describe` vor `'keine Komponente setzt Weiß auf --fb-akzent (ADR-0031)'` einfügen:

```js
  it('Lizenzpille: --fb-text auf 90 % Weiß trägt auch über einem schwarzen Bild (ADR-0032)', () => {
    const grund = getoent(token('--fb-weiss'), 0.9, '#000000');
    expect(kontrast(token('--fb-text'), grund)).toBeGreaterThanOrEqual(AA);
  });
```

- [ ] **Step 3: Tests laufen lassen, Fehler bestätigen**

Run: `pnpm vitest run test/oberflaeche.test.js test/kontrast.test.js`
Expected: der Oberflächentest FAIL (`class="pille` fehlt); der Kontrasttest PASS (er belegt die Zahl aus der Doku — er darf schon grün sein).

- [ ] **Step 4: `Bildbereich.svelte` umstellen**

Im `<script>`: `import { GRUND_TEXT, NICHT_ZEIGBAR } from '$lib/models/lizenz.js';` und `import Lizenzpille from './Lizenzpille.svelte';` ergänzen. Die lokale Konstante `const NICHT_ZEIGBAR = [...]` samt ihrem Kommentar (vier Zeilen ab „'kein-bild', 'relativ' und 'abgeloester-host' liefern nichts Anzeigbares") ersetzen durch den Kommentar:

```js
  // Was sich nicht zeigen lässt, steht im Modell (NICHT_ZEIGBAR) — dieselbe
  // Liste wie im Übersichts-Loader (ADR-0032).
```

Das Markup der Figur ändern — nur die Zeile `<img src={quelle} {alt} />` wird zu:

```svelte
    <div class="rahmen">
      <img src={quelle} {alt} />
      <Lizenzpille {lizenz} />
    </div>
```

Im `<style>` ergänzen und anpassen:

```css
  .rahmen {
    position: relative;
  }
  .bild img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--fb-akzent);
    border-radius: var(--radius);
  }
```

(`display: block` ist neu — sonst bleibt unter dem Bild der Zeilenabstand, und die Pille säße nicht am Bildrand.)

- [ ] **Step 5: `docs/designsystem.md` ergänzen**

Unter „Bausteine" nach dem Eintrag **Bildrahmen** einfügen:

```markdown
- **Lizenzpille** (`Lizenzpille.svelte`) — der Lizenzstand unten rechts auf
  jedem ausgelieferten Bild (ADR-0032), in Karte und Bildbereich: Grund
  `--fb-weiss` zu 90 % über dem Bild (`color-mix`, `backdrop-filter`),
  Text `--fb-text`, Rahmen `--fb-rahmen`, voll gerundet, `.78rem`. Bekannt:
  KI-Marke (`KiMarke.svelte`) · Lizenzkürzel fett · Credit; ungeklärt:
  „i"-Symbol und „Lizenz ungeklärt". Kein Link, kein Popover — die
  Attribution bzw. der Grund stehen im `title` und in der Bildunterschrift.
```

In der Kontrasttabelle vor der Zeile `--fb-weiss auf --fb-akzent` einfügen:

```markdown
| `--fb-text` auf Lizenzpille (90 % Weiß über Schwarz) | 10,1:1 | AA |
```

- [ ] **Step 6: Tests und Check**

Run: `pnpm vitest run test/oberflaeche.test.js test/kontrast.test.js test/lizenzpille.test.js && pnpm check && pnpm test`
Expected: alles grün.

- [ ] **Step 7: Commit**

```bash
git add src/lib/komponenten/Bildbereich.svelte test/oberflaeche.test.js test/kontrast.test.js docs/designsystem.md
git commit -m "Bildbereich: Lizenzpille über dem Bild, Kontrastnachweis, Designsystem (ADR-0032)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: CLAUDE.md, STATUS, Produktionsbuild

**Files:**
- Modify: `CLAUDE.md` (Falle „Bilder erscheinen mit ihrem Lizenzstand")
- Modify: `docs/STATUS.md` (neuer Eintrag oben)

- [ ] **Step 1: CLAUDE.md** — in der Falle „**Bilder erscheinen mit ihrem Lizenzstand** (ADR-0022, …)" nach dem Satz „Der Alt-Text kommt aus dem `alt`-Tag des Nachweises, nicht aus `title`." einfügen:

```markdown
  **Das gilt auch für die Übersicht** (ADR-0032): Die Karte zeigt jedes
  zeigbare Cover mit der **Lizenzpille** (KI-Marke · Kürzel · Credit, sonst
  „Lizenz ungeklärt"); die Artikelseite zeigt Pille **und**
  Attributionszeile. Was sich nicht zeigen lässt, steht in `NICHT_ZEIGBAR`
  (`src/lib/models/lizenz.js`) — an keiner anderen Stelle.
```

- [ ] **Step 2: STATUS-Eintrag** — oben in `docs/STATUS.md` nach der `---`-Linie einfügen:

```markdown
## 2026-09-15 — Lizenzpille: Lizenzstand als Overlay, Cover in der Übersicht auch ohne Nachweis

**Passiert:** ADR-0032. Neue Komponente `Lizenzpille.svelte` (zwei
Zustände: bekannt mit KI-Marke · Kürzel · Credit, ungeklärt mit Grund im
`title`), `KiMarke.svelte` als gemeinsames EU-AI-Zeichen für Zeile und
Pille. Der Übersichts-Loader liefert das Cover jetzt mit seinem `Ergebnis`
statt nur bei `ok`; `NICHT_ZEIGBAR` (`kein-bild`, `relativ`,
`abgeloester-host`) liegt im Modell und gilt für Karte und Bildbereich
gleich. Die Karte trägt die Pille neben dem aria-hidden Cover-Link statt
der Textzeile; der Bildbereich trägt Pille **und** Unterschrift.
Kontrast der Pille über Schwarz nachgerechnet (10,1:1),
`docs/designsystem.md` um den Baustein ergänzt. Vorbild: edufeeds
`ImageLicenseOverlay.svelte`, bewusst ohne Popover (ohne JavaScript lesbar).

**Wo steht das Projekt:** Im Fixture-Bestand haben 4 statt 1 Karten ein
Cover (1 mit Nachweis, 3 Blossom-Bilder ohne `x`-Tag); die 74 Bilder auf
`oer.community` bleiben unsichtbar, bis sie auf Blossom liegen
(`bildmigration.md`).

**Nächster Schritt:** Live prüfen, wie viele Karten im Blog jetzt ein
Cover mit „Lizenz ungeklärt" tragen — das ist die Redaktionsliste für die
`x`-Tags. Offen aus dem Vortag: Profil-`about`, Seitenbeschreibungen,
doppelte Überschrift der Startseite, Umschalttag.
```

- [ ] **Step 3: Produktionsbuild und Rauchtest**

Run:
```bash
pnpm check && pnpm test && pnpm build
```
Expected: 0 Fehler, alle Tests grün, Build läuft durch (die Komponenten importieren nur aus `$lib/models`, `$lib/attribution.js`, `$lib/lizenzlabel.js` — kein Server-Modul im Client-Bundle).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/STATUS.md
git commit -m "Doku: Lizenzpille in CLAUDE.md und STATUS (ADR-0032)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage** (ADR-0032, Entscheidung 1–4): (1) Pille mit zwei Zuständen, KI-Marke, kein Link, `title` → Task 2. (2) Übersicht liefert Cover auch ohne Nachweis, `NICHT_ZEIGBAR` im Modell, `kein-x-tag` ohne Lookup → Task 3. (3) Karte nur Pille, Detail Pille und Unterschrift → Tasks 3 und 4. (4) kein Popover, Pille neben dem aria-hidden Link → Tasks 2 und 3 (Test „indexOf('class=\"pille') > indexOf('</a>')"). Token-Regeln ADR-0031 → Kontrasttest Task 4, Hex nur im SVG-Markup wie bisher.

**Placeholder scan:** Der einzige Verweis ohne vollständigen Code ist der SVG-Inhalt in `KiMarke.svelte` — er wird ausdrücklich unverändert aus `Lizenzzeile.svelte` Zeilen 25–37 übernommen, damit die Pfade nicht abgetippt werden.

**Type consistency:** `Karte.cover.lizenz: Ergebnis` (Task 3) ↔ `Lizenzpille` Prop `lizenz: Ergebnis` (Task 2) ↔ `Bildbereich` Prop `lizenz: Ergebnis` (bestehend). `NICHT_ZEIGBAR: readonly Grund[]` — `includes(lizenz.grund)` mit `Grund` ist typrein. `KI_TEXT[lizenz.nachweis.ki]` — `ki: KiWert|null`, Zugriff nur nach `&& lizenz.nachweis.ki`.
