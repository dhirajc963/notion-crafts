// Curate ~500 MORE unique icons from the unused Phosphor pool.
//   node scripts/expand-icons.mjs          # report
//   node scripts/expand-icons.mjs --write  # write scripts/manifest-2.json
//
// Strategy (deterministic, matches the research's "fan out transforms, not
// taste"): drop noisy variant-families, keep distinct concepts, assign a
// category by keyword, humanize the label. Brand logos -> new Brands category.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const ph = require('@iconify-json/ph/icons.json');
const __dirname = dirname(fileURLToPath(import.meta.url));

const existing = new Set(JSON.parse(fs.readFileSync('/tmp/existing-keys.json')));
const unused = JSON.parse(fs.readFileSync('/tmp/ph-unused.json'));
const logos = JSON.parse(fs.readFileSync('/tmp/ph-logos.json'));

// ---- 1. Drop noisy variant-families (regex on full name) -------------------
const DROP = [
  /-simple($|-)/, /-straight($|-)/, /-fine$/, /-broad$/, /-household$/,
  /^arrow-elbow/, /^arrow-u-/, /^arrow-bend/, /^arrow-fat-line/, /^arrow-square/,
  /^arrow-line/, /^arrow-circle-(up|down)-(left|right)/, /^arrow-arc/, /^arrow-counter/,
  /^caret-circle/, /^caret-line/, /-up-down$/, /^arrows-(in|out)/, /^arrows-down-up/,
  /^battery-(vertical|warning|empty|medium|plus|charging-vertical)/,
  /^cell-signal/, /^wifi-(low|medium|none|x)/, /^speaker-(hifi|none|slash|x|simple-(low|none|slash))/,
  /^number-square/, /^number-(one|two|three|four|five|six|seven|eight|nine|zero)$/, /number-circle-zero/,
  /^text-h-(four|five|six)/, /^folder-(simple|notch|dotted|dashed)/, /^file-(dashed|dotted|arrow|c$|c-sharp|cpp|rs|vue|jsx|tsx|ini|sql|ts$)/,
  /^lock-(simple|laminated)/, /^hourglass-(low|medium|simple)/, /-vertical-/,
  /^chat-(circle-slash|circle-text|slash|centered-(slash|dots|text))/, /^chat-teardrop-(slash|text|dots)/,
  /^user-circle-(dashed|gear|minus|plus)/, /^selection-(background|foreground|inverse|slash|plus|all)/,
  /^bell-simple/, /^bell-z/, /^bluetooth-/, /^gps-/, /^globe-(simple|x|hemisphere-east)/,
  /^subtitles-slash/, /^waveform-slash/, /^webcam-slash/, /^network-(slash|x)/, /^cloud-(slash|x|warning)/,
  /^push-pin-(simple|slash)/, /^pencil-(circle|line|ruler|simple-(line|slash)|slash)/, /^pen-nib-straight/,
  /^device-(mobile|tablet)-(camera|slash|speaker)/, /^phone-(disconnect|list|pause|transfer|x|plus|slash)/,
  /^shield-(checkered|chevron|slash)/, /-z$/, /^circle-wavy-(check|question|warning)/,
  /^box-arrow/, /^tray-arrow/, /^columns-plus/, /^rows-plus/, /^map-pin-(simple|line|area|plus)/,
  /^stack-(minus|plus|simple)/, /^list-(dashes)/, /^paint-brush-/, /^crown-(cross|simple)/,
  /^briefcase-(metal|simple)/, /^bookmark(s)?-simple/, /^drop-(simple|slash|half-bottom)/, /^ear-slash/,
  /^eject-simple/, /^anchor-simple/, /^bag-simple/, /^suitcase-simple/, /^handbag-simple/,
  /^tote-simple/, /^house-simple/, /^car-simple/, /^train-(simple|regional)/, /^television-simple/,
  /^chalkboard-simple/, /^crosshair-simple/, /^asterisk-simple/, /^copy-simple/, /^ladder-simple/,
  /^magnet-straight/, /^speedometer/, /^shuffle-(angular|simple)/, /^spinner-(ball|gap)/,
  /^hash-straight/, /^link-simple/, /^paper-plane-(right|tilt)/, /^paperclip-horizontal/,
  /^pent/, /^member-of/, /^not-(member|subset|superset)/, /^subset-proper/, /^superset-proper/,
  /^vector-(two|three)/, /^line-segment/, /^circle-half-tilt/, /^circle-notch/,
  /^currency-(cny|inr|krw|kzt|ngn|rub|eth)/, /^dots-(six|nine|three-circle)/, /^dice-(one|two|three|four|six)/,
  /^caret-up-down/, /^circles-three-plus/, /^split-(horizontal|vertical)/, /^square-split/,
  /^flip-(horizontal|vertical)/, /^corners-(in|out)/, /^exclude-square/, /^intersect-(square|three)/,
  /^unite-square/, /^subtract-square/, /^cube-(focus|transparent)/, /^funnel-(simple-x|x)/,
  /^receipt-x/, /^seal-(percent|question)/, /^calendar-(dot|minus|slash)/, /^clock-user/,
  /^fast-forward-circle/, /^rewind-circle/, /^skip-(back|forward)-circle/, /^stop-circle/,
  /^monitor-(arrow-up)/, /^smiley-(blank|melting|nervous|sticker|x-eyes|angry|meh)/,
  /^hand-(arrow|deposit|eye|grabbing|palm|pointing|soap|swipe|tap|withdraw)/, /^head-circuit/,
  /^trolley-suitcase/, /^truck-trailer/, /^person-simple-(circle|throw)/, /^baby-carriage/,
];
const dropped = (n) => DROP.some((re) => re.test(n));

// ---- 2. Category assignment (ordered keyword rules) ------------------------
const RULES = [
  ['Brands & Logos', /-logo$/],
  ['Development & Data', /^file-(js|py|html|css|csv|md|png|jpg|svg|txt)|^(browser|browsers|app-window|terminal|circuitry|graphics-card|computer-tower|desktop-tower|head|robot|bug-|cube|sphere|cylinder|network|password|git-diff|tree-view|code|brackets|graph|bezier|vector|node|sidebar|tabs|layout|numpad|control|export|sign-(in|out)|qr|binary)/],
  ['Arrows & Navigation', /(arrow|caret|cursor|signpost|gps|compass-rose|resize|corners|sidebar|escalator|elevator|stairs|ladder)/],
  ['UI, Editing & Controls', /^(text-|align|faders|swatches|eyedropper|paint-bucket|highlighter|marker|selection|toggle|radio-button|backspace|key-return|option|password|placeholder|empty|rectangle|shapes|squares|circles-|grid|rows|columns|split|exclude|intersect|union|unite|subtract|crop|scribble|lasso|signature|stamp|cards|swatches|browser)/],
  ['People & Social', /^(person|user|hand|hands|gender|wheelchair|baby|detective|mask|skull|alien|finn|smiley|eyes|face-mask|identification|member)/],
  ['Health & Fitness', /(asclepius|prescription|wheelchair|hands-praying|swimming-pool|sneaker|first-aid|bandaid|pill|hospital|ambulance|biohazard|radioactive|face-mask|toilet|bathtub|shower|towel|hand-soap|hair-dryer|steps|sneaker)/],
  ['Sports & Games', /(baseball|basketball|football|soccer|volleyball|tennis|ping-pong|hockey|cricket|golf|boules|bowling|racquet|beach-ball|poker|dice|spade|club|chess|disco|guitar|piano|metronome|sword|axe|boot|hockey|court|goggles)/],
  ['Food & Drink', /(beer|pint|cheers|coffee-bean|onigiri|orange-slice|egg-crack|popsicle|chef-hat|bowl-steam|jar|knife|oven|picnic|cigarette)/],
  ['Weather & Nature', /(meteor|hurricane|rainbow|clover|feather|butterfly|paw|island|tree-palm|flower-tulip|potted-plant|coffee-bean|farm|barn|park|windmill|solar|nuclear|cow|cat|dog|horse|rabbit|bird|fish|cube)/],
  ['Animals', /^(cat|dog|horse|cow|rabbit|paw-print|butterfly|bird|fish|alien|bug-beetle|bug-droid)$/],
  ['Travel & Places', /(airplane|airplay|air-traffic|ambulance|moped|jeep|van|subway|cable-car|drone|sailboat|tractor|bulldozer|crane|fire-truck|police|steering|tire|engine|gas-can|car-|headlights|seatbelt|seat|charging-station|parachute|barricade|traffic|bridge|castle|church|mosque|synagogue|warehouse|garage|barn|farm|city|building-apartment|lighthouse|tipi|tent|island|park|elevator|escalator|stairs|map|globe|signpost|shipping-container|trolley|treasure)/],
  ['Devices & Tech', /(device|monitor|projector|screencast|security-camera|webcam|video-camera|cassette|disc|vibrate|charging|plug|solar-panel|washing-machine|fan|lamp|projector|piano-keys|drone|four-k|high-definition|standard-definition|virtual-reality|three-d|picture-in-picture)/],
  ['Finance & Shopping', /(currency|coin-vertical|cash-register|contactless|tip-jar|treasure|poker-chip|shopping-bag-open|receipt|seal-percent|ranking|cardholder|tote|bag)/],
  ['Files & Documents', /^(file|folder|folders|note|newspaper|scroll|book-open|article|presentation|log|signature|paragraph|textbox|password|tabs|queue)/],
  ['Communication', /(envelope|chat|chats|paper-plane|phone|call-bell|mailbox|megaphone|broadcast|rss|at|share-fat|translate|subtitles|closed-captioning)/],
  ['Media & Audio', /(music|speaker|video|film|record|play-pause|eject|waveform|wave-|disco|cassette|guitar|piano|metronome|microphone|projector|slideshow|panorama|vignette|image|images|camera|picture)/],
  ['Time & Calendar', /(calendar|clock|hourglass|metronome|alarm)/],
  ['Symbols & Shapes', /(equals|divide|tilde|pi$|sigma|radical|approximate|greater|less|not-|plus-minus|exclamation|question|asterisk|copyleft|trademark|seal|warning|prohibit|radioactive|biohazard|fallout|star-of-david|star-and-crescent|pentagram|crown-cross|hands-praying|yin|peace|gender|number|letter-circle|three-d|polygon|parallelogram|rectangle|triangle|sphere|cube|cylinder|circle|square|club|spade|heart-half|clover|shapes|dot$|notches|path|angle|perspective|graph|spiral|pinwheel|checkerboard|gradient|wave-(sine|square|sawtooth|triangle))/],
  ['Objects & Tools', /(broom|shovel|knife|axe|sword|hammer|pipe-wrench|nut|needle|yarn|coat-hanger|hard-hat|hoodie|t-shirt|shirt|dress|pants|sock|boot|belt|beanie|visor|baseball-cap|cowboy-hat|high-heel|sneaker|tote|jar|lamp|lantern|flashlight|candle|door|chair|couch|armchair|desk|dresser|stool|office-chair|seat|rug|bathtub|toilet|shower|oven|washing|fan|mailbox|lockers|treasure|stamp|spray|fire-extinguisher|lifebuoy|binoculars|telescope|umbrella|key|lock|password|wall|barn|picnic-table|stool|lectern|projector-screen|swatches|paint|pen|pencil|eyedropper|highlighter|marker|scissors|sticker|seal|trophy|medal|crown|gavel|pi$)/],
  ['Education', /(chalkboard|lectern|book|asclepius|radical|pi$|sigma|math|graph|atom|microscope|telescope|blueprint|compass-tool|protractor|ruler|translate|newspaper)/],
];
function catOf(name) {
  for (const [cat, re] of RULES) if (re.test(name)) return cat;
  return 'Objects & Tools';
}

// ---- 3. Label humanizer ----------------------------------------------------
const BRAND_LABEL = {
  'ny-times': 'NY Times', 'open-ai': 'OpenAI', 'lastfm': 'Last.fm', 'dev-to': 'Dev.to',
  'read-cv': 'Read.cv', 'stack-overflow': 'Stack Overflow', 'app-store': 'App Store',
  'x': 'X', 'tiktok': 'TikTok', 'github': 'GitHub', 'gitlab': 'GitLab', 'codepen': 'CodePen',
  'codesandbox': 'CodeSandbox', 'youtube': 'YouTube', 'linkedin': 'LinkedIn', 'paypal': 'PayPal',
  'soundcloud': 'SoundCloud', 'wechat': 'WeChat', 'whatsapp': 'WhatsApp', 'goodreads': 'Goodreads',
};
const EXT = { js: 'JavaScript', py: 'Python', html: 'HTML', css: 'CSS', csv: 'CSV', md: 'Markdown', png: 'PNG', jpg: 'JPG', svg: 'SVG', txt: 'Text' };
function titleCase(s) { return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
function label(name) {
  if (name.endsWith('-logo')) { const b = name.slice(0, -5); return BRAND_LABEL[b] || titleCase(b); }
  const fm = name.match(/^file-([a-z]+)$/); if (fm && EXT[fm[1]]) return EXT[fm[1]] + ' File';
  const nm = name.match(/^number-circle-(\w+)$/); if (nm) return 'Number ' + titleCase(nm[1]);
  const hm = name.match(/^text-h-(one|two|three)$/); if (hm) return 'Heading ' + { one: '1', two: '2', three: '3' }[hm[1]];
  return titleCase(name);
}

// ---- 4. Curate -------------------------------------------------------------
// Brand logos: keep a curated set of well-known tools.
const BRAND_KEEP = new Set(['amazon','android','app-store','behance','coda','codepen','codesandbox','dev-to','discord','dribbble','dropbox','facebook','figma','framer','github','gitlab','goodreads','google-chrome','google-drive','google','instagram','lastfm','linkedin','linktree','markdown','mastodon','medium','messenger','microsoft-excel','microsoft-outlook','microsoft-powerpoint','microsoft-teams','microsoft-word','notion','ny-times','open-ai','patreon','paypal','pinterest','read-cv','reddit','replit','sketch','slack','snapchat','soundcloud','spotify','stack-overflow','steam','stripe','telegram','threads','tiktok','tumblr','twitch','twitter','whatsapp','windows','x','youtube'].map(b => b + '-logo'));

const picked = [];
const seen = new Set();
function add(name) {
  if (seen.has(name) || existing.has(name)) return;
  if (!ph.icons[name]) return;
  seen.add(name);
  picked.push({ key: name, label: label(name), cat: catOf(name) });
}

logos.filter((l) => BRAND_KEEP.has(l)).forEach(add);
unused.filter((n) => !dropped(n)).forEach(add);

// ---- 5. Report / write -----------------------------------------------------
const byCat = {};
for (const p of picked) byCat[p.cat] = (byCat[p.cat] || 0) + 1;
console.log('=== Expansion curation ===');
console.log('picked:', picked.length, '(brands', picked.filter(p => p.cat === 'Brands & Logos').length, ')');
console.log('\nPer-category:');
for (const c of Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a])) console.log('  ', String(byCat[c]).padStart(3), c);

if (process.argv.includes('--write')) {
  fs.writeFileSync(join(__dirname, 'manifest-2.json'), JSON.stringify(picked, null, 0));
  console.log('\nWrote scripts/manifest-2.json with', picked.length, 'icons');
} else {
  console.log('\n(sample)', picked.slice(0, 30).map(p => p.key).join(', '));
}
