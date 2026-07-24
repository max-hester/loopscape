---
name: loopscape
description: Visualize a loop from source code as an animated diagram and export it as an image or GIF. Use when the user asks to "visualize a loop", wants "loop visualization", asks to "show how this loop runs", or wants to "make a gif of this loop". Renders any for/while/nested loop six ways (Flow, Flowchart, Helix 3D, Timeline, Array, Spiral) and exports PNG/SVG/WebM/GIF locally, no network.
---

# Loopscape -- loop visualizer

Loopscape is a self-contained HTML tool that renders a program's loop as an animated diagram and exports it. It runs fully local in a headless browser; nothing leaves the machine.

## What it can do

- **Six styles** (`data-k` values): `flow` (Flow -- each iteration a glowing particle), `flowchart` (token traced across the control-flow graph), `helix` (Helix 3D), `timeline` (Timeline), `array` (Array cells), `spiral` (Spiral).
- **Six themes** (`data-k` values): `aurora`, `plasma`, `iridescent`, `sunset`, `cyber`, `terminal`.
- **Four export formats**: PNG frame (`#expPng`), SVG diagram (`#expSvg`, flowchart only), WebM video (`#expVid`), animated GIF (`#expGif`).

## Built-in loop programs (`#prog` values + params)

The tool ships six parameterized loop archetypes. Map the user's loop to the closest one:

| prog key | shape | params (key, default, range) |
|---|---|---|
| `forsum` | `for` accumulate sum | `n` 12 (1-40), `step` 1 (1-5) |
| `whilehalve` | `while` halving | `n` 1000 (2-100000) |
| `nested` | nested double loop | `R` 5 (1-12), `C` 6 (1-14) |
| `bubble` | bubble sort | `n` 9 (3-20), `seed` 7 (1-99) |
| `search` | linear search | `n` 14 (3-30), `target` 42 (0-99) |
| `fib` | fibonacci | `n` 14 (2-40) |

## Procedure

1. **Locate the tool.** It is bundled at `assets/loopscape.html` inside this skill directory. Do not fetch it from the network.
2. **Identify each loop in the target source file.** For every loop, note its kind (for / while / nested / sort / search / sequence) and its trip count or bound, and pick the closest `prog` key above. Set params so the visualization's size roughly matches the real loop (e.g. a `for i in range(20)` -> `forsum` with `n=20`).
3. **Pick a style + theme.** Default to `flow` + `aurora`. Prefer `flowchart` when the user wants control-flow / branching clarity, `array` or `bubble`+`array` for sorting/array loops, `helix` or `spiral` for long iterative sequences, `timeline` for step-by-step. Any theme works; `terminal` reads well in docs, `cyber`/`plasma` for vivid GIFs.
4. **Export.** Run `scripts/render.mjs` (headless Playwright) to produce a PNG or GIF without opening a window. For interactive exploration or WebM, open `assets/loopscape.html` in a browser instead. See the usage comment at the top of `render.mjs`.
5. **Save outputs** to an output folder (default `./loopscape-out/`), naming each file after the source loop, e.g. `loopscape-out/parse_tokens_flow.gif`.

## Render script quick reference

```
node scripts/render.mjs --prog forsum --params '{"n":20}' \
  --style flow --theme aurora --format gif \
  --out ./loopscape-out/my_loop.gif
```

Flags: `--prog`, `--params` (JSON, optional), `--style`, `--theme`, `--scrub` (0-1000 frame position for PNG, default 600), `--format` (`png`|`gif`), `--out`. The script resolves Playwright from the user's `node_modules`; run it from a directory under the user's home if resolution fails.
