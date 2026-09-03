# Artikel-Detailansicht Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine SvelteKit-Route zeigt einen echten FOERBICO-Artikel unter seiner `naddr`-Adresse, serverseitig gerendert, mit nachgewiesener Bildlizenz — und läuft auf `46.225.82.96`.

**Architecture:** Serverseitiges Rendern ohne Browser-Datenschicht (ADR-0003). Die Route lädt in `+page.server.js`: `naddr` dekodieren, Artikel von einem Relay holen, Lizenznachweis `kind:1063` über **alle** Relays holen, Markdown säubern, rendern. Datenschicht in `loaders/` (Abfragen), `models/` (Event → Objekt, Prüfketten), `services/` (Relay-Transport) nach ADR-0009 — sie kennt die Oberfläche nicht. Die Lizenz-Kette gibt einen **Grund** zurück, nicht ja/nein.

**Tech Stack:** SvelteKit 2.70 · Svelte 5.57 (Runes) · TailwindCSS 4.3 + DaisyUI 5.7 · Vitest 4 · nostr-tools 2.25 (nur `naddr`) · marked 18 · ws 8.21 · adapter-node 5.5 · pnpm via corepack

**Spec:** `docs/superpowers/specs/2026-09-03-artikel-detailansicht-design.md`

## Global Constraints

- **Sprache:** Oberfläche, Code, Bezeichner, Commits auf **Deutsch**. Englisch bleiben nur Nostr-Begriffe: `kind`, `tags`, `naddr`, `d`, `h`, `t`, `published_at`, `start`, `end`.
- **Node 20.19.0 ist gesetzt** (lokal vorhanden). Darum **Vitest 4**, nicht 5 — Vitest 5 verlangt Node ≥22.
- **pnpm** ist Paketmanager (CLAUDE.md). Nicht installiert → über `corepack enable pnpm` (corepack 0.31 ist vorhanden).
- **Die Datenschicht kennt die Oberfläche nicht.** Nichts unter `src/lib/loaders/`, `src/lib/models/`, `src/lib/services/` importiert eine Komponente oder Route. Abhängigkeitspfeil nur von `routes/`+`komponenten/` nach `lib/`.
- **Kein `src/lib/nostr/`** — dieser Sammelpfad ist von ADR-0009 verworfen. Die alte Spec vom 31.08. zeigt ihn noch und ist dort veraltet.
- **Applesauce für Relay-Kommunikation, nie `nostr-tools`** (fehlerhafte Serialisierung in `SimplePool`). Hier ist die Relay-Abfrage eigener schlanker Code; `nostr-tools` wird **ausschließlich** für `naddr`-Dekodierung importiert.
- **Kein `ssr = false`.** Keine Relay-Verbindung im Browser, keine Live-Aktualisierung.
- **Kein Cache in diesem Durchstich** — bewusste, befristete Abweichung von CLAUDE.md (Spec, Abschnitt „Abweichung"). Loader kennen keinen Speicher, damit ein Cache später als Schicht darüber passt.
- **Nie eine leere Seite ohne Erklärung.** Jeder Fehlerfall nennt Ursache und was zu tun ist.
- **Was es nicht gibt, wird nicht angedeutet** — keine Navigation, Schaltflächen oder Menüpunkte zu Liste, Startseite, Terminen, Anmeldung.
- **Ein Bild erscheint nur mit auflösbarem Nachweis** (ADR-0013). Sonst Artikel vollständig, ohne Bild.
- **Werte aus der Konfiguration, nie aus dem Code:** Autorenschlüssel, Relays, Blossom-Adresse stehen in `.env` (liegt vor, ausgefüllt).

**Feste Werte für Tests** (geprüft 2026-09-03):

| Wert | |
|---|---|
| Autor | `5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf` |
| `d` | `die-kraft-der-gemeinschaft` |
| Bild-Hash | `a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b` |
| `license` | `https://creativecommons.org/publicdomain/zero/1.0/` |
| `credit` | `Comenius-Institut` |
| Nachweis-`id` | `ebbbb1dcd1bfce58c25e97b74d905b9b63bd725528f4075d42aab15e6c4e2cea` |
| Artikel-Relay | `wss://relay.edufeed.org/` |
| Nachweis-Relay | `wss://relay-rpi.edufeed.org/` (**nur dort**) |

**`naddr` des Referenzfalls** (eine Zeile, ohne Umbruch verwenden):

```
naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj
```

---

## File Structure

| Datei | Verantwortung |
|---|---|
| `package.json`, `svelte.config.js`, `vite.config.js`, `jsconfig.json` | Projektanlage, `checkJs`+`strict` |
| `src/app.html`, `src/app.css` | Rahmen, Tokens aus `docs/designsystem.md` |
| `src/lib/konfig.js` | `.env` lesen, Pflichtwerte prüfen, bei Fehlen abbrechen |
| `src/lib/naddr.js` | `naddr` → `{ kind, author, d, relays }` |
| `src/lib/services/relay.js` | Eine `REQ` an ein Relay, Zeitschranke, Events zurück |
| `src/lib/loaders/artikel.js` | Artikel-Filter bauen und abfragen |
| `src/lib/loaders/lizenz.js` | `kind:1063` über `#x`, **alle** Relays, neuestes gewinnt |
| `src/lib/models/artikel.js` | Event → Artikel-Objekt |
| `src/lib/models/lizenz.js` | Die fünf Schritte aus ADR-0013, mit Grund |
| `src/lib/inhalt.js` | Markdown säubern (relative Bilder) und rendern |
| `src/lib/komponenten/Lizenzzeile.svelte` | Urheber + Lizenz unter dem Bild |
| `src/lib/komponenten/Bildbereich.svelte` | Bild **oder** Hinweis, je nach Grund |
| `src/routes/+layout.svelte` | Minimaler Rahmen, keine Navigation |
| `src/routes/[naddr]/+page.server.js` | Lädt alles zusammen |
| `src/routes/[naddr]/+page.svelte` | Zeigt |
| `src/routes/+error.svelte` | Fehlerseite, die die Ursache nennt |
| `Dockerfile`, `docker-compose.yml`, `.dockerignore` | Auslieferung |
| `docs/betrieb.md` | Wie der Server aufgesetzt und aktualisiert wird |

Tests liegen neben dem Geprüften als `*.test.js` (Vitest-Vorgabe: `include: ['src/**/*.test.js']`).

---

## Task 1: Projekt anlegen, Tokens, leere Route

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.js`, `jsconfig.json`, `.npmrc`
- Create: `src/app.html`, `src/app.css`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`
- Create: `.gitignore` (ergänzen)

**Interfaces:**
- Consumes: nichts
- Produces: lauffähiges `pnpm dev`, `pnpm check`, `pnpm test`

- [ ] **Step 1: pnpm verfügbar machen und Projekt anlegen**

```bash
corepack enable pnpm
pnpm --version   # erwartet: 10.x
```

Dateien von Hand anlegen (kein `sv create` — es fragt interaktiv und legt Beispielcode an, den wir wegwerfen würden).

`package.json`:

```json
{
  "name": "community-hub",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20.19" },
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node build/index.js",
    "check": "svelte-kit sync && svelte-check --tsconfig ./jsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^5.5.7",
    "@sveltejs/kit": "^2.70.3",
    "@sveltejs/vite-plugin-svelte": "^6.2.1",
    "@tailwindcss/vite": "^4.3.3",
    "daisyui": "^5.7.28",
    "svelte": "^5.57.0",
    "svelte-check": "^4.7.6",
    "tailwindcss": "^4.3.3",
    "vite": "^7.1.14",
    "vitest": "^4.0.0"
  },
  "dependencies": {
    "marked": "^18.0.11",
    "nostr-tools": "^2.25.1",
    "ws": "^8.21.3"
  }
}
```

**Warum Vitest 4:** Vitest 5 verlangt Node ≥22, hier läuft Node 20.19.

`.npmrc`:

```
engine-strict=true
```

`svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: { adapter: adapter() }
};
```

`vite.config.js`:

```js
import { sveltekit } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node'
  }
});
```

`jsconfig.json`:

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 2: Installieren und Gerüst erzeugen**

```bash
pnpm install
pnpm exec svelte-kit sync
```

Erwartet: `.svelte-kit/tsconfig.json` existiert danach.

- [ ] **Step 3: `.gitignore` ergänzen**

Anfügen (die Datei hat schon `node_modules/`, `.env`, `.svelte-kit/`, `build/`, `.DS_Store`, `.env.sicherung-*`):

```
pnpm-lock.yaml.bak
.vite/
```

- [ ] **Step 4: `src/app.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 5: `src/app.css` mit den Tokens aus `docs/designsystem.md`**

Werte kopiert, nicht verlinkt (CLAUDE.md).

```css
@import 'tailwindcss';
@plugin 'daisyui';

:root {
  --relilab: #34b2f6;
  --relilab-tief: #1a8fd0;
  --magenta: #d225f8;
  --rpi: #0072aa;
  --foerbico: #203a8f;
  --fusion: #1a5699;
  --fau: #04316a;

  --amber: #f29422;
  --amber-tief: #d97d13;
  --pink: #e54d9a;
  --orange: #ff8103;
  --mint: #2ecc88;

  --rl-text: #1a1e2e;
  --rl-text-leise: #5a6178;
  --rl-dunkel: #04316a;
  --rl-linie: #e6e9f2;
  --rl-flaeche: #f6f7fb;
  --rl-flaeche-2: #eef0f7;
  --rl-weiss: #ffffff;

  --verlauf: linear-gradient(135deg, var(--relilab) 0%, var(--magenta) 100%);
}

body {
  background: var(--rl-weiss);
  color: var(--rl-text);
  font-family: 'Source Sans 3', system-ui, -apple-system, sans-serif;
}

a { color: var(--rpi); }
a:hover { color: var(--relilab-tief); }
```

**Linkfarbe `--rpi`, nicht `--relilab-tief`:** Das Designsystem
(Abschnitt „Offene Punkte", Punkt 1) hält fest, dass `--relilab-tief`
auf Weiß nur 3,57:1 erreicht — zu wenig für Fließtext. `--rpi` ist die
Fließtext-Linkfarbe.

- [ ] **Step 6: `src/routes/+layout.svelte` — Rahmen ohne Navigation**

Keine Navigation: Es gibt nur diese eine Route (CLAUDE.md, „Was es nicht gibt, wird auch nicht angedeutet").

```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
  {@render children()}
</div>
```

- [ ] **Step 7: `src/routes/+page.svelte` — Hinweis statt leerer Seite**

```svelte
<h1 class="text-2xl font-bold">community-hub</h1>
<p class="mt-4" style="color: var(--rl-text-leise)">
  Dieser Durchstich zeigt einen einzelnen Artikel unter seiner
  <code>naddr</code>-Adresse. Es gibt noch keine Übersicht.
</p>
```

- [ ] **Step 8: Prüfen**

```bash
pnpm check
pnpm dev   # http://localhost:5173 zeigt den Hinweis; danach abbrechen
```

Erwartet: `pnpm check` ohne Fehler.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "SvelteKit-Geruest angelegt, Designtokens uebernommen"
```

---

## Task 2: Konfiguration mit Startabbruch

**Files:**
- Create: `src/lib/konfig.js`, `src/lib/konfig.test.js`

**Interfaces:**
- Consumes: `.env` (liegt vor)
- Produces: `konfigLesen(quelle) → { autor, hTag, relays, blossomUrl }` — wirft `Error` bei fehlendem Pflichtwert. `quelle` ist ein Objekt wie `process.env`; per Parameter, damit es ohne echte Umgebung testbar ist.

- [ ] **Step 1: Failing test schreiben**

`src/lib/konfig.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { konfigLesen } from './konfig.js';

const vollstaendig = {
  QUELLE_AUTOR: '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf',
  RELAYS: 'wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/',
  BLOSSOM_URL: 'https://blossom.edufeed.org/'
};

describe('konfigLesen', () => {
  it('liest die Pflichtwerte', () => {
    const k = konfigLesen(vollstaendig);
    expect(k.autor).toBe(vollstaendig.QUELLE_AUTOR);
    expect(k.relays).toEqual([
      'wss://relay.edufeed.org/',
      'wss://relay-rpi.edufeed.org/'
    ]);
    expect(k.blossomUrl).toBe('https://blossom.edufeed.org/');
  });

  it('nimmt ein leeres h-Tag als nicht gesetzt', () => {
    expect(konfigLesen({ ...vollstaendig, QUELLE_H_TAG: '' }).hTag).toBe(null);
  });

  it('bricht ab, wenn der Autor fehlt', () => {
    const { QUELLE_AUTOR, ...ohne } = vollstaendig;
    expect(() => konfigLesen(ohne)).toThrow(/QUELLE_AUTOR/);
  });

  it('bricht ab, wenn kein Relay gesetzt ist', () => {
    expect(() => konfigLesen({ ...vollstaendig, RELAYS: '' })).toThrow(/RELAYS/);
  });

  it('bricht ab bei einem Autorenschluessel, der kein 64-stelliger Hex ist', () => {
    expect(() => konfigLesen({ ...vollstaendig, QUELLE_AUTOR: 'abc' })).toThrow(
      /QUELLE_AUTOR/
    );
  });

  it('verwirft Relays, die nicht wss sind', () => {
    expect(() =>
      konfigLesen({ ...vollstaendig, RELAYS: 'http://relay.example/' })
    ).toThrow(/RELAYS/);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

```bash
pnpm test src/lib/konfig.test.js
```

Erwartet: FAIL, `Failed to resolve import "./konfig.js"`.

- [ ] **Step 3: `src/lib/konfig.js` schreiben**

```js
/**
 * @typedef {object} Konfig
 * @property {string} autor         Autorenschlüssel der Quelle (hex, 64)
 * @property {string|null} hTag     zweites Filterkriterium, oder null
 * @property {string[]} relays      mindestens eines, alle wss://
 * @property {string} blossomUrl    Basisadresse des Bildspeichers
 */

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Liest die Konfiguration und bricht bei fehlendem Pflichtwert ab.
 * Lieber hier abbrechen als später leere Seiten liefern (CLAUDE.md).
 *
 * @param {Record<string, string|undefined>} quelle
 * @returns {Konfig}
 */
export function konfigLesen(quelle) {
  const autor = (quelle.QUELLE_AUTOR ?? '').trim();
  if (!HEX64.test(autor)) {
    throw new Error(
      'QUELLE_AUTOR fehlt oder ist kein 64-stelliger Hex-Schlüssel. ' +
        'In .env eintragen — siehe .env.example.'
    );
  }

  const relays = (quelle.RELAYS ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (relays.length === 0) {
    throw new Error(
      'RELAYS fehlt. Mindestens ein Relay angeben, komma-getrennt — ' +
        'z. B. wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/'
    );
  }
  const falsch = relays.filter((r) => !r.startsWith('wss://'));
  if (falsch.length > 0) {
    throw new Error(`RELAYS: keine wss-Adresse: ${falsch.join(', ')}`);
  }

  const blossomUrl = (quelle.BLOSSOM_URL ?? '').trim();
  if (!blossomUrl.startsWith('https://')) {
    throw new Error(
      'BLOSSOM_URL fehlt oder ist nicht https — z. B. https://blossom.edufeed.org/'
    );
  }

  const rohHTag = (quelle.QUELLE_H_TAG ?? '').trim();
  return { autor, hTag: rohHTag === '' ? null : rohHTag, relays, blossomUrl };
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

```bash
pnpm test src/lib/konfig.test.js
```

Erwartet: 6 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/konfig.js src/lib/konfig.test.js
git commit -m "Konfiguration liest .env und bricht bei fehlendem Pflichtwert ab"
```

---

## Task 3: naddr dekodieren

**Files:**
- Create: `src/lib/naddr.js`, `src/lib/naddr.test.js`

**Interfaces:**
- Consumes: `nostr-tools/nip19`
- Produces: `naddrDekodieren(text) → { kind, author, d, relays }`, wirft `Error` bei unlesbarer Eingabe. `relays` ist `string[]` (kann leer sein).

- [ ] **Step 1: Failing test schreiben**

`src/lib/naddr.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { naddrDekodieren } from './naddr.js';

const REFERENZ =
  'naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj';

describe('naddrDekodieren', () => {
  it('liest den Referenzfall', () => {
    const a = naddrDekodieren(REFERENZ);
    expect(a.kind).toBe(30023);
    expect(a.author).toBe(
      '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf'
    );
    expect(a.d).toBe('die-kraft-der-gemeinschaft');
    expect(a.relays).toContain('wss://relay.edufeed.org/');
  });

  it('bricht bei Unsinn ab', () => {
    expect(() => naddrDekodieren('kein-naddr')).toThrow(/naddr/i);
  });

  it('bricht bei einem npub ab', () => {
    expect(() =>
      naddrDekodieren('npub1f7jar3qnu269uyx5p0e4v24hqxjnxysxudvujza2ur5ehltvdeqsly2fx9')
    ).toThrow(/naddr/i);
  });

  it('bricht bei leerer Eingabe ab', () => {
    expect(() => naddrDekodieren('')).toThrow(/naddr/i);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

```bash
pnpm test src/lib/naddr.test.js
```

Erwartet: FAIL, Modul fehlt.

- [ ] **Step 3: `src/lib/naddr.js` schreiben**

`nostr-tools` **nur** hierfür — nicht für Relay-Kommunikation (CLAUDE.md).

```js
import { decode } from 'nostr-tools/nip19';

/**
 * @typedef {object} Adresse
 * @property {number} kind
 * @property {string} author    hex
 * @property {string} d         Kennung des ersetzbaren Events
 * @property {string[]} relays  Relay-Hinweise aus dem naddr (kann leer sein)
 */

/**
 * Dekodiert eine naddr-Adresse.
 *
 * @param {string} text
 * @returns {Adresse}
 */
export function naddrDekodieren(text) {
  const eingabe = (text ?? '').trim();
  if (eingabe === '') {
    throw new Error('Keine naddr-Adresse angegeben.');
  }

  let ergebnis;
  try {
    ergebnis = decode(eingabe);
  } catch {
    throw new Error(`Keine lesbare naddr-Adresse: ${eingabe.slice(0, 24)}…`);
  }

  if (ergebnis.type !== 'naddr') {
    throw new Error(
      `Erwartet wurde eine naddr-Adresse, gefunden: ${ergebnis.type}.`
    );
  }

  const { kind, pubkey, identifier, relays } = ergebnis.data;
  return { kind, author: pubkey, d: identifier, relays: relays ?? [] };
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

```bash
pnpm test src/lib/naddr.test.js
```

Erwartet: 4 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/naddr.js src/lib/naddr.test.js
git commit -m "naddr-Dekodierung mit dem Referenzfall als Pruefung"
```

---

## Task 4: Relay-Abfrage

**Files:**
- Create: `src/lib/services/relay.js`

**Interfaces:**
- Consumes: `ws`
- Produces:
  - `eventsHolen(relayUrl, filter, optionen?) → Promise<Event[]>` — eine `REQ`, sammelt bis `EOSE` oder Zeitschranke, schließt danach. Wirft **nicht** bei Verbindungsfehler, sondern liefert `[]`.
  - `eventsVonAllen(relayUrls, filter, optionen?) → Promise<{ events: Event[], fehler: string[] }>` — fragt parallel, führt zusammen, dedupliziert nach `id`.
  - `optionen`: `{ zeitschrankeMs?: number }`, Standard 8000.
  - `Event`: `{ id, pubkey, created_at, kind, tags: string[][], content, sig }`

Kein Test in diesem Task: Die Funktion ist reiner Netz-Transport, und die Spec schließt ein Mock-Relay für diesen Durchstich aus. Geprüft wird sie in Task 9 am echten Relay.

- [ ] **Step 1: `src/lib/services/relay.js` schreiben**

```js
import { WebSocket } from 'ws';

/**
 * @typedef {object} Event
 * @property {string} id
 * @property {string} pubkey
 * @property {number} created_at
 * @property {number} kind
 * @property {string[][]} tags
 * @property {string} content
 * @property {string} sig
 */

/** @typedef {Record<string, unknown>} Filter */

const ZEITSCHRANKE_MS = 8000;

/**
 * Fragt ein Relay mit einem Filter ab.
 *
 * Liefert bei Verbindungsfehler eine leere Liste statt zu werfen — ein
 * nicht erreichbares Relay ist ein Betriebszustand, kein Programmfehler.
 * Wer wissen muss, ob es klappte, nimmt eventsVonAllen.
 *
 * @param {string} relayUrl
 * @param {Filter} filter
 * @param {{ zeitschrankeMs?: number }} [optionen]
 * @returns {Promise<Event[]>}
 */
export function eventsHolen(relayUrl, filter, optionen = {}) {
  const grenze = optionen.zeitschrankeMs ?? ZEITSCHRANKE_MS;

  return new Promise((fertig) => {
    /** @type {Event[]} */
    const gesammelt = [];
    let abgeschlossen = false;
    /** @type {WebSocket|null} */
    let ws = null;

    const uhr = setTimeout(() => beenden(), grenze);

    function beenden() {
      if (abgeschlossen) return;
      abgeschlossen = true;
      clearTimeout(uhr);
      try {
        ws?.close();
      } catch {
        // Schließen darf scheitern, das Ergebnis steht schon fest.
      }
      fertig(gesammelt);
    }

    try {
      ws = new WebSocket(relayUrl);
    } catch {
      beenden();
      return;
    }

    ws.on('open', () => {
      ws?.send(JSON.stringify(['REQ', 'abfrage', filter]));
    });

    ws.on('message', (rohdaten) => {
      let nachricht;
      try {
        nachricht = JSON.parse(rohdaten.toString());
      } catch {
        return;
      }
      if (!Array.isArray(nachricht)) return;

      const [art] = nachricht;
      if (art === 'EVENT' && nachricht[2]) {
        gesammelt.push(nachricht[2]);
      } else if (art === 'EOSE' || art === 'CLOSED') {
        beenden();
      }
    });

    ws.on('error', () => beenden());
    ws.on('close', () => beenden());
  });
}

/**
 * Fragt mehrere Relays parallel und führt die Ergebnisse zusammen.
 *
 * Nötig, weil ein Lizenznachweis nicht auf demselben Relay liegen muss
 * wie der Artikel (ADR-0013).
 *
 * @param {string[]} relayUrls
 * @param {Filter} filter
 * @param {{ zeitschrankeMs?: number }} [optionen]
 * @returns {Promise<{ events: Event[], fehler: string[] }>}
 */
export async function eventsVonAllen(relayUrls, filter, optionen = {}) {
  const ergebnisse = await Promise.all(
    relayUrls.map(async (url) => ({
      url,
      events: await eventsHolen(url, filter, optionen)
    }))
  );

  /** @type {Map<string, Event>} */
  const nachId = new Map();
  /** @type {string[]} */
  const fehler = [];

  for (const { url, events } of ergebnisse) {
    if (events.length === 0) fehler.push(url);
    for (const e of events) nachId.set(e.id, e);
  }

  return { events: [...nachId.values()], fehler };
}
```

**`fehler` bedeutet „nichts geliefert", nicht „kaputt".** Ein Relay ohne
Treffer landet auch dort. Das ist gewollt: Der Aufrufer will wissen,
welche Relays nichts beigetragen haben, um es im Fehlerfall zu nennen.

- [ ] **Step 2: Typprüfung**

```bash
pnpm check
```

Erwartet: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/relay.js
git commit -m "Relay-Abfrage: eine REQ mit Zeitschranke, mehrere Relays parallel"
```

---

## Task 5: Artikel-Modell

**Files:**
- Create: `src/lib/models/artikel.js`, `src/lib/models/artikel.test.js`

**Interfaces:**
- Consumes: `Event` aus `services/relay.js` (nur als Typ)
- Produces: `artikelAusEvent(event) → Artikel` mit
  `{ id, kind, autor, d, titel, zusammenfassung, veroeffentlicht (Date), bildUrl (string|null), bildHash (string|null), themen (string[]), inhalt (string) }`

- [ ] **Step 1: Failing test schreiben**

`src/lib/models/artikel.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { artikelAusEvent } from './artikel.js';

const referenz = JSON.parse(
  readFileSync(
    new URL(
      '../../../test/fixtures/artikel-30023-die-kraft-der-gemeinschaft.json',
      import.meta.url
    ),
    'utf8'
  )
)[0];

/** @param {string[][]} tags */
function event(tags, content = 'Text') {
  return {
    id: 'a'.repeat(64),
    pubkey: 'b'.repeat(64),
    created_at: 1000,
    kind: 30023,
    tags,
    content,
    sig: 'c'.repeat(128)
  };
}

describe('artikelAusEvent', () => {
  it('liest den Referenzfall', () => {
    const a = artikelAusEvent(referenz);
    expect(a.titel).toContain('Die Kraft der Gemeinschaft');
    expect(a.d).toBe('die-kraft-der-gemeinschaft');
    expect(a.bildUrl).toBe(
      'https://blossom.edufeed.org/a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b.jpeg'
    );
    expect(a.bildHash).toBe(
      'a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b'
    );
    expect(a.zusammenfassung).toContain('FOERBICO');
  });

  it('nimmt published_at, nicht created_at', () => {
    const a = artikelAusEvent(
      event([
        ['d', 'x'],
        ['title', 'T'],
        ['published_at', '1788433547']
      ])
    );
    expect(a.veroeffentlicht.getTime()).toBe(1788433547 * 1000);
  });

  it('faellt auf created_at zurueck, wenn published_at fehlt', () => {
    const a = artikelAusEvent(event([['d', 'x'], ['title', 'T']]));
    expect(a.veroeffentlicht.getTime()).toBe(1000 * 1000);
  });

  it('liefert null, wenn kein Bild gesetzt ist', () => {
    const a = artikelAusEvent(event([['d', 'x'], ['title', 'T']]));
    expect(a.bildUrl).toBe(null);
    expect(a.bildHash).toBe(null);
  });

  it('sammelt alle t-Tags als Themen', () => {
    const a = artikelAusEvent(
      event([['d', 'x'], ['title', 'T'], ['t', 'OER'], ['t', 'Community']])
    );
    expect(a.themen).toEqual(['OER', 'Community']);
  });

  it('nimmt d als Titel, wenn title fehlt', () => {
    expect(artikelAusEvent(event([['d', 'ohne-titel']])).titel).toBe('ohne-titel');
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

```bash
pnpm test src/lib/models/artikel.test.js
```

Erwartet: FAIL, Modul fehlt.

- [ ] **Step 3: `src/lib/models/artikel.js` schreiben**

```js
/**
 * @typedef {import('../services/relay.js').Event} Event
 */

/**
 * @typedef {object} Artikel
 * @property {string} id
 * @property {number} kind
 * @property {string} autor
 * @property {string} d
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {Date} veroeffentlicht
 * @property {string|null} bildUrl
 * @property {string|null} bildHash   SHA-256 aus dem x-Tag
 * @property {string[]} themen
 * @property {string} inhalt          rohes Markdown
 */

/**
 * Erster Wert eines Tags, oder null.
 *
 * @param {string[][]} tags
 * @param {string} name
 * @returns {string|null}
 */
function tagWert(tags, name) {
  const treffer = tags.find((t) => t[0] === name && t.length > 1);
  return treffer ? treffer[1] : null;
}

/**
 * Wandelt ein Event in einen Artikel.
 *
 * Anzeigedatum ist published_at, nicht created_at (CLAUDE.md).
 *
 * @param {Event} event
 * @returns {Artikel}
 */
export function artikelAusEvent(event) {
  const tags = event.tags ?? [];
  const d = tagWert(tags, 'd') ?? '';
  const published = tagWert(tags, 'published_at');
  const sekunden = published ? Number.parseInt(published, 10) : event.created_at;

  return {
    id: event.id,
    kind: event.kind,
    autor: event.pubkey,
    d,
    titel: tagWert(tags, 'title') ?? d,
    zusammenfassung: tagWert(tags, 'summary') ?? '',
    veroeffentlicht: new Date(
      (Number.isFinite(sekunden) ? sekunden : event.created_at) * 1000
    ),
    bildUrl: tagWert(tags, 'image'),
    bildHash: tagWert(tags, 'x'),
    themen: tags.filter((t) => t[0] === 't' && t.length > 1).map((t) => t[1]),
    inhalt: event.content ?? ''
  };
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

```bash
pnpm test src/lib/models/artikel.test.js
```

Erwartet: 6 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/models/artikel.js src/lib/models/artikel.test.js
git commit -m "Artikel-Modell: published_at gewinnt, Bildhash aus dem x-Tag"
```

---

## Task 6: Die Lizenz-Kette

Der Kern. Eigene Datei, eigener Test, gibt **den Grund** zurück.

**Files:**
- Create: `src/lib/models/lizenz.js`, `src/lib/models/lizenz.test.js`

**Interfaces:**
- Consumes: `Event` (Typ)
- Produces:
  - `nachweisAusEvents(events) → Nachweis|null` — wählt aus mehreren `kind:1063` das neueste `created_at`, Gleichstand nach `id` (lexikografisch kleinste gewinnt). `Nachweis`: `{ id, hash, url, titel (string|null), license, credit, mime (string|null) }`. Liefert `null`, wenn keines `license` **und** `credit` hat.
  - `lizenzPruefen({ bildUrl, bildHash, nachweis, etag }) → Ergebnis`
    — `Ergebnis` ist `{ ok: true, nachweis }` oder `{ ok: false, grund }` mit
    `grund` aus `'kein-bild' | 'relativ' | 'kein-x-tag' | 'kein-nachweis' | 'pflichtfeld-fehlt' | 'hash-widerspruch'`.
    `etag` ist optional; fehlt er, wird Schritt 5 übersprungen.

- [ ] **Step 1: Failing test schreiben**

`src/lib/models/lizenz.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lizenzPruefen, nachweisAusEvents } from './lizenz.js';

const HASH = 'a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b';
const BILD = `https://blossom.edufeed.org/${HASH}.jpeg`;

const nachweisEvents = JSON.parse(
  readFileSync(
    new URL('../../../test/fixtures/lizenz-1063-nostr-schrein.json', import.meta.url),
    'utf8'
  )
);

/** @param {string[][]} tags */
function event(tags, created_at = 1000, id = 'a'.repeat(64)) {
  return { id, pubkey: 'b'.repeat(64), created_at, kind: 1063, tags, content: '', sig: '' };
}

describe('nachweisAusEvents', () => {
  it('liest den echten Nachweis', () => {
    const n = nachweisAusEvents(nachweisEvents);
    expect(n?.credit).toBe('Comenius-Institut');
    expect(n?.license).toBe('https://creativecommons.org/publicdomain/zero/1.0/');
    expect(n?.titel).toBe('nosTr-schrein');
    expect(n?.hash).toBe(HASH);
  });

  it('liefert null bei leerer Liste', () => {
    expect(nachweisAusEvents([])).toBe(null);
  });

  it('verwirft einen Nachweis ohne credit', () => {
    expect(
      nachweisAusEvents([
        event([['x', HASH], ['url', BILD], ['license', 'https://cc/0']])
      ])
    ).toBe(null);
  });

  it('verwirft einen Nachweis ohne license', () => {
    expect(
      nachweisAusEvents([event([['x', HASH], ['url', BILD], ['credit', 'Wer']])])
    ).toBe(null);
  });

  it('nimmt bei mehreren das neueste created_at', () => {
    const alt = event([['x', HASH], ['url', BILD], ['license', 'L1'], ['credit', 'alt']], 100);
    const neu = event([['x', HASH], ['url', BILD], ['license', 'L2'], ['credit', 'neu']], 200, 'd'.repeat(64));
    expect(nachweisAusEvents([alt, neu])?.credit).toBe('neu');
    expect(nachweisAusEvents([neu, alt])?.credit).toBe('neu');
  });

  it('entscheidet Gleichstand nach id', () => {
    const a = event([['x', HASH], ['url', BILD], ['license', 'L'], ['credit', 'A']], 100, 'a'.repeat(64));
    const b = event([['x', HASH], ['url', BILD], ['license', 'L'], ['credit', 'B']], 100, 'f'.repeat(64));
    expect(nachweisAusEvents([b, a])?.credit).toBe('A');
  });
});

describe('lizenzPruefen', () => {
  const nachweis = nachweisAusEvents(nachweisEvents);

  it('laesst den Referenzfall durch', () => {
    const e = lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis, etag: `"${HASH}"` });
    expect(e.ok).toBe(true);
  });

  it('kommt ohne etag durch (Schritt 5 entfaellt)', () => {
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis }).ok).toBe(true);
  });

  it('Schritt 1: relativer Pfad', () => {
    const e = lizenzPruefen({ bildUrl: 'nosTr-schrein.jpg', bildHash: HASH, nachweis });
    expect(e).toEqual({ ok: false, grund: 'relativ' });
  });

  it('kein Bild', () => {
    expect(lizenzPruefen({ bildUrl: null, bildHash: null, nachweis: null })).toEqual({
      ok: false,
      grund: 'kein-bild'
    });
  });

  it('Schritt 2: kein x-Tag', () => {
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: null, nachweis })).toEqual({
      ok: false,
      grund: 'kein-x-tag'
    });
  });

  it('Schritt 3: kein Nachweis', () => {
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis: null })).toEqual({
      ok: false,
      grund: 'kein-nachweis'
    });
  });

  it('Schritt 4: Nachweis gehoert zu einem anderen Hash', () => {
    const fremd = { ...nachweis, hash: 'f'.repeat(64) };
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis: fremd })).toEqual({
      ok: false,
      grund: 'pflichtfeld-fehlt'
    });
  });

  it('Schritt 5: etag widerspricht', () => {
    expect(
      lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis, etag: '"deadbeef"' })
    ).toEqual({ ok: false, grund: 'hash-widerspruch' });
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

```bash
pnpm test src/lib/models/lizenz.test.js
```

Erwartet: FAIL, Modul fehlt.

- [ ] **Step 3: `src/lib/models/lizenz.js` schreiben**

```js
/**
 * Lizenznachweis nach ADR-0013.
 *
 * license und credit sind edufeed-Konvention, nicht NIP-94 — hier aber
 * Pflicht. Ohne beide gilt ein Nachweis als nicht vorhanden.
 *
 * @typedef {import('../services/relay.js').Event} Event
 */

/**
 * @typedef {object} Nachweis
 * @property {string} id
 * @property {string} hash
 * @property {string} url
 * @property {string|null} titel
 * @property {string} license
 * @property {string} credit
 * @property {string|null} mime
 */

/**
 * @typedef {{ ok: true, nachweis: Nachweis }
 *   | { ok: false, grund: Grund }} Ergebnis
 */

/**
 * @typedef {'kein-bild'|'relativ'|'kein-x-tag'|'kein-nachweis'
 *   |'pflichtfeld-fehlt'|'hash-widerspruch'} Grund
 */

/** @type {Record<Grund, string>} */
export const GRUND_TEXT = {
  'kein-bild': 'Kein Bild angegeben.',
  relativ:
    'Der Bildverweis ist relativ und ließe sich nur gegen WordPress auflösen.',
  'kein-x-tag': 'Am Artikel fehlt das x-Tag — ohne Hash ist kein Nachweis auffindbar.',
  'kein-nachweis': 'Zu diesem Bild wurde auf keinem Relay ein kind:1063 gefunden.',
  'pflichtfeld-fehlt': 'Der Nachweis ist unvollständig oder gehört zu einem anderen Bild.',
  'hash-widerspruch': 'Der Hash des ausgelieferten Bildes passt nicht zum Nachweis.'
};

/**
 * @param {string[][]} tags
 * @param {string} name
 * @returns {string|null}
 */
function tagWert(tags, name) {
  const treffer = tags.find((t) => t[0] === name && t.length > 1);
  return treffer ? treffer[1] : null;
}

/**
 * Wählt aus kind:1063-Events den gültigen Nachweis.
 *
 * Neuestes created_at gewinnt, Gleichstand nach id (ADR-0010).
 *
 * @param {Event[]} events
 * @returns {Nachweis|null}
 */
export function nachweisAusEvents(events) {
  /** @type {Nachweis[]} */
  const gueltige = [];

  for (const e of events ?? []) {
    const tags = e.tags ?? [];
    const license = tagWert(tags, 'license');
    const credit = tagWert(tags, 'credit');
    const hash = tagWert(tags, 'x');
    const url = tagWert(tags, 'url');
    // license und credit sind Pflicht (ADR-0013, Punkt 3).
    if (!license || !credit || !hash || !url) continue;

    gueltige.push({
      id: e.id,
      hash,
      url,
      titel: tagWert(tags, 'title'),
      license,
      credit,
      mime: tagWert(tags, 'm')
    });
  }

  if (gueltige.length === 0) return null;

  const nachAlter = [...gueltige].sort((a, b) => {
    const ea = events.find((e) => e.id === a.id);
    const eb = events.find((e) => e.id === b.id);
    const diff = (eb?.created_at ?? 0) - (ea?.created_at ?? 0);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  return nachAlter[0];
}

/**
 * Die Auflösungskette aus ADR-0013.
 *
 * Nur ok:true liefert ein Bild aus. Jeder andere Fall nennt seinen Grund,
 * damit die Redaktion weiß, was fehlt.
 *
 * @param {object} eingabe
 * @param {string|null} eingabe.bildUrl
 * @param {string|null} eingabe.bildHash
 * @param {Nachweis|null} eingabe.nachweis
 * @param {string} [eingabe.etag]  Blossom liefert den Hash als etag
 * @returns {Ergebnis}
 */
export function lizenzPruefen({ bildUrl, bildHash, nachweis, etag }) {
  if (!bildUrl) return { ok: false, grund: 'kein-bild' };

  // Schritt 1: absolut?
  if (!/^https?:\/\//.test(bildUrl)) return { ok: false, grund: 'relativ' };

  // Schritt 2: Hash am Artikel?
  if (!bildHash) return { ok: false, grund: 'kein-x-tag' };

  // Schritt 3: Nachweis gefunden?
  if (!nachweis) return { ok: false, grund: 'kein-nachweis' };

  // Schritt 4: Pflichtfelder da (in nachweisAusEvents geprüft) und
  // der Nachweis gehört zu diesem Bild?
  if (nachweis.hash !== bildHash) return { ok: false, grund: 'pflichtfeld-fehlt' };

  // Schritt 5: Hash gegen das gelieferte Bild, falls ein etag vorliegt.
  if (etag) {
    const sauber = etag.replace(/^W\//, '').replace(/"/g, '').trim();
    if (sauber !== bildHash) return { ok: false, grund: 'hash-widerspruch' };
  }

  return { ok: true, nachweis };
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

```bash
pnpm test src/lib/models/lizenz.test.js
```

Erwartet: 15 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/models/lizenz.js src/lib/models/lizenz.test.js
git commit -m "Lizenz-Kette nach ADR-0013 gibt den Abbruchgrund zurueck"
```

---

## Task 7: Markdown säubern und rendern

**Files:**
- Create: `src/lib/inhalt.js`, `src/lib/inhalt.test.js`

**Interfaces:**
- Consumes: `marked`
- Produces: `inhaltAufbereiten(markdown) → { html, entfernteBilder }` —
  `entfernteBilder` ist `string[]` der entfernten relativen Quellen.

- [ ] **Step 1: Failing test schreiben**

`src/lib/inhalt.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { inhaltAufbereiten } from './inhalt.js';

describe('inhaltAufbereiten', () => {
  it('entfernt relative Bilder und zaehlt sie', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      'Davor\n\n![](nosTr-schrein.jpg)\n\nDanach'
    );
    expect(entfernteBilder).toEqual(['nosTr-schrein.jpg']);
    expect(html).not.toContain('nosTr-schrein.jpg');
    expect(html).toContain('Davor');
    expect(html).toContain('Danach');
  });

  it('behaelt absolute Bilder', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      '![Alt](https://example.org/b.png)'
    );
    expect(entfernteBilder).toEqual([]);
    expect(html).toContain('https://example.org/b.png');
  });

  it('behaelt Blockquotes — bei FOERBICO sind es echte Zitate', () => {
    const { html } = inhaltAufbereiten('> Ein Zitat');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Ein Zitat');
  });

  it('rendert Ueberschriften und Links', () => {
    const { html } = inhaltAufbereiten('## Titel\n\n[Text](https://example.org)');
    expect(html).toContain('<h2');
    expect(html).toContain('href="https://example.org"');
  });

  it('vertraegt leeren Inhalt', () => {
    expect(inhaltAufbereiten('')).toEqual({ html: '', entfernteBilder: [] });
  });

  it('entfernt mehrere relative Bilder', () => {
    const { entfernteBilder } = inhaltAufbereiten('![](a.jpg)\n\n![](b/c.png)');
    expect(entfernteBilder).toEqual(['a.jpg', 'b/c.png']);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

```bash
pnpm test src/lib/inhalt.test.js
```

Erwartet: FAIL, Modul fehlt.

- [ ] **Step 3: `src/lib/inhalt.js` schreiben**

```js
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
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

```bash
pnpm test src/lib/inhalt.test.js
```

Erwartet: 6 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inhalt.js src/lib/inhalt.test.js
git commit -m "Markdown: relative Bilder entfernen und zaehlen, Zitate behalten"
```

---

## Task 8: Loader

**Files:**
- Create: `src/lib/loaders/artikel.js`, `src/lib/loaders/lizenz.js`

**Interfaces:**
- Consumes: `eventsHolen`, `eventsVonAllen` (Task 4); `artikelAusEvent` (Task 5); `nachweisAusEvents` (Task 6)
- Produces:
  - `artikelLaden({ adresse, relays }) → Promise<{ artikel: Artikel|null, gefragteRelays: string[], fehler: string[] }>`
  - `lizenzLaden({ hash, relays }) → Promise<{ nachweis: Nachweis|null, fehler: string[] }>`
  - `etagHolen(bildUrl) → Promise<string|undefined>`

Loader kennen **keinen** Speicher — damit ein Cache später als Schicht darüber passt (Spec).

- [ ] **Step 1: `src/lib/loaders/artikel.js` schreiben**

```js
import { artikelAusEvent } from '../models/artikel.js';
import { eventsVonAllen } from '../services/relay.js';

/**
 * @typedef {import('../naddr.js').Adresse} Adresse
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 */

/**
 * Lädt einen Artikel über seine naddr-Bestandteile.
 *
 * Gefragt werden die Relay-Hinweise aus dem naddr **und** die
 * konfigurierten Relays — ein Hinweis kann veraltet sein.
 *
 * @param {{ adresse: Adresse, relays: string[] }} eingabe
 * @returns {Promise<{ artikel: Artikel|null, gefragteRelays: string[], fehler: string[] }>}
 */
export async function artikelLaden({ adresse, relays }) {
  const gefragteRelays = [...new Set([...adresse.relays, ...relays])];

  const { events, fehler } = await eventsVonAllen(gefragteRelays, {
    kinds: [adresse.kind],
    authors: [adresse.author],
    '#d': [adresse.d]
  });

  if (events.length === 0) {
    return { artikel: null, gefragteRelays, fehler };
  }

  // Ersetzbare Events: das neueste gewinnt.
  const neuestes = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));
  return { artikel: artikelAusEvent(neuestes), gefragteRelays, fehler };
}
```

- [ ] **Step 2: `src/lib/loaders/lizenz.js` schreiben**

```js
import { nachweisAusEvents } from '../models/lizenz.js';
import { eventsVonAllen } from '../services/relay.js';

/** @typedef {import('../models/lizenz.js').Nachweis} Nachweis */

/**
 * Lädt den Lizenznachweis zu einem Bildhash.
 *
 * Fragt ALLE konfigurierten Relays — der Nachweis liegt nicht dort, wo
 * der Artikel liegt (ADR-0013, am Referenzfall geprüft: kind:1063 nur
 * auf relay-rpi.edufeed.org).
 *
 * @param {{ hash: string, relays: string[] }} eingabe
 * @returns {Promise<{ nachweis: Nachweis|null, fehler: string[] }>}
 */
export async function lizenzLaden({ hash, relays }) {
  const { events, fehler } = await eventsVonAllen(relays, {
    kinds: [1063],
    '#x': [hash]
  });
  return { nachweis: nachweisAusEvents(events), fehler };
}

/**
 * Holt den etag eines Bildes per HEAD, für Schritt 5 der Prüfkette.
 *
 * Blossom liefert den SHA-256 als etag — die Prüfung kostet damit keinen
 * Download. Scheitert die Anfrage, wird Schritt 5 übersprungen.
 *
 * @param {string} bildUrl
 * @returns {Promise<string|undefined>}
 */
export async function etagHolen(bildUrl) {
  try {
    const antwort = await fetch(bildUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return antwort.headers.get('etag') ?? undefined;
  } catch {
    return undefined;
  }
}
```

- [ ] **Step 3: Typprüfung**

```bash
pnpm check
```

Erwartet: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add src/lib/loaders/
git commit -m "Loader fuer Artikel und Lizenz, ohne Speicher"
```

---

## Task 9: Route — laden, zeigen, Fehler nennen

**Files:**
- Create: `src/routes/[naddr]/+page.server.js`, `src/routes/[naddr]/+page.svelte`
- Create: `src/lib/komponenten/Lizenzzeile.svelte`, `src/lib/komponenten/Bildbereich.svelte`
- Create: `src/routes/+error.svelte`
- Modify: `src/routes/+page.svelte` (Verweis auf den Referenzfall)

**Interfaces:**
- Consumes: alles aus Tasks 2–8
- Produces: eine Seite unter `/<naddr>`

- [ ] **Step 1: `src/routes/[naddr]/+page.server.js`**

```js
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { inhaltAufbereiten } from '$lib/inhalt.js';
import { konfigLesen } from '$lib/konfig.js';
import { naddrDekodieren } from '$lib/naddr.js';
import { artikelLaden } from '$lib/loaders/artikel.js';
import { etagHolen, lizenzLaden } from '$lib/loaders/lizenz.js';
import { lizenzPruefen } from '$lib/models/lizenz.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // Fehlt ein Pflichtwert, bricht es hier ab — nicht mit leerer Seite.
  const konfig = konfigLesen(env);

  let adresse;
  try {
    adresse = naddrDekodieren(params.naddr);
  } catch (ursache) {
    error(400, ursache instanceof Error ? ursache.message : 'Unlesbare Adresse.');
  }

  const { artikel, gefragteRelays, fehler } = await artikelLaden({
    adresse,
    relays: konfig.relays
  });

  if (!artikel) {
    if (fehler.length === gefragteRelays.length) {
      error(
        503,
        `Kein Relay hat geantwortet. Gefragt wurden: ${gefragteRelays.join(', ')}. ` +
          'Verbindung und RELAYS in der .env prüfen.'
      );
    }
    error(
      404,
      `Kein Artikel mit d="${adresse.d}" von ${adresse.author.slice(0, 12)}… gefunden. ` +
        `Gefragt wurden: ${gefragteRelays.join(', ')}.`
    );
  }

  const { nachweis } = artikel.bildHash
    ? await lizenzLaden({ hash: artikel.bildHash, relays: konfig.relays })
    : { nachweis: null };

  const etag =
    artikel.bildUrl && /^https?:\/\//.test(artikel.bildUrl)
      ? await etagHolen(artikel.bildUrl)
      : undefined;

  const lizenz = lizenzPruefen({
    bildUrl: artikel.bildUrl,
    bildHash: artikel.bildHash,
    nachweis,
    etag
  });

  const { html, entfernteBilder } = inhaltAufbereiten(artikel.inhalt);

  return {
    artikel: {
      titel: artikel.titel,
      zusammenfassung: artikel.zusammenfassung,
      veroeffentlicht: artikel.veroeffentlicht.toISOString(),
      themen: artikel.themen,
      bildUrl: artikel.bildUrl
    },
    lizenz,
    html,
    entfernteBilder
  };
}
```

- [ ] **Step 2: `src/lib/komponenten/Lizenzzeile.svelte`**

```svelte
<script>
  /** @type {{ nachweis: import('$lib/models/lizenz.js').Nachweis }} */
  let { nachweis } = $props();
</script>

<figcaption class="mt-2 text-sm" style="color: var(--rl-text-leise)">
  {#if nachweis.titel}<span>{nachweis.titel} — </span>{/if}
  <span>{nachweis.credit}</span>,
  <a href={nachweis.license} rel="license noopener" target="_blank">Lizenz</a>
</figcaption>
```

- [ ] **Step 3: `src/lib/komponenten/Bildbereich.svelte`**

Zeigt das Bild **nur** bei `ok` (ADR-0013). Sonst einen Hinweis, der den Grund nennt.

```svelte
<script>
  import { GRUND_TEXT } from '$lib/models/lizenz.js';
  import Lizenzzeile from './Lizenzzeile.svelte';

  /** @type {{ lizenz: import('$lib/models/lizenz.js').Ergebnis, titel: string }} */
  let { lizenz, titel } = $props();
</script>

{#if lizenz.ok}
  <figure class="my-6">
    <img
      src={lizenz.nachweis.url}
      alt={lizenz.nachweis.titel ?? titel}
      class="w-full rounded"
    />
    <Lizenzzeile nachweis={lizenz.nachweis} />
  </figure>
{:else if lizenz.grund !== 'kein-bild'}
  <p
    class="my-6 rounded border p-3 text-sm"
    style="border-color: var(--rl-linie); background: var(--rl-flaeche); color: var(--rl-text-leise)"
  >
    <strong>Bild nicht angezeigt.</strong> {GRUND_TEXT[lizenz.grund]}
  </p>
{/if}
```

- [ ] **Step 4: `src/routes/[naddr]/+page.svelte`**

```svelte
<script>
  import Bildbereich from '$lib/komponenten/Bildbereich.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  const datum = new Date(data.artikel.veroeffentlicht).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
</script>

<svelte:head>
  <title>{data.artikel.titel} — community-hub</title>
  <meta name="description" content={data.artikel.zusammenfassung} />
</svelte:head>

<article>
  <h1 class="text-3xl font-bold leading-tight">{data.artikel.titel}</h1>

  <p class="mt-2 text-sm" style="color: var(--rl-text-leise)">
    veröffentlicht am {datum}
  </p>

  {#if data.artikel.themen.length > 0}
    <ul class="mt-3 flex flex-wrap gap-2 text-xs">
      {#each data.artikel.themen as thema (thema)}
        <li class="rounded px-2 py-1" style="background: var(--rl-flaeche-2)">
          {thema}
        </li>
      {/each}
    </ul>
  {/if}

  <Bildbereich lizenz={data.lizenz} titel={data.artikel.titel} />

  {#if data.artikel.zusammenfassung}
    <p class="text-lg font-medium">{data.artikel.zusammenfassung}</p>
  {/if}

  <!-- Markdown aus dem Event; in inhalt.js gesäubert. -->
  <div class="inhalt mt-6">{@html data.html}</div>

  {#if data.entfernteBilder.length > 0}
    <p class="mt-8 text-sm" style="color: var(--rl-text-leise)">
      {data.entfernteBilder.length} Bildverweis{data.entfernteBilder.length === 1
        ? ''
        : 'e'} im Text
      {data.entfernteBilder.length === 1 ? 'wurde' : 'wurden'} nicht angezeigt:
      relative Pfade, die nur auf der alten Website auflösen.
    </p>
  {/if}
</article>

<style>
  .inhalt :global(h2) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 0.5rem;
  }
  .inhalt :global(p) {
    margin-bottom: 1rem;
    line-height: 1.7;
  }
  .inhalt :global(ul) {
    list-style: disc;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  .inhalt :global(li) {
    margin-bottom: 0.25rem;
  }
  .inhalt :global(blockquote) {
    border-left: 3px solid var(--rl-linie);
    padding-left: 1rem;
    font-style: italic;
    margin-bottom: 1rem;
  }
  .inhalt :global(img) {
    max-width: 100%;
    height: auto;
  }
</style>
```

**Zu `{@html}`:** Der Inhalt kommt aus einem signierten Event unserer
eigenen Quelle (`QUELLE_AUTOR`), nicht aus Nutzereingaben. `marked`
rendert kein Skript aus Markdown-Syntax; Roh-HTML im Event würde
durchgehen — im Bestand sind es drei `<br>`. Wenn die Quelle später
offener wird, muss hier ein Sanitizer davor.

- [ ] **Step 5: `src/routes/+error.svelte`**

```svelte
<script>
  import { page } from '$app/state';
</script>

<h1 class="text-2xl font-bold">Das hat nicht geklappt</h1>
<p class="mt-2 text-sm" style="color: var(--rl-text-leise)">Fehler {page.status}</p>
<p class="mt-4">{page.error?.message}</p>
```

- [ ] **Step 6: `src/routes/+page.svelte` um den Verweis ergänzen**

```svelte
<h1 class="text-2xl font-bold">community-hub</h1>
<p class="mt-4" style="color: var(--rl-text-leise)">
  Dieser Durchstich zeigt einen einzelnen Artikel unter seiner
  <code>naddr</code>-Adresse. Es gibt noch keine Übersicht.
</p>
<p class="mt-4">
  <a
    href="/naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj"
  >
    Beispiel: „Die Kraft der Gemeinschaft"
  </a>
</p>
```

- [ ] **Step 7: Alles prüfen und im Browser ansehen**

```bash
pnpm check
pnpm test
pnpm dev
```

Im Browser `http://localhost:5173/` öffnen, dem Verweis folgen. Erwartet:

- Titel „Die Kraft der Gemeinschaft: Wahre Stärke liegt nicht in Strukturen, sondern in Prozessen"
- Datum „3. September 2026" (`published_at` 1788433547)
- Bild 1500×1500 von `blossom.edufeed.org`
- darunter „nosTr-schrein — Comenius-Institut, Lizenz"
- Hinweis „1 Bildverweis im Text wurde nicht angezeigt"

**Ohne JavaScript prüfen** (ADR-0003): Im Browser JS abschalten, neu laden — der Text muss vollständig da sein.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Detailansicht: Artikel mit nachgewiesener Bildlizenz"
```

---

## Task 10: Auslieferung auf 46.225.82.96

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docs/betrieb.md`

**Interfaces:**
- Consumes: `pnpm build` → `build/index.js` (adapter-node)
- Produces: erreichbare Seite auf Port 80

**Stand des Servers** (geprüft 2026-09-03): Port 22 offen, 80/443/3000 zu, Reverse-DNS `static.96.82.225.46.clients.your-server.de` (Hetzner). **Was installiert ist, ist unbekannt** — Step 1 stellt es fest, statt es anzunehmen.

**Voraussetzung:** SSH mit Schlüssel. Aktuell wird der Schlüssel abgelehnt (`Permission denied (publickey,password)`). Der Nutzer führt einmal `ssh-copy-id joerg@46.225.82.96` aus. **Keine Passworteingabe durch den Agenten.**

- [ ] **Step 1: Server erkunden, nichts annehmen**

```bash
ssh joerg@46.225.82.96 'echo "=== System ==="; . /etc/os-release && echo "$PRETTY_NAME"; \
  echo "=== Werkzeuge ==="; for w in docker node pnpm git nginx caddy; do \
    printf "  %-8s %s\n" "$w" "$(command -v $w || echo fehlt)"; done; \
  echo "=== Rechte ==="; id; sudo -n true 2>/dev/null && echo "  sudo ohne Passwort" || echo "  sudo braucht Passwort"; \
  echo "=== Belegte Ports ==="; (ss -tlnp 2>/dev/null || netstat -tln) | head -15'
```

Ergebnis bestimmt Step 2. **Wenn `sudo` ein Passwort braucht:** anhalten und den Nutzer fragen — der Agent gibt keine Passwörter ein.

- [ ] **Step 2: `Dockerfile`**

```dockerfile
FROM node:22-alpine AS bau
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=bau /app/build ./build
COPY --from=bau /app/node_modules ./node_modules
COPY --from=bau /app/package.json ./
EXPOSE 3000
CMD ["node", "build/index.js"]
```

**Node 22 im Container**, obwohl lokal 20 läuft: Der Container baut mit
`pnpm build`, nicht mit Vitest — die Node-20-Bindung war nur wegen
Vitest 5 nötig, und Tests laufen lokal, nicht im Bau.

- [ ] **Step 3: `.dockerignore`**

```
node_modules
build
.svelte-kit
.git
.env
.env.sicherung-*
docs
mockup
test
*.test.js
```

- [ ] **Step 4: `docker-compose.yml`**

Kein Traefik: Es gibt eine Anwendung und keinen zweiten Dienst, der einen
Router bräuchte (mit dem Nutzer am 03.09. so entschieden). Der Container
hängt direkt auf Port 80.

```yaml
services:
  hub:
    build: .
    restart: unless-stopped
    ports:
      - '80:3000'
    environment:
      QUELLE_AUTOR: ${QUELLE_AUTOR}
      QUELLE_H_TAG: ${QUELLE_H_TAG:-}
      RELAYS: ${RELAYS}
      BLOSSOM_URL: ${BLOSSOM_URL}
      HOST: 0.0.0.0
      PORT: '3000'
```

- [ ] **Step 5: Docker sicherstellen, falls Step 1 es als fehlend meldet**

```bash
ssh joerg@46.225.82.96 'sudo apt-get update -qq && \
  sudo apt-get install -y -qq docker.io docker-compose-v2 && \
  sudo usermod -aG docker $USER && docker --version'
```

Nach `usermod` einmal neu anmelden, damit die Gruppe greift.

- [ ] **Step 6: Übertragen und starten**

`.env` wird **nicht** über `git` übertragen (steht in `.gitignore`), sondern einmalig per `scp`:

```bash
ssh joerg@46.225.82.96 'mkdir -p ~/community-hub'
git archive --format=tar HEAD | ssh joerg@46.225.82.96 'tar -x -C ~/community-hub'
scp .env joerg@46.225.82.96:~/community-hub/.env
ssh joerg@46.225.82.96 'cd ~/community-hub && docker compose up -d --build'
```

`git archive HEAD` überträgt nur Committetes — kein `node_modules`, keine `.env`, keine Arbeitskopie-Reste.

- [ ] **Step 7: Prüfen, dass es wirklich läuft**

```bash
curl -sS -o /dev/null -w 'Startseite: %{http_code}\n' http://46.225.82.96/
curl -sS http://46.225.82.96/naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj \
  | grep -c 'Comenius-Institut'
```

Erwartet: `200` und mindestens `1`. Das zweite Kommando ist der eigentliche Beweis: Die Lizenzzeile steht **im ausgelieferten HTML**, also wurde serverseitig gerendert und der Nachweis über zwei Relays aufgelöst.

Bei `000`: Firewall prüfen (`ssh … 'sudo ufw status'`) — Hetzner-Server haben oft eine aktive `ufw`.

- [ ] **Step 8: `docs/betrieb.md`**

```markdown
# Betrieb

**Server:** `46.225.82.96` (Hetzner) · **Zugang:** `ssh joerg@46.225.82.96`
· **Verzeichnis:** `~/community-hub` · **Port:** 80 → Container 3000

## Aktualisieren

    git archive --format=tar HEAD | ssh joerg@46.225.82.96 'tar -x -C ~/community-hub'
    ssh joerg@46.225.82.96 'cd ~/community-hub && docker compose up -d --build'

`git archive HEAD` überträgt nur Committetes.

## Konfiguration

`.env` liegt **nur** auf dem Server, nicht im Repository. Bei Änderung
neu übertragen und `docker compose up -d` erneut ausführen.

## Nachsehen, wenn etwas fehlt

    ssh joerg@46.225.82.96 'cd ~/community-hub && docker compose logs --tail=50'

Die Lizenz-Kette schreibt ihren Abbruchgrund in die Antwort, nicht ins
Log — ein fehlendes Bild steht als Hinweis auf der Seite.

## Kein Traefik, kein TLS

Am 03.09.2026 bewusst weggelassen: eine Anwendung, kein zweiter Dienst.
**Damit läuft es über HTTP.** Für eine öffentliche Adresse braucht es
einen Namen und ein Zertifikat — dann wird ein Reverse-Proxy fällig.
```

- [ ] **Step 9: Commit**

```bash
git add Dockerfile .dockerignore docker-compose.yml docs/betrieb.md
git commit -m "Auslieferung per Docker auf 46.225.82.96"
```

---

## Task 11: Abschluss

- [ ] **Step 1: Alles prüfen**

```bash
pnpm check && pnpm test
```

Erwartet: keine Typfehler, alle Tests grün (37 Tests aus Tasks 2, 3, 5, 6, 7).

`pnpm lint` und `pnpm test:e2e` aus CLAUDE.md gibt es in diesem Durchstich **nicht** — kein ESLint, kein Playwright eingerichtet. Das ist eine bekannte Lücke, siehe Step 3.

- [ ] **Step 2: STATUS.md ergänzen**

Neuen Eintrag oben (nach dem `---`), im Format der bestehenden: Was ist passiert, wo steht das Projekt, was ist der nächste Schritt. Inhalt: erster Code, eine Route, Referenzfall läuft auf dem Server; Cache-Abweichung ist offen; Liste und Startseite folgen.

- [ ] **Step 3: Offene Punkte in STATUS.md notieren**

- **Cache fehlt** — befristete Abweichung, fällig mit der ersten Liste
- **`pnpm lint` und `test:e2e` fehlen** — CLAUDE.md fordert sie vor jedem Merge
- **Kein TLS** — Auslieferung über HTTP
- **Kein Mock-Relay** — Tests deckem die Loader nicht ab
- **Schritt 5 der Lizenz-Kette** wird ohne `etag` übersprungen

- [ ] **Step 4: Commit und Push**

```bash
git add docs/STATUS.md
git commit -m "STATUS: erster Durchstich laeuft, offene Punkte notiert"
git push origin dev
```

---

## Self-Review

**Spec-Deckung:**

| Spec-Abschnitt | Task |
|---|---|
| Erwartetes Ergebnis | 9 (Step 7) |
| Abweichung Cache | Global Constraints, 11 Step 3 |
| Aufbau | File Structure, Tasks 1–9 |
| Datenfluss | 9 Step 1 |
| Lizenz-Kette (5 Schritte) | 6 |
| Markdown säubern | 7 |
| Fehlerfälle (5 Fälle) | 2 (Env), 9 (400/404/503), 6 (Grund) |
| Tests | 2, 3, 5, 6, 7 |
| Technik | 1 |
| Nicht dabei | eingehalten; Docker kam auf Wunsch dazu |

**Abweichung von der Spec:** Docker und Auslieferung waren als „nicht
dabei" notiert. Der Nutzer hat am 03.09. ausdrücklich „schnell zu einer
Echtzeit-Version auf dem Server" verlangt — daher Task 10. Traefik
bleibt weg (Nutzerentscheidung), TLS damit auch.

**Namensabgleich:** `konfigLesen`, `naddrDekodieren`, `eventsHolen`,
`eventsVonAllen`, `artikelAusEvent`, `nachweisAusEvents`,
`lizenzPruefen`, `GRUND_TEXT`, `inhaltAufbereiten`, `artikelLaden`,
`lizenzLaden`, `etagHolen` — in Definition und Verwendung identisch
geprüft.

**Grund-Werte** identisch in `lizenz.js`, `GRUND_TEXT`, Tests und
`Bildbereich.svelte`: `kein-bild`, `relativ`, `kein-x-tag`,
`kein-nachweis`, `pflichtfeld-fehlt`, `hash-widerspruch`.
