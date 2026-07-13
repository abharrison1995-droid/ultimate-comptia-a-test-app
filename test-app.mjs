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
await page.click('text=1.0 Mobile Devices');
await page.click('text=1.1 Install');
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
