# ADR-0008: Edufeed-Relays nutzen und spiegeln, statt eigenes Relay aufzusetzen

**Status:** angenommen (2026-09-02) · ersetzt ADR-0005
**Beteiligte:** Jörg

## Kontext

ADR-0005 hielt zwei Optionen offen: Plan A eigenes Relay unter
`relay.relilab.org` (favorisiert), Plan B Edufeed-Relay weiternutzen.
Offen war, welche Relay-Software docker-fähig ist (Frage an Steffen).

In der Besprechung wurde festgestellt: Die Infrastruktur **ist bereits
da** — `relay.edufeed.org` und `amb-relay.edufeed.org` laufen. Ein
Spiegel ist der günstigere Weg als ein Neuaufbau.

## Entscheidung

Wir nutzen die bestehenden Edufeed-Relays und richten bei Bedarf einen
**Spiegel** ein. Kein eigenes Relay unter `relay.relilab.org` zum Start.

## Konsequenzen

- Die Frage an Steffen nach docker-fähiger Relay-Software entfällt für
  den Start; sie kehrt zurück, wenn der Spiegel eigenständig betrieben
  werden soll.
- Die Abhängigkeit von der Edufeed-Infrastruktur ist bewusst eingegangen
  und gehört in die Betriebsdokumentation.
- Die Relay-Adresse bleibt Konfiguration, kein Code — ein späterer
  Wechsel auf `relay.relilab.org` ist eine Env-Änderung.
