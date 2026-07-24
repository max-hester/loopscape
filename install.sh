#!/usr/bin/env bash
# Loopscape skill installer -- installs the loop-visualizer skill for Claude Code and Codex CLI.
# Runs entirely on your machine. Nothing is uploaded.
set -eu

REPO="https://github.com/max-hester/loopscape"
BRANCH="main"
CLAUDE_DIR="${HOME}/.claude/skills/loopscape"
CODEX_DIR="${HOME}/.agents/skills/loopscape"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Loopscape skill installer"

if command -v git >/dev/null 2>&1; then
  git clone --depth 1 --branch "$BRANCH" "${REPO}.git" "$TMP/repo" >/dev/null 2>&1
  SRC="$TMP/repo/skills/loopscape"
else
  echo "  git not found -- downloading tarball..."
  curl -fsSL "${REPO}/archive/refs/heads/${BRANCH}.tar.gz" | tar -xz -C "$TMP"
  SRC="$(find "$TMP" -type d -path '*/skills/loopscape' | head -1)"
fi

[ -f "$SRC/SKILL.md" ] || { echo "error: skill not found in download" >&2; exit 1; }

install_to () { mkdir -p "$(dirname "$1")"; rm -rf "$1"; cp -R "$SRC" "$1"; echo "  installed -> $1"; }

echo "Claude Code:"; install_to "$CLAUDE_DIR"
echo "Codex CLI:";   install_to "$CODEX_DIR"

cat <<'EOF'

Done. Try it:
  Claude Code / Codex prompt:  "Use the loopscape skill to visualize the loops in <file> and export a GIF of each."

Note: the headless renderer (scripts/render.mjs) needs Node + Playwright:
  npm i playwright && npx playwright install chromium
EOF
