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

async function playCurrentMatch() {
  await page.waitForSelector('.game-board');
  const pairs = await page.evaluate(() => game.left.map(l => ({ left: l.id, match: l.match })));
  for (const p of pairs) {
    await page.click(`[data-game-id="L:${p.left}"]`);
    await page.waitForTimeout(80);
    const rid = await page.evaluate((id) => game.left.find(x => x.id === id).match, p.left);
    await page.click(`[data-game-id="R:${rid}"]`);
    await page.waitForTimeout(250);
  }
  await page.waitForSelector('text=Play again', { timeout: 15000 });
}

async function goToGamesHub() {
  if (await page.locator('h1.page').filter({ hasText: 'Revision Games' }).isVisible()) return;
  if (await page.isVisible('text=All games')) await page.click('text=All games');
  else await page.click('text=See all games');
  await page.waitForSelector('h1.page >> text=Revision Games');
}
async function openGame(name) {
  await goToGamesHub();
  await page.locator('.game-card').filter({ hasText: name }).first().click();
  await page.locator('button.btn.primary').filter({ hasText: 'Let' }).click();
}

await page.goto(`http://127.0.0.1:${port}/`);
const gameCount = await page.evaluate(() => GAME_CATALOG.length);
assert('12 games in catalog', gameCount === 12);

await goToGamesHub();
await openGame('Port Match');
await playCurrentMatch();
assert('Port Match completes', await page.isVisible('text=Play again'));

await openGame('Tool Toss');
await playCurrentMatch();
assert('Tool Toss completes', await page.isVisible('text=Play again'));

await openGame('Troubleshoot Trail');
await page.waitForSelector('.game-seq');
for (let i = 0; i < 5; i++) {
  await page.click(`[onclick="gameSeqTap('${i}')"]`);
  await page.waitForTimeout(200);
}
assert('Troubleshoot Trail completes', await page.isVisible('text=Play again'));

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
