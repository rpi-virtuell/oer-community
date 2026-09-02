# ADR-0001: Eigenes Projekt, nicht Fork und nicht Deployment-Variante der edufeed-app

**Status:** angenommen (2026-08-31)
**Beteiligte:** Jörg

## Entscheidung

Wir bauen `relilab-client` als eigenes Repository mit dem Stack der
edufeed-app — kein Fork, keine Konfigurationsvariante.

## Begründung

Spec „Die vier Entscheidungen", Abschnitt 1: edufeed-app hat 277.000
Zeilen und 548 Komponenten, das Schaufenster braucht ~15; das
Design-Whitelabeling ist rudimentär. 95 % per Flag stillzulegen ist
teurer als ein Neubau.
