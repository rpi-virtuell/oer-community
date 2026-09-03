#!/usr/bin/env bash
# Liefert den committeten Stand auf den Entwicklungsserver aus — ohne root.
#
# Der Server hat kein Docker und sudo verlangt ein Passwort; darum Node im
# Home und systemd --user. Siehe docs/betrieb.md.
set -euo pipefail

ZIEL="${ZIEL:-joerg@46.225.82.96}"
SCHLUESSEL="${SCHLUESSEL:-$HOME/.ssh/id_cihacker}"
FERN="${FERN:-community-hub}"
SSH=(ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$SCHLUESSEL" "$ZIEL")

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Arbeitskopie ist nicht sauber — es wird nur Committetes ausgeliefert." >&2
  echo "Nicht committete Aenderungen bleiben zurueck. Weiter mit ERZWINGEN=1." >&2
  [[ "${ERZWINGEN:-0}" == "1" ]] || exit 1
fi

echo "== Stand uebertragen (nur Committetes) =="
"${SSH[@]}" "mkdir -p ~/$FERN"
git archive --format=tar HEAD | "${SSH[@]}" "tar -x -C ~/$FERN"

echo "== Konfiguration uebertragen =="
scp -o BatchMode=yes -o IdentitiesOnly=yes -i "$SCHLUESSEL" .env "$ZIEL:~/$FERN/.env"
"${SSH[@]}" "chmod 600 ~/$FERN/.env"

echo "== Bauen =="
"${SSH[@]}" "export PATH=\$HOME/.local/node/bin:\$PATH && cd ~/$FERN && \
  pnpm install --frozen-lockfile && pnpm build"

echo "== Dienst einrichten und starten =="
"${SSH[@]}" "mkdir -p ~/.config/systemd/user && \
  cp ~/$FERN/betrieb/community-hub.service ~/.config/systemd/user/ && \
  loginctl enable-linger \$USER && \
  systemctl --user daemon-reload && \
  systemctl --user enable community-hub && \
  systemctl --user restart community-hub && \
  sleep 3 && systemctl --user is-active community-hub"

echo "== Prüfen =="
"${SSH[@]}" "curl -sS -o /dev/null -w 'Startseite auf dem Server: %{http_code}\n' http://127.0.0.1:8080/"
echo
echo "Die Firewall vor dem Server laesst nur Port 22 durch."
echo "Ansehen per Tunnel:"
echo "  ssh -L 8080:localhost:8080 -i $SCHLUESSEL $ZIEL"
echo "  dann http://localhost:8080/ im Browser"
