const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const URL = 'http://localhost:4321/audit';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.audit-frame .w', { timeout: 15000 });
  await page.waitForTimeout(1500); // let fonts + effects settle

  const data = await page.$$eval('.audit-frame', frames => frames.map(f => {
    const fr = f.getBoundingClientRect();
    // walk ALL descendants; find how far any visible element spills past the frame edges
    let topClip = 0, botClip = 0, rightClip = 0, minTop = Infinity, maxBot = -Infinity;
    const els = f.querySelectorAll('*');
    for (const el of els) {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.top < minTop) minTop = r.top;
      if (r.bottom > maxBot) maxBot = r.bottom;
      topClip = Math.max(topClip, fr.top - r.top);
      botClip = Math.max(botClip, r.bottom - fr.bottom);
      rightClip = Math.max(rightClip, r.right - fr.right);
    }
    const contentH = (maxBot - minTop);
    return {
      id: f.dataset.id, name: f.dataset.name, type: f.dataset.type, size: f.dataset.size,
      frameH: Math.round(fr.height), contentH: Math.round(contentH),
      topClip: Math.round(Math.max(0, topClip)), botClip: Math.round(Math.max(0, botClip)),
      overflowY: Math.round(Math.max(0, topClip) + Math.max(0, botClip)),
      overflowX: Math.round(Math.max(0, rightClip)),
      slack: Math.round(fr.height - contentH),
    };
  }));

  // screenshot every frame for visual review
  const handles = await page.$$('.audit-frame');
  for (let i = 0; i < handles.length; i++) {
    const d = data[i];
    const tag = `${d.id}-${d.size}`;
    try { await handles[i].screenshot({ path: path.join(SHOTS, tag + '.png') }); } catch (e) {}
  }

  fs.writeFileSync(path.join(__dirname, 'measurements.json'), JSON.stringify(data, null, 2));

  const bad = data.filter(d => d.overflowY > 3 || d.overflowX > 3).sort((a, b) => b.overflowY - a.overflowY);
  console.log(`\nMeasured ${data.length} frames (82 widgets x 2 sizes).`);
  console.log(`OVERFLOWING: ${bad.length}`);
  for (const d of bad) console.log(`  [${d.size}] ${d.name} (${d.type}) — clipped ${d.overflowY}px vertical${d.overflowX ? ', ' + d.overflowX + 'px horizontal' : ''}`);

  const empty = data.filter(d => d.overflowY === 0 && d.slack > 70).sort((a, b) => b.slack - a.slack);
  console.log(`\nVERY UNDERFILLED (>70px empty, size M only):`);
  for (const d of empty.filter(d => d.size === 'M')) console.log(`  ${d.name} (${d.type}) — ${d.slack}px empty`);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
