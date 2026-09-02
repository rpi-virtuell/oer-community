# ADR-0007: SvelteKit bleibt — das Schaufenster ist der Keim des Community Hubs

**Status:** angenommen (2026-09-02)
**Beteiligte:** Jörg

## Kontext

Aus dem Zuschnitt (vier lesende Ansichten, serverseitig gerendert, keine
Relay-Verbindung im Browser, kein Login — ADR-0003) folgte die Frage, ob
ein reaktives Framework überhaupt gebraucht wird. Geprüft wurden drei
Optionen: **Astro** (SSR per Default, JS nur für die zwei Bedienelemente),
**kein Framework** (Deno-Skript rendert statisches HTML, wie
`mdparser`/`oer-site-builder` in der FOERBICO-Pipeline), und
**SvelteKit beibehalten**.

Das Argument gegen SvelteKit: Seine Kernfähigkeit — Zustand im Browser,
der die Oberfläche mitführt — ist durch ADR-0003 ausgeschlossen. Das
Argument aus ADR-0001 für den gemeinsamen Stack ist zudem schwächer als
angenommen: edufeed-app hat kein `src/lib/nostr/` (ADR-0002), der
Code-Wanderweg ist schmal; was real wandert, sind Applesauce-Aufrufe und
Nostr-Konventionen — beides framework-unabhängig.

## Entscheidung

Wir bleiben bei **SvelteKit 2 + Svelte 5 (Runes)**.

Damit ist zugleich die dahinterliegende Frage beantwortet: Das
Schaufenster ist **nicht** nur ein Schaufenster, sondern der Keim des
Community Hubs. ADR-0003 (Server rendert, Client übernimmt danach) ist
eine **Startbedingung, kein Dauerzustand** — Login, RSVP, Materialpool
dürfen später dazukommen, ohne dass das Fundament getauscht wird.

## Konsequenzen

- Die Stack-Nähe zu edufeed-app zahlt sich erst später aus; sie ist
  jetzt eine Wette auf den Ausbau, keine unmittelbare Ersparnis.
- ADR-0003 bekommt eine Ablaufbedingung: Sobald eine Ansicht echten
  Browser-Zustand braucht, wird sie durch eine neue ADR abgelöst — nicht
  stillschweigend unterlaufen. Bis dahin gilt sie unverändert.
- Die KI-Vorgaben (Skills, Prompts) sind auf Svelte 5 Runes und
  Playwright auszurichten; die Fallen-Sammlung der edufeed-app-CLAUDE.md
  ist dafür die beste vorhandene Quelle.
- Applesauce ist gesetzt, inklusive `mcp.applesauce.build` und
  nostrbook.dev bei der Entwicklung (siehe ADR-0008).
