# ADR-0005: Eigenes Relay unter relay.relilab.org oder Edufeed-Relay weiternutzen

**Status:** offen
**Beteiligte:** Jörg, Steffen (Docker-Frage), intranda (Subdomain/Hosting)

## Kontext

`relay.relilab.org` existiert noch nicht (leeres Apache-Dokument,
fremdes Zertifikat); alles läuft gegen `relay.edufeed.org`. Zwei
Optionen aus der Besprechung vom 02.09.2026: **Plan A** eigenes Relay
(favorisiert), **Plan B** Edufeed-Relay weiternutzen — Spiegelung ist
in beiden Fällen möglich.

## Entscheidung

Favorisiert ist Plan A. Zur Entscheidung fehlt: welche Relay-Software
docker-fähig und wartbar ist → **Steffen anfragen**; Hosting-Ort
(Kandidat: „kanban" bei intranda).

## Recherche (02.09.2026)

Die edufeed-app-CLAUDE.md (git.edufeed.org, `main`) dokumentiert die
edufeed-Relay-Landschaft: ein Relay **pro Inhaltstyp** (Kalender, AMB
`amb-relay.edufeed.org`, Longform, Kanban, Groups `groups.edufeed.org`),
konfiguriert per Env-Variablen — plus `relay.edufeed.org` und
`relay-rpi.edufeed.org` aus der FOERBICO-Pipeline. Bei Plan A wäre zu
entscheiden, ob relilab ein einzelnes Relay reicht oder das
Pro-Inhaltstyp-Muster übernommen wird.

## Konsequenzen

- Die Relay-Adresse ist Konfiguration, kein Code — der Client ist von
  dieser Entscheidung nicht blockiert.
- Bei Plan B bleibt die Abhängigkeit von der edufeed-Infrastruktur
  bestehen und gehört dann in die Betriebsdoku.
