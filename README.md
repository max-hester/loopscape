# Loopscape

**See your loops actually run.** Loopscape is a single, self-contained HTML tool that visualizes program loops seven ways -- a glowing particle **Flow** ring, a control-flow **Flowchart**, an orbitable multi-strand **Helix 3D**, a named-process **Agents** flow, plus **Timeline**, **Array**, and **Spiral** -- in six color themes, and exports every one to PNG, SVG, WebM video, or animated GIF. No build step, no dependencies, no network.

This repo packages Loopscape as an **Agent Skill** so Claude Code and Codex can generate visualizations of the loops in *your* code, from your terminal.

Live demo: https://loopscape-landing.vercel.app/

## Install

**Claude Code** (via the Skills CLI):

```bash
npx skills add max-hester/loopscape@loopscape -g -y
```

**Claude Code or Codex** (one-liner, installs into `~/.claude/skills` and `~/.agents/skills`):

```bash
curl -fsSL https://raw.githubusercontent.com/max-hester/loopscape/main/install.sh | sh
```

**Manual:** copy `skills/loopscape/` into `~/.claude/skills/loopscape` (Claude Code) or `~/.agents/skills/loopscape` (Codex).

## Use

Ask your agent, in a repo with loops:

> Use the loopscape skill to visualize the loops in `src/foo.ts` and export a GIF of each.

The skill opens the bundled tool, picks a fitting visualization style and theme per loop, and exports stills/GIFs to an output folder.

## What's in here

```
skills/loopscape/
  SKILL.md                 the Agent Skill (instructions + triggers)
  assets/loopscape.html    the self-contained visualizer
  scripts/render.mjs       headless Playwright PNG/GIF exporter
install.sh                 remote installer for Claude Code + Codex
```

## Notes

- The headless renderer needs Node + Playwright: `npm i playwright && npx playwright install chromium`.
- The tool itself is dependency-free and runs offline in any modern browser -- just open `skills/loopscape/assets/loopscape.html`.
- This is a local handoff: the skill runs on your machine through your own agent. Nothing is uploaded.
