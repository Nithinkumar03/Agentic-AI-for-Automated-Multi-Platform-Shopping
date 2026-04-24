#!/usr/bin/env bash
# Use from the backend directory:
#   source ./activate-venv-bash.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd)"
if [[ -f "$HERE/.venv/Scripts/activate" ]]; then
  # Windows venv layout
  # shellcheck source=/dev/null
  . "$HERE/.venv/Scripts/activate"
elif [[ -f "$HERE/.venv/bin/activate" ]]; then
  # Unix venv layout
  # shellcheck source=/dev/null
  . "$HERE/.venv/bin/activate"
else
  echo "No venv found at $HERE/.venv" >&2
  return 1
fi
