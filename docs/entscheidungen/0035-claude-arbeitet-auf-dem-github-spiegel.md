# ADR-0035: Claude arbeitet auf dem GitHub-Spiegel, gemergt wird auf Forgejo

**Status:** angenommen (2026-09-30)
**Beteiligte:** Jörg

## Kontext

Haupt-Repository ist `git.rpi-virtuell.de/Comenius-Institut/oer-community`
(Forgejo); `github.com/rpi-virtuell/oer-community` ist nur sein Spiegel.
Claude (Slack, Claude Code im Web) erreicht nur GitHub, nicht Forgejo.
Zur Wahl standen: Branches von Hand vom Spiegel holen und auf Forgejo
pushen, auf GitHub mergen, oder die Branches automatisch übertragen.

## Entscheidung

Wir lassen Claude auf `feat/<thema>`-Branches im GitHub-Spiegel arbeiten;
der Workflow `.github/workflows/nach-forgejo.yml` pusht jeden `feat/**`-Branch
nach Forgejo, und **gemergt wird ausschließlich auf Forgejo** (nach `dev`,
dann `main`). Der Spiegel bringt den Stand zurück nach GitHub.

Ablauf:

1. Claude pusht `feat/<thema>` auf GitHub (Branch von `dev` aus).
2. Der Workflow überträgt den Branch unverändert nach Forgejo.
3. Jörg prüft und mergt auf Forgejo; `main` bekommt die Änderung erst dort.
4. Forgejo spiegelt `dev` und `main` zurück nach GitHub.

Regeln:

- **`main` und `dev` werden nie von GitHub aus beschrieben** — der Workflow
  überträgt nur `feat/**`. Ein PR auf GitHub dient höchstens als
  Review-Ort und wird geschlossen, nie dort gemergt; sonst laufen beide
  Repositories auseinander.
- Zugang: Repository-Secret `FORGEJO_TOKEN` (Forgejo-Token mit
  `write:repository`) und Repository-Variable `FORGEJO_USER` im
  GitHub-Repository — bewusst nicht als Organisations-Secret, damit der
  Token nur für dieses Repository gilt.

## Konsequenzen

- Claude kann selbstständig entwickeln, ohne Zugang zu Forgejo; die
  Freigabe bleibt bei den Menschen auf Forgejo, Woodpecker und Deploy
  bleiben unberührt.
- Ist die Spiegelung ein Forgejo-Push-Mirror, überschreibt er GitHub bei
  jedem Lauf. Weil jeder `feat/**`-Branch vorher auf Forgejo liegt, geht er
  dabei nicht verloren; ein Branch, dessen Übertragung scheiterte, schon.
  Schlägt der Workflow fehl, zuerst Token und Variable prüfen.
- Falsch war die Entscheidung, wenn auf GitHub Änderungen landen, die
  Forgejo nie sieht — dann GitHub-Branchschutz für `main`/`dev` setzen oder
  Claude direkten Forgejo-Zugang geben und diese ADR ersetzen.
