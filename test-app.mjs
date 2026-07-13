import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, 'index.html'));

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

let passed = 0, failed = 0;
function assert(name, cond) {
  if (cond) { console.log('PASS:', name); passed++; }
  else { console.log('FAIL:', name); failed++; }
}

await page.goto(`http://127.0.0.1:${port}/`);
assert('Core 1 hero banner', await page.isVisible('.core-hero-core1'));
assert('Core 1 domain cards', (await page.locator('.domain-card-core1').count()) >= 5);
assert('Core 1 games strip', await page.isVisible('.core1-games-strip'));
await page.click('text=1.0 Mobile Devices');
assert('Domain hero on topic list', await page.isVisible('.domain-hero'));
await page.click('text=1.2 Compare');
assert('1.2 display symptom table', await page.evaluate(() => document.querySelector('.notes')?.textContent.includes('Symptom')));
assert('1.2 touch technologies section', await page.evaluate(() => !!document.getElementById('note-12-3') || document.querySelector('.notes')?.textContent.includes('Capacitive')));
await page.click('button.sub-nav-btn:has-text("1.3")');
assert('1.3 dock vs hub table', await page.evaluate(() => document.querySelector('.notes')?.textContent.includes('KVM switch')));
assert('1.3 scenario pick-list', await page.evaluate(() => document.querySelector('.notes')?.textContent.includes('Contactless payment')));
await page.click('button.sub-nav-btn:has-text("1.4")');
assert('1.4 APN and tethering content', await page.evaluate(() => {
  const t = document.querySelector('.notes')?.textContent || '';
  return t.includes('APN') && t.includes('USB tethering');
}));
assert('1.4 connectivity symptom table', await page.evaluate(() => document.querySelector('.notes')?.textContent.includes('Captive portal')));
await page.click('button:has-text("All 1.0 topics")');
await page.click('.brand');
await page.locator('.domain-card-core1').filter({ hasText: '2.0' }).click();
assert('Networking domain hero', await page.isVisible('.domain-hero'));
await page.click('text=2.2 Compare');
assert('2.2 router vs switch table', await page.evaluate(() => document.querySelector('.notes')?.textContent.includes('Layer')));
await page.click('button:has-text("All 2.0 topics")');
await page.click('text=2.6 Compare');
assert('2.6 NAT and port forwarding', await page.evaluate(() => document.querySelector('.notes')?.textContent.includes('Port forwarding')));
await page.click('button:has-text("All 2.0 topics")');
await page.click('.brand');
await page.locator('.domain-card-core1').filter({ hasText: '1.0' }).click();
await page.click('text=1.1 Install');
assert('Revision sheet has read meta', await page.isVisible('.notes-meta'));
assert('Revision sheet wraps notes', await page.isVisible('.notes-sheet'));
assert('Revision sheet table of contents', await page.isVisible('.notes-toc'));
await page.click('text=Start mini mock');
await page.waitForSelector('.qtext');
await page.click('.opt >> nth=0');

// Brand click should show modal, not navigate
await page.click('.brand');
const modalVisible = await page.isVisible('#leaveModal');
assert('Brand click shows leave modal during quiz', modalVisible);
await page.click('#lmNo');
const stillQuiz = await page.evaluate(() => view.name === 'quiz' && quiz && !quiz.done);
assert('Keep studying preserves quiz', stillQuiz);

// Brand leave
await page.click('.brand');
await page.click('#lmYes');
const atHome = await page.evaluate(() => view.name === 'home' && quiz === null);
assert('Leave quiz returns to home cleanly', atHome);
const progress = await page.evaluate(() => localStorage.getItem('aplus_quiz_progress'));
assert('Progress cleared after leaving', progress === null);

// Retake stack test
await page.goto(`http://127.0.0.1:${port}/`);
await page.click('text=1.0 Mobile Devices');
await page.click('text=Start domain mock');
for (let i = 0; i < 25; i++) {
  await page.waitForSelector('.opt:not([disabled])');
  await page.click('.opt >> nth=0');
  await page.waitForSelector('#nextbtn');
  const label = await page.textContent('#nextbtn');
  await page.click('#nextbtn');
  if (label.includes('See result')) break;
}
await page.waitForSelector('.result');
const stackAfterComplete = await page.evaluate(() => stack.length);
await page.click('text=Retake');
const stackAfterRetake = await page.evaluate(() => stack.length);
assert('Retake does not grow navigation stack', stackAfterRetake === stackAfterComplete);

// Auto-save test
await page.waitForSelector('.opt:not([disabled])');
await page.click('.opt >> nth=0');
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('aplus_quiz_progress')));
assert('Quiz progress auto-saves', saved && saved.i === 0 && saved.right >= 0);

// Resume banner
await page.goto(`http://127.0.0.1:${port}/`);
const banner = await page.isVisible('.resume-banner');
assert('Resume banner shown on home', banner);
await page.click('text=Continue quiz');
const resumed = await page.evaluate(() => view.name === 'quiz' && quiz && quiz.i === 0);
assert('Resume restores quiz session', resumed);

console.log(`\n${passed} passed, ${failed} failed`);
console.log('Page errors:', errors.length ? errors : 'none');

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
