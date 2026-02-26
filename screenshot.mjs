import puppeteer from 'puppeteer';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = join(__dirname, 'temporary screenshots');

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0', 10));
const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const filepath = join(dir, filename);

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const scrollHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;
    for (let y = 0; y < scrollHeight; y += viewportHeight * 0.6) {
      window.scrollTo(0, y);
      await delay(300);
    }
    window.scrollTo(0, scrollHeight);
    await delay(500);
    window.scrollTo(0, 0);
    await delay(500);
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  await browser.close();
})();
