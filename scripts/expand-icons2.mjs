// Curate ~500 MORE icons — Tabler-led (894 unused with -filled) + the last
// 16 Phosphor brand logos. Tabler picks are forced src:'tb' so the build
// synthesizes a duotone (soft fill + outline). Writes scripts/manifest-3.json.
//   node scripts/expand-icons2.mjs [--write]

import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const tb = require('@iconify-json/tabler/icons.json');
const __dirname = dirname(fileURLToPath(import.meta.url));

const used = new Set(JSON.parse(fs.readFileSync('/tmp/used-keys.json')));
const tbFilled = JSON.parse(fs.readFileSync('/tmp/tb-filled.json'));
const phLeftLogos = JSON.parse(fs.readFileSync('/tmp/ph-unused2.json')).filter(n => n.endsWith('-logo'));

// ---- Drop Tabler noise (regex on name) ------------------------------------
const DROP = [
  /^brand-/, /-\d$/, /^circle-letter-/, /^square-letter-/, /^circle-number-/, /^square-number-/,
  /^align-box-/, /^box-align-/, /^arrow-autofit/, /^arrow-badge/, /^arrow-big/, /^arrow-(move|guide|rhombus)/,
  /-rhombus$/, /^badge-/, /^battery-/, /^bell-(minus|plus|x|z)/, /^alarm-(minus|plus|snooze)/,
  /^circle-(caret|chevron|chevrons|arrow)/, /^chevron-/, /^caret-/, /-off$/, /^accessible/,
  /^chart-(dots|grid|area|bubble|candle|funnel|pie-[234])/, /^adjustments-/, /^aspect-ratio/,
  /^carousel/, /^bounce-/, /^automatic-gearbox/, /^capsule-horizontal/, /^building-/, /^bath$/,
  /^binary-tree/, /^briefcase-2/, /^box-multiple/, /^bell-ringing-2/, /^cardboards/, /^capture/,
  /^analyze/, /^affiliate/, /^asset$/, /^assembly/, /^artboard/, /^category/, /^apps$/, /^ad-/, /^ad$/,
  /-vertical/, /^air-balloon$/, /^aerial-lift/, /^bubble/, /^blob/, /^boom/, /^barrier-block/,
];
const dropped = (n) => DROP.some((re) => re.test(n));

// ---- Category by keyword (works on Tabler names) ---------------------------
const RULES = [
  ['Brands & Logos', /-logo$/],
  ['Development & Data', /(^code|terminal|binary|api|database|server|cpu|^bug|git-|^braces|^brackets|cloud-(code|computing)|webhook|^variable|^function|^json|^sql|http|^css$|^html$|devices-pc|^artboard|schema|^topology|hierarchy)/],
  ['Sports & Games', /(ball-|^ball$|bowling|chess|golf|tennis|soccer|basketball|football|hockey|cricket|dice|spade|cards|karate|boxing|^bow$|^target|olympics|medal|trophy|playstation|xbox|christmas-tree)/],
  ['Food & Drink', /(^beer$|^bowl|coffee|^cup|^bottle|^apple$|^cherry$|^carambola|^candy|cannabis|bong|^bread|^cheese|^egg|^pizza|^salad|^soup|^meat|^fish|^ice-cream|^cake|^milk|^teapot|^glass|chopsticks|^spoon|^mug|^pumpkin|^lemon|^carrot|^pepper|^mushroom)/],
  ['Weather & Nature', /(^cloud|^sun|^moon|^snow|^wind|^rainbow|^plant|^tree|^flower|^leaf|^mountain|^cactus|^mushroom|^pumpkin|^paw|^feather|^spider|^bug|christmas-tree|^carambola)/],
  ['Animals', /^(cat|dog|fish|spider|deer|pig)$/],
  ['Travel & Places', /(^car|^bus|^bike|^plane|^helicopter|^truck|^tractor|^caravan|^ship|^anchor|^sailboat|^road|^map|^compass|^tent|^building|^home|^hotel|^church|^charging-pile|^parking|^gas-station|^steering|^bed-flat|^bed$|^elevator|^stairs|^baby-carriage|aerial|escalator)/],
  ['Health & Fitness', /(^heart|^pill|^capsule|^vaccine|^stethoscope|^bandage|^first-aid|^wheelchair|^dna|^medical|^mood|^massage|^yoga|^run|^walk|^swimming|^weight|^barbell|^jump-rope|^stretching|^bath|^bed$|^blender)/],
  ['Devices & Tech', /(^device|^battery|^plug|^bluetooth|^wifi|^cpu|^printer|^mouse|^keyboard|^headphones|^speaker|^camera|^webcam|^router|^robot|^drone|^satellite|^solar|^washing|^blender|^fan$|^air-conditioning|^bulb|brightness|^antenna|^usb|^sd-card|^sim|^battery)/],
  ['Finance & Shopping', /(^cash|^coin|^currency|^credit-card|^wallet|^receipt|^shopping|^basket|^tag|^discount|^moneybag|^pig|^building-bank|^report-money|^chart-(candlestick|arrows)|^percentage|^businessplan)/],
  ['Communication', /(^mail|^message|^send|^phone|^inbox|^at$|^rss|^broadcast|^antenna|^bubble|^chat|^speakerphone)/],
  ['Media & Audio', /(^music|^volume|^microphone|^playlist|^vinyl|^movie|^video|^photo|^camera|^film|^playstation|^player|^podium|^speaker|^headphones|^disc$|^radio|^vinyl)/],
  ['Time & Calendar', /(^calendar|^clock|^alarm|^hourglass|^history|^timeline|^watch)/],
  ['People & Social', /(^user|^users|^mood|^friends|^gender|^baby|^woman|^man$|^accessible|^hand$|^thumb|^heart-handshake|^school)/],
  ['Education', /(^school|^book|^math|^abacus|^backpack|^pencil|^notebook|^ruler|^certificate|^microscope|^atom|^telescope|^vocabulary|^language|^blackboard)/],
  ['UI, Editing & Controls', /(^settings|^adjustments|^filter|^edit|^pencil|^eraser|^trash|^copy|^cut|^clipboard|^layout|^columns|^rows|^grid|^list|^menu|^dots|^toggle|^switch|^zoom|^crop|^color|^palette|^eyedropper|^brush|^ruler|^align|^text|^typography|^selector|^pointer|^click|^cursor|^resize|^border|^section|^artboard|^viewport|^window)/],
  ['Arrows & Navigation', /(^arrow|^direction|^route|^navigation|^pin|^location|^current-location|^gps|^compass|^map)/],
  ['Symbols & Shapes', /(^circle$|^square$|^triangle|^hexagon|^pentagon|^octagon|^rectangle|^diamond|^star$|^heart$|^cross$|^infinity|^math|^percentage|^equal|^plus$|^minus$|^slash|^number|^letter|^point$|^shape|^vector|^polygon|^spiral|^wave|^zodiac)/],
  ['Objects & Tools', /.*/],
];
function catOf(name) { for (const [c, re] of RULES) if (re.test(name)) return c; return 'Objects & Tools'; }

const BRAND_LABEL = { 'tiktok': 'TikTok', 'github': 'GitHub', 'gitlab': 'GitLab', 'youtube': 'YouTube', 'linkedin': 'LinkedIn', 'paypal': 'PayPal' };
function titleCase(s) { return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
function label(name) {
  if (name.endsWith('-logo')) { const b = name.slice(0, -5); return BRAND_LABEL[b] || titleCase(b); }
  return titleCase(name);
}

const picked = [];
const seen = new Set();
function add(name, src) {
  if (seen.has(name) || used.has(name)) return;
  seen.add(name);
  picked.push({ key: name, label: label(name), cat: catOf(name), src });
}

// Remaining Phosphor brand logos first (real duotone, on-brand with batch 2).
phLeftLogos.forEach((n) => add(n));            // resolves via Phosphor (no src)
// Tabler-with-filled, de-noised.
tbFilled.filter((n) => !dropped(n)).forEach((n) => add(n, 'tb'));

const byCat = {};
for (const p of picked) byCat[p.cat] = (byCat[p.cat] || 0) + 1;
console.log('=== Expansion 2 (Tabler-led) ===');
console.log('picked:', picked.length, '(ph-logos', picked.filter(p => !p.src).length, ', tabler', picked.filter(p => p.src === 'tb').length, ')');
for (const c of Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a])) console.log('  ', String(byCat[c]).padStart(3), c);

if (process.argv.includes('--write')) {
  fs.writeFileSync(join(__dirname, 'manifest-3.json'), JSON.stringify(picked));
  console.log('\nWrote scripts/manifest-3.json with', picked.length, 'icons');
} else {
  console.log('\n(sample)', picked.slice(16, 56).map(p => p.key).join(', '));
}
