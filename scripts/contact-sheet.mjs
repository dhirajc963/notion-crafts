// Render a contact sheet PNG of the icon library for visual QA.
//   node scripts/contact-sheet.mjs [variant] [count]
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { ICONS } from '../src/data/icons.generated.js';

const variant = process.argv[2] || 'outline';
const count = Number(process.argv[3] || 180);
const offset = Number(process.argv[4] || 0);
const color = '#18181a';
const cell = 64, cols = 18, pad = 0;
const sample = ICONS.slice(offset, offset + count);
const rows = Math.ceil(sample.length / cols);
const W = cols * cell, H = rows * cell;

function lighten(hex, amt) {
  const n = hex.replace('#', '');
  let r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

let cells = '';
sample.forEach((ic, idx) => {
  const cx = (idx % cols) * cell, cy = Math.floor(idx / cols) * cell;
  let inner;
  if (variant === 'filled') inner = ic.f;
  else if (variant === 'duotone') inner = ic.d;
  else if (variant === 'gradient') inner = `<defs><linearGradient id="g${idx}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${lighten(color, 0.3)}"/><stop offset="100%" stop-color="${color}"/></linearGradient></defs>` + ic.f.replaceAll('currentColor', `url(#g${idx})`);
  else inner = ic.o;
  const sz = 40, off = (cell - sz) / 2;
  cells += `<g transform="translate(${cx + off},${cy + off})" color="${color}"><svg width="${sz}" height="${sz}" viewBox="0 0 ${ic.vb} ${ic.vb}">${inner}</svg></g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fdf6ef"/>${cells}</svg>`;
const png = new Resvg(svg, { background: '#fdf6ef', font: { loadSystemFonts: false } }).render().asPng();
const out = `/tmp/icons-${variant}.png`;
writeFileSync(out, png);
console.log('wrote', out, `(${sample.length} icons, ${variant})`);
