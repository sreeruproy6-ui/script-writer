import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: 'shot-setup.png' });

async function clickButton(text, index = 0) {
  const count = await page.evaluate((text, index) => {
    const buttons = [...document.querySelectorAll('button')].filter(b => b.textContent.trim().includes(text));
    if (buttons[index]) { buttons[index].click(); return buttons.length; }
    return -1;
  }, text, index);
  if (count < 0) errors.push('missing button: ' + text);
  await new Promise(r => setTimeout(r, 900));
}

await clickButton('Open demo studio');
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: 'shot-results.png' });

await clickButton('Dubbing script');
await page.screenshot({ path: 'shot-dubbing.png' });

await clickButton('Export & share');
await page.screenshot({ path: 'shot-export.png' });

await clickButton('Projects');
await page.screenshot({ path: 'shot-projects.png' });

await clickButton('Glossary');
await page.screenshot({ path: 'shot-glossary.png' });

await clickButton('Help & docs');
await page.screenshot({ path: 'shot-help.png' });

await clickButton('Studio settings');
await page.screenshot({ path: 'shot-settings.png' });

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: 'shot-mobile-setup.png' });
await page.evaluate(() => { const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Open menu'); b?.click(); });
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'shot-mobile-menu.png' });
await page.evaluate(() => { const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Close menu'); b?.click(); });
await new Promise(r => setTimeout(r, 300));
await page.evaluate(() => { const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Open demo studio')); b?.click(); });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: 'shot-mobile-results.png' });

console.log(JSON.stringify({ errors, title: await page.title() }, null, 2));
await browser.close();
