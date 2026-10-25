import puppeteer from 'puppeteer';
import fs from 'node:fs';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const client = await page.createCDPSession();
await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/roy-downloads', eventsEnabled: true });
await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://localhost:4174/', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 800));
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Open demo studio'))?.click());
await new Promise(r => setTimeout(r, 900));
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Export & share')?.click());
await new Promise(r => setTimeout(r, 500));
// click every Download button
const count = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Download');
  buttons.forEach(b => b.click());
  return buttons.length;
});
await new Promise(r => setTimeout(r, 2000));
// edit then reload to test persistence
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Bengali subtitles')?.click());
await new Promise(r => setTimeout(r, 400));
await page.evaluate(() => {
  const area = document.querySelector('textarea');
  if (area) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(area, 'স্থায়ীভাবে সংরক্ষিত লাইন');
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await new Promise(r => setTimeout(r, 500));
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 800));
const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('roy-ai:studio:v1') || '{}')?.demoProject?.segments?.[0]?.bengali_subtitle);
const files = fs.readdirSync('/tmp/roy-downloads').map(name => {
  const content = fs.readFileSync('/tmp/roy-downloads/' + name, 'utf8');
  return { name, bytes: content.length, head: content.slice(0, 110).replace(/\n/g, ' ⏎ ') };
});
console.log(JSON.stringify({ errors, downloadButtons: count, persisted, files }, null, 2));
await browser.close();
