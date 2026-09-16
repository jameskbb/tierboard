// Renders docs/readme-title-tierboard.png from title-card.html.
//
//   npm i -g playwright && npx playwright install chromium
//   node docs/src/render-title-card.mjs
//
// 1200x440 at 2x, matching the title-card convention used by the other repos.
// Set CHROMIUM_PATH to override the browser binary (some Playwright builds
// hang on screenshot under WSL2).

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '..', 'readme-title-tierboard.png');

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 440 }, deviceScaleFactor: 2 });
await page.goto('file://' + path.join(here, 'title-card.html'), { waitUntil: 'networkidle' });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(250);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 440 }, animations: 'disabled' });
console.log(out);
await browser.close();
