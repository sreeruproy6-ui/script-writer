import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: 'shot-setup2.png' });

// Run demo pipeline
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Try demo episode'))?.click());
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: 'shot-processing.png' });
const processingText = await page.evaluate(() => document.body.innerText.includes('Localizing your episode') || document.body.innerText.includes('Demo'));
await new Promise(r => setTimeout(r, 6500));
await page.screenshot({ path: 'shot-results2.png' });
const hasCaptions = await page.evaluate(() => document.body.innerText.includes('রক্তচাঁদ'));

// Edit a subtitle line
const before = await page.evaluate(() => document.querySelectorAll('textarea').length);
await page.evaluate(() => {
  const area = [...document.querySelectorAll('textarea')].find(t => t.value.includes('তুমি এখনও') || t.value.length > 0);
  if (area) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(area, 'পরীক্ষামূলক বাংলা লাইন');
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await new Promise(r => setTimeout(r, 600));
const after = await page.evaluate(() => [...document.querySelectorAll('textarea')].some(t => t.value === 'পরীক্ষামূলক বাংলা লাইন'));

// Play preview and check captions appear
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Play preview')?.click());
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: 'shot-playing.png' });

// Mobile setup + menu
await page.setViewport({ width: 390, height: 844 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: 'shot-mobile-setup2.png', fullPage: false });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Open menu')?.click());
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'shot-mobile-menu2.png' });

console.log(JSON.stringify({ errors, processingText, hasCaptions, textareas: before, edited: after, mobileOverflow: overflow }, null, 2));
await browser.close();
