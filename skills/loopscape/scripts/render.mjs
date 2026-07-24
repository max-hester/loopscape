#!/usr/bin/env node
/*
 * render.mjs -- headless PNG/GIF exporter for the Loopscape loop visualizer.
 *
 * Drives the bundled assets/loopscape.html in headless Chromium (Playwright)
 * and writes a still frame (PNG) or an animated GIF. Fully local; no network.
 *
 * USAGE
 *   node render.mjs --prog forsum --style flow --theme aurora \
 *                   --format gif --out ./loopscape-out/my_loop.gif
 *
 *   node render.mjs --prog bubble --params '{"n":12,"seed":7}' \
 *                   --style array --theme cyber --format png --scrub 700 \
 *                   --out ./loopscape-out/sort.png
 *
 * FLAGS
 *   --prog    program key: forsum | whilehalve | nested | bubble | search | fib   (default forsum)
 *   --params  JSON object of loop params, e.g. '{"n":20,"step":2}'                (optional)
 *   --style   flow | flowchart | helix | timeline | array | spiral                (default flow)
 *   --theme   aurora | plasma | iridescent | sunset | cyber | terminal            (default aurora)
 *   --format  png | gif                                                           (default png)
 *   --scrub   0-1000 timeline position for the PNG frame                          (default 600)
 *   --out     output file path                                          (default ./loopscape-out/loopscape.<ext>)
 *   --html    path to loopscape.html                          (default ../assets/loopscape.html next to this script)
 *
 * NOTES
 *   Playwright is resolved from the caller's node_modules. On this setup it lives
 *   at /home/<user>/node_modules, so run the script from a directory under the
 *   home folder (or set NODE_PATH) if the import fails.
 */

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { a[t.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
  }
  return a;
}

// param input order per program (the tool renders one number input per param, in this order)
const PARAM_ORDER = {
  forsum: ['n', 'step'], whilehalve: ['n'], nested: ['R', 'C'],
  bubble: ['n', 'seed'], search: ['n', 'target'], fib: ['n'],
};

const args = parseArgs(process.argv.slice(2));
const here = path.dirname(fileURLToPath(import.meta.url));

const prog   = args.prog   || 'forsum';
const style  = args.style  || 'flow';
const theme  = args.theme  || 'aurora';
const format = (args.format || 'png').toLowerCase();
const scrub  = args.scrub != null ? parseInt(args.scrub, 10) : 600;
const params = args.params ? JSON.parse(args.params) : {};
const htmlPath = args.html ? path.resolve(args.html) : path.resolve(here, '..', 'assets', 'loopscape.html');
const ext = format === 'gif' ? 'gif' : 'png';
const outPath = path.resolve(args.out || `./loopscape-out/loopscape_${prog}_${style}.${ext}`);

if (!fs.existsSync(htmlPath)) { console.error('loopscape.html not found at', htmlPath); process.exit(1); }
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const fileUrl = pathToFileURL(htmlPath).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(fileUrl, { waitUntil: 'load' });
await page.waitForTimeout(400);

const optCount = await page.$$eval('#prog option', o => o.length);
if (optCount === 0) { console.error('boot failed -- UI never populated'); await browser.close(); process.exit(1); }

// program (fires rebuild), then params, then style + theme
await page.selectOption('#prog', prog);
await page.waitForTimeout(120);

if (Object.keys(params).length) {
  const keys = PARAM_ORDER[prog] || [];
  await page.evaluate(({ p, keys }) => {
    const inputs = document.querySelectorAll('#params label input');
    keys.forEach((k, i) => {
      if (p[k] == null || !inputs[i]) return;
      inputs[i].value = String(p[k]);
      inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
    });
  }, { p: params, keys });
  await page.waitForTimeout(120);
}

await page.click(`#styles button[data-k="${style}"]`);
await page.click(`#themes button[data-k="${theme}"]`);
await page.waitForTimeout(150);

if (format === 'gif') {
  const bytes = await page.evaluate(async () => {
    let captured = null;
    window.download = (blob) => { captured = blob; };            // intercept the download
    await window.gifExport(document.getElementById('expGif'));   // run the inline GIF89a encoder
    if (!captured) throw new Error('no GIF blob captured');
    return Array.from(new Uint8Array(await captured.arrayBuffer()));
  });
  fs.writeFileSync(outPath, Buffer.from(bytes));
} else {
  await page.$eval('#scrub', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, scrub);
  await page.waitForTimeout(250);
  await page.locator('.screen').screenshot({ path: outPath });
}

await browser.close();
if (errors.length) console.error('runtime warnings:', errors);
console.log('wrote', outPath);
