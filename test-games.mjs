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
  if (await page.locator('.title-screen').isVisible().catch(() => false)) {
    await page.locator('.title-cta-sec').filter({ hasText: 'Revision Games' }).click();
  } else if (await page.isVisible('text=All games')) {
    await page.click('text=All games');
  } else if (await page.locator('.core-games-menu').count()) {
    await page.evaluate(() => { const el = document.querySelector('details.core-games-menu'); if (el) el.open = true; });
    await page.locator('.core-game-link').filter({ hasText: 'All Revision Games' }).click();
  } else {
    await page.click('.brand');
    await page.waitForSelector('.title-screen');
    await page.locator('.title-cta-sec').filter({ hasText: 'Revision Games' }).click();
  }
  await page.waitForSelector('h1.page >> text=Revision Games');
}
async function openGame(name) {
  await goToGamesHub();
  const details = page.locator('details.game-core');
  const n = await details.count();
  for (let i = 0; i < n; i++) await details.nth(i).evaluate(el => { el.open = true; });
  await page.locator('.game-card.clickable').filter({ hasText: name }).first().click();
  await page.locator('button.btn.primary').filter({ hasText: /^Play$/ }).click();
}

await page.goto(`http://127.0.0.1:${port}/`);
const gameCount = await page.evaluate(() => GAME_CATALOG.length);
assert('14 games in catalog', gameCount === 14);

await goToGamesHub();
await openGame('Port Match');
await playCurrentMatch();
assert('Port Match completes', await page.isVisible('text=Play again'));
assert('Port Match hints on pool', await page.evaluate(() =>
  PORT_DATA.normal.every(p => p.hint) && PORT_DATA.hard.every(p => p.hint)
));

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

assert('Millionaire tiered pool', await page.evaluate(() =>
  MILLIONAIRE_POOL.warmup.length === 25 && MILLIONAIRE_POOL.mid.length === 25 && MILLIONAIRE_POOL.high.length === 25
));
assert('10 Fix-It Fables characters', await page.evaluate(() => STORY_DATA.length === 10));

await openGame('Fix-It Fables');
await page.click('button.game-card:has-text("Harry Hill")');
await page.waitForSelector('.story-picks');
for (let i = 0; i < 5; i++) {
  const idx = await page.evaluate(() => game.story.steps[game.step].a);
  await page.locator('.story-picks .opt').nth(idx).click();
  await page.waitForTimeout(120);
  const btn = page.locator('button.btn.primary').filter({ hasText: /Continue story|Finish story/ });
  await btn.click();
  await page.waitForTimeout(120);
}
assert('Fix-It Fables completes', await page.isVisible('text=Play again'));

await openGame('A+ Ladder');
for (let i = 0; i < 15; i++) {
  const idx = await page.evaluate(() => game.qs[game.i].opts.findIndex(o => o.correct));
  await page.locator('.opt').nth(idx).click();
  await page.waitForTimeout(80);
  await page.locator('button.btn.final').click();
  await page.waitForTimeout(120);
  const next = page.locator('button.btn.primary').filter({ hasText: /Next question/ });
  if (await next.isVisible()) {
    await next.click();
    await page.waitForTimeout(100);
  }
}
assert('A+ Ladder completes', await page.isVisible("text=You're exam-ready"));

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
