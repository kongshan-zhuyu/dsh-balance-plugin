#!/usr/bin/env bash
set -euo pipefail
source_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v dsh >/dev/null || { echo "dsh command was not found. Install @deepseek-ai/dsh first." >&2; exit 1; }
dsh plugin --profile web add "$source_root/packages/dsh-bundle-balance"
printf 'Installed the DSH balance bundle to the web profile. Restart dsh web.\n'