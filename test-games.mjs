import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'));

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
let failed = 0;
function assert(n, c) { if (!c) { console.log('FAIL:', n); failed++; } else console.log('PASS:', n); }

await page.goto(`http://127.0.0.1:${port}/`);
await page.click('text=See all games');
await page.waitForSelector('text=Port Match');
await page.click('text=Port Match');
await page.waitForSelector('text=Normal — names & numbers');
await page.click('button.btn.primary');
await page.waitForSelector('.game-board');

// Play port match by reading board and matching
const pairs = await page.evaluate(() => {
  const out = [];
  for (const l of game.left) {
    const r = game.right.find(x => x.text === l.match);
    if (r) out.push({ left: l.id, right: r.text });
  }
  return out;
});
for (const p of pairs) {
  await page.click(`[data-game-id="L:${p.left}"]`);
  await page.waitForTimeout(80);
  await page.click(`[data-game-id="R:${p.right}"]`);
  await page.waitForTimeout(300);
}
await page.waitForSelector('text=Play again', { timeout: 15000 });
const done = await page.isVisible('text=Play again');
assert('Port match completes', done);

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
