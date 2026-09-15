# ADR-0034: Termine kommen aus der Community — Quelle je Inhaltsart

**Status:** angenommen (2026-09-15, Besprechung Jörg, Gina, Ludger)
**Beteiligte:** Jörg, Gina, Ludger

Ergänzt ADR-0012 (FOERBICO als Quelle) und nimmt für Termine die
Einschränkung aus ADR-0026 zurück („Termine entfallen").

## Kontext

ADR-0026 hat Termine aus dem Zuschnitt genommen, weil FOERBICO selbst keine
publiziert. Inzwischen liegt die Abschlusstagung „Offen. Vernetzt.
Zukunft." (2. bis 3. Februar 2027, Frankfurt) als NIP-52-Event auf dem
Relay — angelegt von Phillip in der edufeed-app, `kind:31922`, mit dem
`h`-Tag der Communikey-Community **rpi-virtuell**
(`ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2`).
FOERBICO ist in dieser Community Publisher neben den anderen Mitgliedern;
derselbe `h`-Tag steht an einem FOERBICO-Artikel.

Die Besprechung am 15.09.2026 hat festgelegt: Für Artikel und Seiten
bleibt der FOERBICO-Key die Quelle. Für Termine, später auch Material,
Lesezeichen und Sammlungen, ist die Community rpi-virtuell die Quelle.
Zuerst wird das oer.community-Schaufenster fertig gebaut (Repository und
Adresse werden zu `oer-community` umbenannt); der eigentliche Community-Hub
folgt danach auf diesen Erfahrungen.

## Entscheidung

1. **Quelle je Inhaltsart.** Artikel, Seiten, Listen, Profil: der
   FOERBICO-Key (`QUELLE_AUTOR`, ADR-0012). Termine: die Community
   (`COMMUNITY_PUBKEY`, Standard rpi-virtuell; leer schaltet den Kalender
   ab). Der Spiegel holt `kind:31922` und `31923` mit `#h` der Community.
2. **Zwei Kriterien, wie ADR-0012 es für Bot-Quellen verlangt.** Ein
   Termin erscheint, wenn er den `h`-Tag trägt **und** sein Autor im
   Redaktionskreis steht (`kind:30000`, `d = redaktion`, unter dem
   FOERBICO-Key) — oder FOERBICO bzw. der Community-Key selbst ist. Der
   `h`-Tag allein ließe jeden herein, der ihn setzt. Wenn der Hub die
   Publisher-Rolle der Community lesen kann, ersetzt sie den Redaktionskreis.
3. **Zwei Ansichten, keine Eingabe.** `/termine` zeigt kommende Termine
   (`start` aufsteigend) und vergangene (`start` absteigend); die Startseite
   zeigt bis zu drei kommende unter ihrem Text. Anmelden, Zusagen und
   Bearbeiten geschieht in der edufeed-app; der Hub verlinkt dorthin
   (`EDUFEED_URL/calendar/event/<naddr>`).
4. **Der Menüpunkt „Termine" und der Startseitenblock erscheinen nur,
   wenn es Termine gibt.** `/termine` ohne Termine erklärt, welche Events
   erwartet werden (ADR-0027, Muster Struktur-Befund).
5. **Bilder von Terminen** folgen ADR-0022 und ADR-0032: ausgeliefert mit
   Lizenzpille; abgelöste Hosts nicht (ADR-0030). Das Bild der Tagung liegt
   auf einem Fremdhost und erscheint deshalb mit „Lizenz ungeklärt".

## Konsequenzen

- CLAUDE.md: Termine sind wieder im Zuschnitt, aber mit anderer Quelle als
  Artikel. Kinds `31922`/`31923` kommen zurück in die Kind-Liste, mit
  Sortierregel.
- Die Redaktionsliste ist damit doppelt bedeutsam: Freigabe von Beiträgen
  (ADR-0021) und Sichtbarkeit von Terminen. Wer Termine einreichen soll,
  muss in der Liste stehen — `mdparser sync redaktion` publiziert sie.
- **Woran wir merken, dass es falsch war:** Wenn Community-Mitglieder außerhalb
  des Redaktionskreises Termine einreichen und sich wundern, dass sie fehlen
  — dann ist die Publisher-Rolle der Community die richtige Quelle, nicht eine
  längere Liste.
