/* ============================================================
   Notion Crafts — Specimen Edition
   Ported from the Claude Design handoff (HTML/React+Babel prototype)
   into a single React island for Astro. All modules from the
   original bundle live here in dependency order; function
   declarations hoist, so cross-references resolve regardless of
   position. Mounted client-only — uses Date, localStorage, etc.
   ============================================================ */

import React, {
  useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect,
} from 'react';

/* ============================================================
   DATA
   ============================================================ */

const WIDGETS = [
  {
    id: 'clock', name: 'World Clock', type: 'clock', pro: false,
    desc: 'A crisp live clock with timezone, 12/24h and optional date.',
    tags: ['Time', 'Dashboard'], category: 'Time',
    config: { tz: 'America/New_York', format: '12', seconds: true, showDate: true, label: '' },
  },
  {
    id: 'countdown', name: 'Countdown', type: 'countdown', pro: false,
    desc: 'Days, hours and minutes ticking down to any moment.',
    tags: ['Time', 'Goals'], category: 'Time',
    config: { target: '', title: 'Launch Day' },
  },
  {
    id: 'pomodoro', name: 'Focus Timer', type: 'pomodoro', pro: false,
    desc: 'A pomodoro timer with work / break cycles and a progress ring.',
    tags: ['Focus', 'Productivity'], category: 'Productivity',
    config: { work: 25, brk: 5, autostart: false },
  },
  {
    id: 'weather', name: 'Weather', type: 'weather', pro: true,
    desc: 'Local conditions, highs & lows and a clean four-day outlook.',
    tags: ['Daily', 'Pro'], category: 'Daily',
    config: { city: 'Lisbon', units: 'C', forecast: true },
  },
  {
    id: 'quote', name: 'Daily Quote', type: 'quote', pro: false,
    desc: 'A rotating line of inspiration, refreshed on demand.',
    tags: ['Daily', 'Calm'], category: 'Daily',
    config: { collection: 'Stoic', author: true },
  },
  {
    id: 'habit', name: 'Habit Streak', type: 'habit', pro: true,
    desc: 'A weekly grid to keep a streak alive, one tap per day.',
    tags: ['Routine', 'Pro'], category: 'Productivity',
    config: { habit: 'Read 20 min', days: 7 },
  },
  {
    id: 'calendar', name: 'Month Calendar', type: 'calendar', pro: false,
    desc: 'The current month at a glance with today highlighted.',
    tags: ['Planning', 'Dashboard'], category: 'Planning',
  },
];

const WIDGET_CATEGORIES = ['All', 'Time', 'Productivity', 'Daily', 'Planning'];

const TIMEZONES = [
  { v: 'America/Los_Angeles', l: 'Los Angeles' },
  { v: 'America/New_York', l: 'New York' },
  { v: 'America/Sao_Paulo', l: 'São Paulo' },
  { v: 'Europe/London', l: 'London' },
  { v: 'Europe/Lisbon', l: 'Lisbon' },
  { v: 'Europe/Berlin', l: 'Berlin' },
  { v: 'Africa/Nairobi', l: 'Nairobi' },
  { v: 'Asia/Dubai', l: 'Dubai' },
  { v: 'Asia/Kolkata', l: 'Mumbai' },
  { v: 'Asia/Singapore', l: 'Singapore' },
  { v: 'Asia/Tokyo', l: 'Tokyo' },
  { v: 'Australia/Sydney', l: 'Sydney' },
];

const FONTS = [
  { v: 'sans', l: 'Hanken Sans', stack: "'Hanken Grotesk', system-ui, sans-serif", pro: false },
  { v: 'serif', l: 'Newsreader', stack: "'Newsreader', Georgia, serif", pro: false },
  { v: 'mono', l: 'Geist Mono', stack: "'Geist Mono', monospace", pro: false },
  { v: 'rounded', l: 'Quicksand', stack: "'Quicksand', system-ui, sans-serif", pro: true },
  { v: 'display', l: 'Fraunces', stack: "'Fraunces', Georgia, serif", pro: true },
];

const ACCENTS = ['#18181a', '#E0603A', '#2A6FDB', '#1F8A5B', '#6D4FD6', '#C2417B', '#0E9DA6', '#B07D2E'];

const QUOTES = {
  Stoic: [
    { t: 'We suffer more often in imagination than in reality.', a: 'Seneca' },
    { t: 'You have power over your mind — not outside events.', a: 'Marcus Aurelius' },
    { t: 'No man is free who is not master of himself.', a: 'Epictetus' },
    { t: 'Waste no more time arguing what a good person should be. Be one.', a: 'Marcus Aurelius' },
  ],
  Focus: [
    { t: 'It is not enough to be busy; the question is what we are busy about.', a: 'Henry David Thoreau' },
    { t: 'Concentrate all your thoughts upon the work at hand.', a: 'Alexander Graham Bell' },
    { t: 'Simplicity is the soul of efficiency.', a: 'Austin Freeman' },
  ],
  Calm: [
    { t: 'Almost everything will work again if you unplug it for a few minutes.', a: 'Anne Lamott' },
    { t: 'Nature does not hurry, yet everything is accomplished.', a: 'Lao Tzu' },
    { t: 'Quiet the mind and the soul will speak.', a: 'Ma Jaya' },
  ],
};

const WEATHER_DATA = {
  Lisbon: { cond: 'Clear', icon: 'sun', c: 23, hi: 25, lo: 16, fc: [['Mon', 'sun', 25], ['Tue', 'cloud', 22], ['Wed', 'rain', 19], ['Thu', 'sun', 24]] },
  London: { cond: 'Light rain', icon: 'rain', c: 14, hi: 16, lo: 9, fc: [['Mon', 'rain', 15], ['Tue', 'cloud', 16], ['Wed', 'cloud', 14], ['Thu', 'sun', 18]] },
  Tokyo: { cond: 'Cloudy', icon: 'cloud', c: 19, hi: 21, lo: 13, fc: [['Mon', 'cloud', 20], ['Tue', 'sun', 23], ['Wed', 'sun', 24], ['Thu', 'rain', 18]] },
  'New York': { cond: 'Sunny', icon: 'sun', c: 21, hi: 24, lo: 12, fc: [['Mon', 'sun', 24], ['Tue', 'sun', 26], ['Wed', 'cloud', 22], ['Thu', 'rain', 17]] },
};
const WEATHER_CITIES = Object.keys(WEATHER_DATA);

const ICON_SET = [
  { k: 'home', l: 'Home' }, { k: 'star', l: 'Star' }, { k: 'heart', l: 'Heart' },
  { k: 'calendar', l: 'Calendar' }, { k: 'clock', l: 'Clock' }, { k: 'target', l: 'Target' },
  { k: 'rocket', l: 'Rocket' }, { k: 'book', l: 'Notebook' }, { k: 'folder', l: 'Folder' },
  { k: 'bolt', l: 'Energy' }, { k: 'leaf', l: 'Leaf' }, { k: 'flame', l: 'Streak' },
  { k: 'moon', l: 'Moon' }, { k: 'sun', l: 'Sun' }, { k: 'cloud', l: 'Cloud' },
  { k: 'check', l: 'Tasks' }, { k: 'inbox', l: 'Inbox' }, { k: 'compass', l: 'Compass' },
  { k: 'gem', l: 'Gem' }, { k: 'coffee', l: 'Coffee' }, { k: 'music', l: 'Music' },
  { k: 'camera', l: 'Camera' }, { k: 'globe', l: 'Globe' }, { k: 'pin', l: 'Place' },
  { k: 'tag', l: 'Tag' }, { k: 'bell', l: 'Reminders' }, { k: 'bookmark', l: 'Saved' },
  { k: 'chart', l: 'Metrics' }, { k: 'wallet', l: 'Budget' }, { k: 'dumbbell', l: 'Fitness' },
  { k: 'palette', l: 'Design' }, { k: 'code', l: 'Code' }, { k: 'lightbulb', l: 'Ideas' },
  { k: 'gift', l: 'Gifts' }, { k: 'plane', l: 'Travel' }, { k: 'flag', l: 'Goals' },
];

const ICON_STYLES = [
  { v: 'outline', l: 'Outline', pro: false },
  { v: 'filled', l: 'Filled', pro: false },
  { v: 'duotone', l: 'Duotone', pro: false },
  { v: 'gradient', l: 'Gradient', pro: true },
];

const PACKS = [
  {
    id: 'student', name: 'Student Dashboard', kicker: 'For focused semesters',
    desc: 'Everything to run a term — a class calendar, a focus timer, and a reading streak that keeps you honest.',
    accent: '#2A6FDB', icons: ['book', 'calendar', 'clock', 'check', 'target', 'coffee'],
    widgets: ['calendar', 'pomodoro', 'habit'], pro: false,
  },
  {
    id: 'founder', name: 'Founder OS', kicker: 'Run the company from one page',
    desc: 'Timezones for a distributed team, a countdown to launch, and metrics you check before coffee.',
    accent: '#18181a', icons: ['rocket', 'chart', 'globe', 'bolt', 'flag', 'wallet'],
    widgets: ['clock', 'countdown', 'weather'], pro: true,
  },
  {
    id: 'habit', name: 'Habit System', kicker: 'Small reps, every day',
    desc: 'A calm system for routines — streaks, a daily line of inspiration, and a timer to start before you think.',
    accent: '#1F8A5B', icons: ['flame', 'leaf', 'check', 'dumbbell', 'heart', 'sun'],
    widgets: ['habit', 'quote', 'pomodoro'], pro: false,
  },
  {
    id: 'creator', name: 'Creator Studio', kicker: 'Ship the calendar',
    desc: 'A content rhythm: a posting countdown, a month view, and a quote to break the blank page.',
    accent: '#C2417B', icons: ['camera', 'palette', 'music', 'bolt', 'star', 'gem'],
    widgets: ['countdown', 'calendar', 'quote'], pro: true,
  },
];

const PRO_FEATURES = [
  'Every premium widget — Weather, Habit Streak & more',
  'Gradient & duotone icon styles',
  'Premium fonts (Quicksand, Fraunces)',
  'Auto theme that follows the reader',
  'Remove the “via Notion Crafts” caption',
  'Unlimited favorites & curated Pro packs',
];
const FREE_FEATURES = [
  'Core widgets — Clock, Countdown, Focus, Calendar',
  'Outline, filled & duotone icons',
  'Any hex color, light & dark themes',
  'Three built-in fonts',
  'Copy-to-paste embed & image URLs',
  'Up to 12 saved favorites',
];

/* ============================================================
   ICON LIBRARY
   Each icon = { body:[closed fillable paths], detail:[lines on top] }
   Variants: outline · filled · duotone · gradient
   ============================================================ */

const ICON_PATHS = {
  home: { body: ['M3.7 11 L12 4 L20.3 11 V19.5 a1.2 1.2 0 0 1 -1.2 1.2 H4.9 A1.2 1.2 0 0 1 3.7 19.5 Z'], detail: ['M9.6 20.7 V14 h4.8 v6.7'] },
  star: { body: ['M12 3 L14.6 8.7 L20.8 9.5 L16.2 13.8 L17.5 20 L12 16.8 L6.5 20 L7.8 13.8 L3.2 9.5 L9.4 8.7 Z'] },
  heart: { body: ['M12 20.3 C12 20.3 3.8 14.7 3.8 9.2 A4.4 4.4 0 0 1 12 6.8 A4.4 4.4 0 0 1 20.2 9.2 C20.2 14.7 12 20.3 12 20.3 Z'] },
  calendar: { body: ['M4 7.2 a1.6 1.6 0 0 1 1.6-1.6 h12.8 a1.6 1.6 0 0 1 1.6 1.6 V19.4 a1.6 1.6 0 0 1 -1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 19.4 Z'], detail: ['M4 10.4 H20', 'M8.2 4 V7.2', 'M15.8 4 V7.2'] },
  clock: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M12 7.4 V12 L15.6 13.9'] },
  target: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M12 16.6 a4.6 4.6 0 1 1 0.01 0', 'M12 12.2 h0.01'] },
  rocket: { body: ['M12 3.2 C15.4 5.2 16.9 9.2 16.4 14 L13 16.8 H11 L7.6 14 C7.1 9.2 8.6 5.2 12 3.2 Z'], detail: ['M12 9.6 a1.7 1.7 0 1 0 0.01 0', 'M11 16.8 L9 21', 'M13 16.8 L15 21'] },
  book: { body: ['M6 3.8 H17 a1.5 1.5 0 0 1 1.5 1.5 V20.2 H7.5 A1.5 1.5 0 0 1 6 18.7 Z'], detail: ['M9 3.8 V20.2', 'M11.6 8.4 H15.8', 'M11.6 11.6 H15.8'] },
  folder: { body: ['M3.5 7 a1.5 1.5 0 0 1 1.5-1.5 h4 l2 2 h7.5 a1.5 1.5 0 0 1 1.5 1.5 V18 a1.5 1.5 0 0 1 -1.5 1.5 H5 A1.5 1.5 0 0 1 3.5 18 Z'] },
  bolt: { body: ['M13 2.5 L5 13 h5 l-1 8.5 L19 11 h-5 Z'] },
  leaf: { body: ['M4.5 19.5 C4.5 11 10 5 20 4.5 C20 14 14.5 19.5 4.5 19.5 Z'], detail: ['M4.5 19.5 C8 15 12 11.5 16.5 9'] },
  flame: { body: ['M12 21 C8.4 21 6 18.5 6 15 C6 11 9 9 9.5 5 C12 7 13 8.5 13 10.5 C14 9.5 14.5 8.5 14.5 7 C16.5 9 18 12 18 15 C18 18.5 15.6 21 12 21 Z'] },
  moon: { body: ['M20 14.5 A8.5 8.5 0 1 1 10 4 A6.8 6.8 0 0 0 20 14.5 Z'] },
  sun: { body: ['M12 16.5 a4.5 4.5 0 1 1 0.01 0 Z'], detail: ['M12 2.5 V5', 'M12 19 V21.5', 'M2.5 12 H5', 'M19 12 H21.5', 'M5.2 5.2 L7 7', 'M17 17 L18.8 18.8', 'M18.8 5.2 L17 7', 'M7 17 L5.2 18.8'] },
  cloud: { body: ['M7 19 a4.2 4.2 0 0 1 -0.4 -8.4 A5 5 0 0 1 16.4 9.4 A3.8 3.8 0 0 1 16.8 19 Z'] },
  check: { body: ['M5 12 a7 7 0 1 1 0.01 0 Z'], detail: ['M8.5 12.2 L11 14.7 L15.6 9.6'] },
  inbox: { body: ['M3.6 13 L6.4 5.4 a1.5 1.5 0 0 1 1.4-1 h8.4 a1.5 1.5 0 0 1 1.4 1 L20.4 13 V18.5 a1.5 1.5 0 0 1 -1.5 1.5 H5.1 A1.5 1.5 0 0 1 3.6 18.5 Z'], detail: ['M3.6 13 H8 a1 1 0 0 1 1 1 a3 3 0 0 0 6 0 a1 1 0 0 1 1 -1 H20.4'] },
  compass: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z'] },
  gem: { body: ['M6 4.5 H18 L21.5 9.5 L12 21 L2.5 9.5 Z'], detail: ['M2.5 9.5 H21.5', 'M9 4.5 L7.5 9.5 L12 21', 'M15 4.5 L16.5 9.5 L12 21'] },
  coffee: { body: ['M5 8.5 H17 V15 a4 4 0 0 1 -4 4 H9 a4 4 0 0 1 -4 -4 Z'], detail: ['M17 9.5 h1.8 a2.6 2.6 0 0 1 0 5.2 H17', 'M8.5 3 V5', 'M12 3 V5'] },
  music: { body: ['M9 18 a2.5 2.5 0 1 1 -0.01 0 Z', 'M18 15.5 a2.5 2.5 0 1 1 -0.01 0 Z'], detail: ['M11.5 18 V6 L20.5 4 V15.5', 'M11.5 9 L20.5 7'] },
  camera: { body: ['M3.6 8.5 a1.5 1.5 0 0 1 1.5-1.5 H8 l1.5-2 h5 L16 7 h3 a1.5 1.5 0 0 1 1.5 1.5 V18 a1.5 1.5 0 0 1 -1.5 1.5 H5.1 A1.5 1.5 0 0 1 3.6 18 Z'], detail: ['M12 16.8 a3.6 3.6 0 1 1 0.01 0'] },
  globe: { body: ['M12 21 a9 9 0 1 1 0.01 0 Z'], detail: ['M3.2 12 H20.8', 'M12 3 C8 6 8 18 12 21 C16 18 16 6 12 3 Z'] },
  pin: { body: ['M12 21.5 C7 16.5 5.5 13 5.5 9.8 A6.5 6.5 0 0 1 18.5 9.8 C18.5 13 17 16.5 12 21.5 Z'], detail: ['M12 12.3 a2.6 2.6 0 1 1 0.01 0'] },
  tag: { body: ['M4 11 V4.8 a1 1 0 0 1 1-1 H11 L20 12.8 a1.4 1.4 0 0 1 0 2 L14.8 20 a1.4 1.4 0 0 1 -2 0 Z'], detail: ['M8 8 h0.01'] },
  bell: { body: ['M6 17.5 C6.8 16.5 7.5 15 7.5 12 C7.5 8 9.5 5.5 12 5.5 C14.5 5.5 16.5 8 16.5 12 C16.5 15 17.2 16.5 18 17.5 Z'], detail: ['M10 20 a2 2 0 0 0 4 0', 'M12 3.2 V5.5'] },
  bookmark: { body: ['M6 3.8 h12 a0.8 0.8 0 0 1 0.8 0.8 V20.5 L12 16.5 L5.2 20.5 V4.6 A0.8 0.8 0 0 1 6 3.8 Z'] },
  chart: { body: ['M5 19 V11 h3.5 V19 Z', 'M10.2 19 V5 h3.5 V19 Z', 'M15.5 19 V14 H19 V19 Z'] },
  wallet: { body: ['M4 7.5 a1.6 1.6 0 0 1 1.6-1.6 h11.8 a1.6 1.6 0 0 1 1.6 1.6 V18 a1.6 1.6 0 0 1 -1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 18 Z'], detail: ['M15.5 11 a1.6 1.6 0 0 0 0 3.2 H20.5 V11 Z', 'M16.8 12.6 h0.01'] },
  dumbbell: { body: ['M3 9.5 h2.5 v5 H3 Z', 'M18.5 9.5 H21 v5 h-2.5 Z', 'M6.5 8.5 h2 v7 h-2 Z', 'M15.5 8.5 h2 v7 h-2 Z'], detail: ['M8.5 12 H15.5'] },
  palette: { body: ['M12 21 C6.8 21 3 17 3 12 A9 9 0 0 1 21 12 C21 14.8 18.8 16 17 16 H15 a1.5 1.5 0 0 0 -1 2.6 A2 2 0 0 1 12 21 Z'], detail: ['M7.5 12 h0.01', 'M9.5 8 h0.01', 'M14 7.5 h0.01', 'M16.5 11 h0.01'] },
  code: { body: [], detail: ['M9 7 L4 12 L9 17', 'M15 7 L20 12 L15 17', 'M13 4.5 L11 19.5'] },
  lightbulb: { body: ['M8 14.5 C6.2 13.2 5 11.2 5 9 A7 7 0 0 1 19 9 C19 11.2 17.8 13.2 16 14.5 V17 H8 Z'], detail: ['M9.5 20 H14.5', 'M10 17 H14'] },
  gift: { body: ['M4.5 10 H19.5 V20 a1 1 0 0 1 -1 1 H5.5 a1 1 0 0 1 -1 -1 Z'], detail: ['M4 7 a1 1 0 0 1 1-1 H19 a1 1 0 0 1 1 1 V10 H4 Z', 'M12 6 V21', 'M12 6 C12 6 10 2.5 8 3.5 C6 4.5 8.5 6 12 6 Z', 'M12 6 C12 6 14 2.5 16 3.5 C18 4.5 15.5 6 12 6 Z'] },
  plane: { body: ['M21 6 a1.6 1.6 0 0 0 -2.2 -1.5 L13 7 L5 4.5 L3.2 6.3 L9 10 L6 13 H3.5 L2.5 14.8 L6.5 16.5 L8.2 20.5 L10 19.5 V17 L13 14 L16.7 19.8 L18.5 18 L16 10 Z'] },
  flag: { body: ['M6 21 V4 a1 1 0 0 1 1-1 h11.5 a0.6 0.6 0 0 1 0.5 1 L17 7 l2 3 a0.6 0.6 0 0 1 -0.5 1 H6 Z'], detail: ['M6 13 H18.5'] },
};

function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  let r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function luminance(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16) / 255, g = parseInt(n.slice(2, 4), 16) / 255, b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function onColor(hex) { return luminance(hex) > 0.62 ? '#1a1a18' : '#ffffff'; }

let __gid = 0;
function Icon({ name, color = '#18181a', variant = 'outline', size = 24, sw = 1.7 }) {
  const spec = ICON_PATHS[name] || ICON_PATHS.star;
  const body = spec.body || [], detail = spec.detail || [];
  const gid = useMemo(() => 'ig' + (++__gid), []);
  const onc = onColor(color);
  let bodyFill = 'none', bodyStroke = color, detailStroke = color, defs = null;

  if (variant === 'filled') { bodyFill = color; detailStroke = onc; }
  else if (variant === 'duotone') { bodyFill = color; bodyStroke = color; detailStroke = onc; defs = null; }
  else if (variant === 'gradient') {
    bodyFill = `url(#${gid})`; detailStroke = onc; bodyStroke = 'none';
    defs = (
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lighten(color, 0.28)} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
    );
  }

  const isDuo = variant === 'duotone';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {defs}
      {isDuo && body.map((d, i) => <path key={'soft' + i} d={d} fill={color} opacity="0.18" />)}
      {body.map((d, i) => (
        <path key={'b' + i} d={d}
          fill={isDuo ? 'none' : bodyFill}
          stroke={variant === 'outline' || isDuo ? color : (variant === 'gradient' ? 'none' : 'none')}
          strokeWidth={sw} />
      ))}
      {detail.map((d, i) => (
        <path key={'d' + i} d={d} fill="none" stroke={variant === 'outline' || isDuo ? color : detailStroke} strokeWidth={sw} />
      ))}
    </svg>
  );
}

/* ============================================================
   LIVE WIDGET RENDERERS
   ============================================================ */

function useNow(active = true, ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

function WeatherGlyph({ kind, size = 40, color }) {
  const c = color || 'currentColor';
  if (kind === 'sun') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" fill={c} stroke="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return <line key={a} x1={12 + Math.cos(r) * 7.4} y1={12 + Math.sin(r) * 7.4} x2={12 + Math.cos(r) * 9.4} y2={12 + Math.sin(r) * 9.4} />; })}
    </svg>
  );
  if (kind === 'cloud') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c} stroke="none">
      <path d="M7 18 a4 4 0 0 1 -0.4 -8 A5 5 0 0 1 16.4 8.6 A3.7 3.7 0 0 1 16.8 18 Z" />
    </svg>
  );
  return ( // rain
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 15 a4 4 0 0 1 -0.4 -8 A5 5 0 0 1 16.4 5.6 A3.7 3.7 0 0 1 16.8 15 Z" fill={c} />
      <g stroke={c} strokeWidth="1.7" strokeLinecap="round" opacity="0.65">
        <line x1="9" y1="17.5" x2="8" y2="20.5" /><line x1="13" y1="17.5" x2="12" y2="20.5" /><line x1="17" y1="17.5" x2="16" y2="20.5" />
      </g>
    </svg>
  );
}

function fmtTime(date, tz, format, seconds) {
  try {
    const o = { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: format === '12' };
    if (seconds) o.second = '2-digit';
    let s = new Intl.DateTimeFormat('en-US', o).format(date);
    return s.replace(/\s?(AM|PM)/i, '');
  } catch (e) { return '—'; }
}
function fmtAmPm(date, tz, format) {
  if (format !== '12') return '';
  try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: true }).format(date).replace(/[\d\s]/g, ''); }
  catch (e) { return ''; }
}
function fmtDate(date, tz) {
  try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }).format(date); }
  catch (e) { return ''; }
}

/* ---------------- CLOCK ---------------- */
function ClockW({ config: c, accent, s, mini }) {
  const now = useNow(true, c.seconds ? 1000 : 1000);
  const ampm = fmtAmPm(now, c.tz, c.format);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 * s, padding: 18 * s }}>
      {c.label ? <div style={{ fontSize: 12 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600, marginBottom: 2 * s }}>{c.label}</div> : null}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s }}>
        <div style={{ fontSize: 52 * s, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(now, c.tz, c.format, c.seconds)}</div>
        {ampm ? <div style={{ fontSize: 17 * s, fontWeight: 600, color: accent }}>{ampm}</div> : null}
      </div>
      {c.showDate ? <div style={{ fontSize: 13.5 * s, color: 'var(--w-mut)', marginTop: 4 * s }}>{fmtDate(now, c.tz)}</div> : null}
    </div>
  );
}

/* ---------------- COUNTDOWN ---------------- */
function CountdownW({ config: c, accent, s }) {
  const now = useNow(true, 1000);
  const target = useMemo(() => c.target ? new Date(c.target + 'T00:00:00') : new Date(Date.now() + 32 * 864e5), [c.target]);
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / 864e5); diff -= d * 864e5;
  const h = Math.floor(diff / 36e5); diff -= h * 36e5;
  const m = Math.floor(diff / 6e4); diff -= m * 6e4;
  const sec = Math.floor(diff / 1000);
  const cell = (n, l) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 * s }}>
      <div style={{ fontSize: 34 * s, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{String(n).padStart(2, '0')}</div>
      <div style={{ fontSize: 10 * s, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--w-mut)', fontWeight: 600 }}>{l}</div>
    </div>
  );
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 * s, padding: 18 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
        <span style={{ width: 7 * s, height: 7 * s, borderRadius: 99, background: accent }} />
        <div style={{ fontSize: 14 * s, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.title || 'Countdown'}</div>
      </div>
      <div style={{ display: 'flex', gap: 14 * s }}>
        {cell(d, 'days')}<Sep s={s} />{cell(h, 'hrs')}<Sep s={s} />{cell(m, 'min')}<Sep s={s} />{cell(sec, 'sec')}
      </div>
    </div>
  );
}
function Sep({ s }) { return <div style={{ fontSize: 28 * s, fontWeight: 300, color: 'var(--w-line)', lineHeight: 1, alignSelf: 'flex-start', marginTop: 2 * s }}>:</div>; }

/* ---------------- POMODORO ---------------- */
function PomodoroW({ config: c, accent, s, mini }) {
  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState(c.work * 60);
  const [run, setRun] = useState(false);
  useEffect(() => { setLeft((mode === 'focus' ? c.work : c.brk) * 60); }, [c.work, c.brk, mode]);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setLeft(l => {
      if (l <= 1) { const nm = mode === 'focus' ? 'break' : 'focus'; setMode(nm); return (nm === 'focus' ? c.work : c.brk) * 60; }
      return l - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [run, mode, c.work, c.brk]);
  const total = (mode === 'focus' ? c.work : c.brk) * 60;
  const pct = 1 - left / total;
  const R = 52, C = 2 * Math.PI * R;
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 * s, padding: 16 * s }}>
      <div style={{ position: 'relative', width: 132 * s, height: 132 * s }}>
        <svg width={132 * s} height={132 * s} viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--w-line)" strokeWidth="8" />
          <circle cx="64" cy="64" r={R} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * s }}>
          <div style={{ fontSize: 30 * s, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{mm}:{ss}</div>
          <div style={{ fontSize: 10 * s, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>{mode}</div>
        </div>
      </div>
      {!mini && (
        <div style={{ display: 'flex', gap: 8 * s }}>
          <button onClick={() => setRun(r => !r)} style={{ height: 34 * s, padding: `0 ${16 * s}px`, borderRadius: 8 * s, background: accent, color: onColor(accent), fontSize: 13 * s, fontWeight: 600 }}>{run ? 'Pause' : 'Start'}</button>
          <button onClick={() => { setRun(false); setMode('focus'); setLeft(c.work * 60); }} style={{ height: 34 * s, padding: `0 ${14 * s}px`, borderRadius: 8 * s, background: 'var(--w-line)', color: 'var(--w-fg)', fontSize: 13 * s, fontWeight: 600 }}>Reset</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- WEATHER ---------------- */
function WeatherW({ config: c, accent, s }) {
  const d = WEATHER_DATA[c.city] || WEATHER_DATA.Lisbon;
  const conv = t => c.units === 'F' ? Math.round(t * 9 / 5 + 32) : t;
  const u = c.units === 'F' ? '°F' : '°C';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 * s, padding: 20 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14 * s, fontWeight: 600 }}>{c.city}</div>
          <div style={{ fontSize: 12 * s, color: 'var(--w-mut)' }}>{d.cond}</div>
        </div>
        <div style={{ color: accent }}><WeatherGlyph kind={d.icon} size={44 * s} color={accent} /></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 * s }}>
        <div style={{ fontSize: 48 * s, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{conv(d.c)}<span style={{ fontSize: 20 * s, fontWeight: 600, color: 'var(--w-mut)' }}>{u}</span></div>
        <div style={{ fontSize: 12.5 * s, color: 'var(--w-mut)' }}>H {conv(d.hi)}°&nbsp;&nbsp;L {conv(d.lo)}°</div>
      </div>
      {c.forecast && (
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--w-line)', paddingTop: 12 * s }}>
          {d.fc.map(([day, ic, t]) => (
            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 * s }}>
              <div style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{day}</div>
              <WeatherGlyph kind={ic} size={20 * s} color="var(--w-fg)" />
              <div style={{ fontSize: 12 * s, fontWeight: 600 }}>{conv(t)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- QUOTE ---------------- */
function QuoteW({ config: c, accent, s, fontStack }) {
  const list = QUOTES[c.collection] || QUOTES.Stoic;
  const [i, setI] = useState(0);
  const q = list[i % list.length];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 * s, padding: 22 * s, position: 'relative' }}>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 40 * s, lineHeight: 0.6, color: accent, height: 16 * s }}>“</div>
      <div style={{ fontSize: 17 * s, lineHeight: 1.45, fontWeight: 500, letterSpacing: '-0.01em', textWrap: 'pretty' }}>{q.t}</div>
      {c.author ? <div style={{ fontSize: 12.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>— {q.a}</div> : null}
      <button onClick={() => setI(i + 1)} title="New quote" style={{ position: 'absolute', top: 14 * s, right: 14 * s, width: 28 * s, height: 28 * s, borderRadius: 8 * s, display: 'grid', placeItems: 'center', color: 'var(--w-mut)', border: '1px solid var(--w-line)' }}>
        <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
      </button>
    </div>
  );
}

/* ---------------- HABIT ---------------- */
function HabitW({ config: c, accent, s }) {
  const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const [done, setDone] = useState(() => [true, true, true, false, false, false, false]);
  const streak = (() => { let n = 0; for (const x of done) { if (x) n++; else break; } return n; })();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 * s, padding: 20 * s }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14.5 * s, fontWeight: 600 }}>{c.habit}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, color: accent, fontWeight: 700, fontSize: 13 * s }}>
          <Icon name="flame" color={accent} variant="filled" size={15 * s} /> {streak}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 * s }}>
        {D.map((dl, i) => (
          <button key={i} onClick={() => setDone(p => p.map((v, j) => j === i ? !v : v))}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * s }}>
            <span style={{ width: 30 * s, height: 30 * s, borderRadius: 99, display: 'grid', placeItems: 'center',
              background: done[i] ? accent : 'transparent', border: `1.5px solid ${done[i] ? accent : 'var(--w-line)'}`, transition: 'all 0.2s var(--ease)' }}>
              {done[i] && <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke={onColor(accent)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>}
            </span>
            <span style={{ fontSize: 10.5 * s, color: 'var(--w-mut)', fontWeight: 600 }}>{dl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- CALENDAR ---------------- */
function CalendarW({ accent, s }) {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), today = now.getDate();
  const first = new Date(y, mo, 1).getDay();
  const offset = (first + 6) % 7; // Monday-first
  const days = new Date(y, mo + 1, 0).getDate();
  const cells = []; for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 * s, padding: 18 * s }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * s }}>
        <div style={{ fontSize: 15 * s, fontWeight: 700 }}>{monthName}</div>
        <div style={{ fontSize: 13 * s, color: 'var(--w-mut)' }}>{y}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 * s }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9.5 * s, color: 'var(--w-mut)', fontWeight: 600, paddingBottom: 3 * s }}>{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11.5 * s, padding: `${4.5 * s}px 0`, borderRadius: 7 * s, fontWeight: d === today ? 700 : 500,
            color: d === today ? onColor(accent) : (d ? 'var(--w-fg)' : 'transparent'), background: d === today ? accent : 'transparent', fontVariantNumeric: 'tabular-nums' }}>{d || '·'}</div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- DISPATCHER ---------------- */
function Widget({ type, config, accent, fontStack, sizeScale = 1, theme = 'light', mini = false, radius = 0 }) {
  const s = sizeScale;
  const map = { clock: ClockW, countdown: CountdownW, pomodoro: PomodoroW, weather: WeatherW, quote: QuoteW, habit: HabitW, calendar: CalendarW };
  const C = map[type] || ClockW;
  return (
    <div className="w" data-wt={theme} style={{ '--w-accent': accent, fontFamily: fontStack, borderRadius: radius }}>
      <C config={config || {}} accent={accent} s={s} fontStack={fontStack} mini={mini} />
    </div>
  );
}

/* ============================================================
   SHARED UI PRIMITIVES + MOCK DOCS CANVAS
   ============================================================ */

function useLocalStorage(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : initial; } catch (e) { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }, [key, v]);
  return [v, setV];
}

function BrandMark({ size = 28 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
        <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
      </svg>
    </span>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.icon}{o.l}
        </button>
      ))}
    </div>
  );
}

function ProBadge({ small }) {
  return <span className="badge badge-pro" style={small ? { height: 20, fontSize: 10.5 } : {}}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.3L21 9l-5 4.6L17.5 21 12 17.5 6.5 21 8 13.6 3 9l6.6-0.7z" /></svg>
    Pro
  </span>;
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 40, height: 24, borderRadius: 99, padding: 2, background: on ? 'var(--ink)' : 'var(--surface-3)',
      transition: 'background 0.2s var(--ease)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: 99, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s var(--ease)' }} />
    </button>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const dark = theme === 'dark';
  return (
    <button className="btn btn-icon btn-subtle" onClick={() => setTheme(dark ? 'light' : 'dark')} title="Toggle theme" aria-label="Toggle theme">
      {dark
        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" /></svg>
        : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 10 4a6.8 6.8 0 0 0 10 10.5z" /></svg>}
    </button>
  );
}

function ColorField({ value, onChange }) {
  return (
    <div className="swatch-row">
      {ACCENTS.map(c => (
        <button key={c} className={'swatch' + (value.toLowerCase() === c.toLowerCase() ? ' on' : '')} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
      ))}
      <label className="swatch-hex" title="Custom hex">
        <span style={{ width: 14, height: 14, borderRadius: 4, background: value, border: '1px solid var(--border-strong)' }} />
        {value.toUpperCase()}
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'auto' }} />
      </label>
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const tref = useRef();
  const copy = (text) => {
    try { navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(true); clearTimeout(tref.current); tref.current = setTimeout(() => setCopied(false), 1600);
  };
  return [copied, copy];
}

function CopyBar({ url, onSave, saved, proCaption }) {
  const [copied, copy] = useCopy();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="copybar">
        <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)', flex: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        </span>
        <span className="copy-url" title={url}>{url}</span>
        <button className={'btn btn-primary copy-btn' + (copied ? ' copied' : '')} style={{ flex: 'none' }} onClick={() => copy(url)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          Copy embed link
          <span className="copy-check"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg></span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-3)', fontSize: 12.5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          In your page, type <span className="mono" style={{ color: 'var(--text-2)' }}>/embed</span> and paste
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onSave} style={saved ? { color: 'var(--pro)', borderColor: 'var(--pro-border)' } : {}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.3C12 20.3 3.8 14.7 3.8 9.2A4.4 4.4 0 0 1 12 6.8A4.4 4.4 0 0 1 20.2 9.2C20.2 14.7 12 20.3 12 20.3Z" /></svg>
          {saved ? 'Saved' : 'Save to favorites'}
        </button>
      </div>
    </div>
  );
}

function DocsCanvas({ docTheme, accent, children, title = 'My Dashboard', emoji = 'home' }) {
  const pages = [
    { ic: 'home', l: 'My Dashboard', on: true }, { ic: 'calendar', l: 'Weekly Planner' },
    { ic: 'target', l: 'Goals 2026' }, { ic: 'book', l: 'Reading List' }, { ic: 'wallet', l: 'Budget' },
  ];
  const fg = docTheme === 'dark' ? '#d9d8d2' : '#2c2b28';
  return (
    <div className="stage" data-doc={docTheme}>
      <div className="doc">
        <div className="doc-side">
          <div className="doc-ws"><span className="doc-ws-mark" /><span className="doc-ws-name">Acme HQ</span></div>
          <div className="doc-srow"><svg className="di" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>Search</div>
          <div style={{ height: 10 }} />
          {pages.map((p, i) => (
            <div key={i} className={'doc-srow' + (p.on ? ' on' : '')}>
              <span className="di"><Icon name={p.ic} color={p.on ? accent : fg} variant={p.on ? 'filled' : 'outline'} size={15} /></span>{p.l}
            </div>
          ))}
        </div>
        <div className="doc-main scroll" style={{ overflowY: 'auto' }}>
          <div className="doc-cover" />
          <div className="doc-body">
            <div className="doc-emoji"><Icon name={emoji} color={accent} variant="filled" size={30} /></div>
            <div className="doc-title">{title}</div>
            <div className="doc-meta">Last edited just now · 5 blocks</div>
            <div className="doc-p" style={{ width: '92%' }} />
            <div className="doc-p" style={{ width: '74%' }} />
            <div className="doc-h">This week at a glance</div>
            {children}
            <div className="doc-p" style={{ width: '84%', marginTop: 18 }} />
            <div className="doc-p" style={{ width: '63%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedBlock({ children, showCaption = true, height = 230 }) {
  return (
    <div className="embed-block">
      <div style={{ height }}>{children}</div>
      {showCaption && (
        <div className="embed-cap">
          <BrandMark size={15} /> <span>Notion Crafts widget</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>embed</span>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

const SITE_ORIGIN = 'https://notioncrafts.com';

function buildEmbedUrl(widgetId, cfg) {
  const p = new URLSearchParams();
  Object.entries(cfg).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v === true ? '1' : v); });
  return `${SITE_ORIGIN}/e/${widgetId}?${p.toString()}`;
}

/* ============================================================
   GALLERIES — widget gallery + icon gallery
   ============================================================ */

const WIDGET_ACCENT = { clock: '#18181a', countdown: '#E0603A', pomodoro: '#6D4FD6', weather: '#2A6FDB', quote: '#1F8A5B', habit: '#C2417B', calendar: '#0E9DA6' };

function WidgetCard({ widget, onOpen }) {
  const accent = WIDGET_ACCENT[widget.type] || '#18181a';
  return (
    <div className="wcard" onClick={() => onOpen(widget)}>
      <div className="wcard-prev">
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Widget type={widget.type} config={widget.config || {}} accent={accent} fontStack="'Hanken Grotesk', sans-serif" sizeScale={0.64} theme="light" mini />
        </div>
        {widget.pro ? <div style={{ position: 'absolute', top: 10, right: 10 }}><ProBadge /></div> : null}
      </div>
      <div className="wcard-body">
        <div className="wcard-row">
          <span className="wcard-name">{widget.name}</span>
          <span className="btn btn-subtle btn-sm" style={{ pointerEvents: 'none' }}>Customize
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
        <div className="wcard-desc">{widget.desc}</div>
        <div className="tagrow">{widget.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
      </div>
    </div>
  );
}

function WidgetGallery({ onOpen }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const list = WIDGETS.filter(w =>
    (cat === 'All' || w.category === cat) &&
    (q === '' || (w.name + w.desc + w.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="fadein">
        <div className="eyebrow">The library</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginTop: 10, marginBottom: 10 }}>Widgets that feel native</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 520 }}>Every widget is a live, customizable mini-app. Tune it, then copy one embed link into your page.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: '30px 0 22px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {WIDGET_CATEGORIES.map(c => <button key={c} className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div style={{ position: 'relative', minWidth: 230 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </span>
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Search widgets…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {list.length ? (
        <div className="wgrid">{list.map(w => <WidgetCard key={w.id} widget={w} onOpen={onOpen} />)}</div>
      ) : (
        <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-2)' }}>No widgets match “{q}”</div>
          <div style={{ marginTop: 6 }}>Try a different search or category.</div>
        </div>
      )}
    </div>
  );
}

function IconCell({ ic, accent, variant, locked, onUnlock }) {
  const [copied, copy] = useCopy();
  const url = `${SITE_ORIGIN}/i/${ic.k}?c=${accent.replace('#', '')}&s=${variant}`;
  const onClick = () => { if (locked) return onUnlock('Gradient icons'); copy(url); };
  return (
    <div className="icell" onClick={onClick}>
      <Icon name={ic.k} color={accent} variant={locked ? 'outline' : variant} size={38} />
      <span className="icell-label">{ic.l}</span>
      {locked && <span style={{ position: 'absolute', top: 8, right: 8, color: 'var(--pro)' }}><LockIcon /></span>}
      <div className={'icell-copy' + (copied ? ' copied' : '')}>
        {copied
          ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>Copied URL</>
          : locked
            ? <><LockIcon /> Unlock</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>Copy image URL</>}
      </div>
    </div>
  );
}

function IconGallery({ isPro, onUnlock }) {
  const [accent, setAccent] = useState('#18181a');
  const [variant, setVariant] = useState('outline');
  const [q, setQ] = useState('');
  const list = ICON_SET.filter(i => q === '' || i.l.toLowerCase().includes(q.toLowerCase()) || i.k.includes(q.toLowerCase()));
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="fadein">
        <div className="eyebrow">Page icons</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginTop: 10, marginBottom: 10 }}>Recolor anything, instantly</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 520 }}>Pick a color and style, then copy an image URL straight into a page icon. The whole grid recolors as you go.</p>
      </div>

      <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 0px)', zIndex: 20, margin: '26px 0 22px' }}>
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
          <div className="field" style={{ gap: 8 }}>
            <span className="field-label">Color</span>
            <ColorField value={accent} onChange={setAccent} />
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
          <div className="field" style={{ gap: 8 }}>
            <span className="field-label">Style</span>
            <div className="seg">
              {ICON_STYLES.map(st => (
                <button key={st.v} className={variant === st.v ? 'on' : ''} onClick={() => st.pro && !isPro ? onUnlock('Gradient icons') : setVariant(st.v)}>
                  {st.l}{st.pro && !isPro ? <span style={{ color: 'var(--pro)', marginLeft: 2 }}><LockIcon /></span> : null}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder="Search icons…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="igrid">
        {list.map(ic => <IconCell key={ic.k} ic={ic} accent={accent} variant={variant} locked={variant === 'gradient' && !isPro} onUnlock={onUnlock} />)}
      </div>
      {!list.length && <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>No icons match “{q}”.</div>}
    </div>
  );
}

/* ============================================================
   WIDGET CONFIGURATOR (hero screen)
   ============================================================ */

const SIZE_SCALE = { S: 0.82, M: 1, L: 1.16 };
const SIZE_HEIGHT = { S: 196, M: 232, L: 270 };

function CtrlGroup({ label, children, right }) {
  return (
    <div className="field" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      <div className="field-row"><span className="field-label">{label}</span>{right}</div>
      {children}
    </div>
  );
}

function LockRow({ children, locked, onUnlock }) {
  if (!locked) return children;
  return (
    <div className="locked" style={{ position: 'relative' }} onClick={onUnlock}>
      <div style={{ opacity: 0.5, pointerEvents: 'none', filter: 'saturate(0.6)' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />
    </div>
  );
}

function Configurator({ widget, setWidget, isPro, onUnlock, favorites, toggleFav, seedAccent }) {
  const [config, setConfig] = useState(widget.config || {});
  const [accent, setAccent] = useState(seedAccent || (widget.id === 'clock' ? '#18181a' : (PACKS.find(p => p.widgets.includes(widget.id))?.accent || '#2A6FDB')));
  const [fontV, setFontV] = useState('sans');
  const [sizeV, setSizeV] = useState('M');
  const [wTheme, setWTheme] = useState('light');
  const [docTheme, setDocTheme] = useState('light');
  const [removeCap, setRemoveCap] = useState(false);

  useEffect(() => { setConfig(widget.config || {}); }, [widget.id]);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));
  const fontObj = FONTS.find(f => f.v === fontV) || FONTS[0];
  const fontLocked = fontObj.pro && !isPro;
  const effFont = fontLocked ? FONTS[0] : fontObj;
  const effTheme = wTheme === 'auto' ? docTheme : wTheme;
  const widgetLocked = widget.pro && !isPro;
  const s = SIZE_SCALE[sizeV];

  const favKey = widget.id;
  const saved = favorites.includes(favKey);

  const urlCfg = { ...config, theme: wTheme, accent: accent.replace('#', ''), font: effFont.v, size: sizeV.toLowerCase() };
  const url = buildEmbedUrl(widget.id, urlCfg);

  const switchTo = (w) => setWidget(w);

  return (
    <div style={{ height: 'calc(100vh - var(--nav-h))', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 366px', gridTemplateRows: 'minmax(0,1fr)', overflow: 'hidden' }} className="cfg">
      {/* ---- LEFT: stage ---- */}
      <div style={{ position: 'relative', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, background: 'var(--bg)' }}>
        {/* widget switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="eyebrow" style={{ marginRight: 2 }}>Studio</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {WIDGETS.map(w => (
              <button key={w.id} onClick={() => switchTo(w)} className={'chip' + (w.id === widget.id ? ' active' : '')} style={{ height: 30, paddingLeft: 10, paddingRight: 12, fontSize: 12.5 }}>
                <Icon name={w.type === 'pomodoro' ? 'clock' : w.type === 'countdown' ? 'target' : w.type === 'quote' ? 'book' : w.type === 'habit' ? 'flame' : w.type === 'weather' ? 'cloud' : w.type === 'calendar' ? 'calendar' : 'clock'} color={w.id === widget.id ? 'var(--on-ink)' : 'var(--text-3)'} variant={w.id === widget.id ? 'filled' : 'outline'} size={14} />
                {w.name}{w.pro ? <span style={{ width: 5, height: 5, borderRadius: 99, background: w.id === widget.id ? 'var(--on-ink)' : 'var(--pro)' }} /> : null}
              </button>
            ))}
          </div>
        </div>
        {/* stage */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <DocsCanvas docTheme={docTheme} accent={accent} emoji={widget.type === 'weather' ? 'cloud' : widget.type === 'habit' ? 'flame' : widget.type === 'pomodoro' ? 'target' : 'home'}>
            <EmbedBlock showCaption={!(removeCap && isPro)} height={SIZE_HEIGHT[sizeV]}>
              <div style={{ position: 'relative', height: '100%' }}>
                <Widget type={widget.type} config={config} accent={accent} fontStack={effFont.stack} sizeScale={s} theme={effTheme} />
                {widgetLocked && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}><ProBadge /></div>
                )}
              </div>
            </EmbedBlock>
          </DocsCanvas>
          {/* canvas theme toggle */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', padding: 4, borderRadius: 99, boxShadow: 'var(--shadow-md)' }}>
            {['light', 'dark'].map(t => (
              <button key={t} onClick={() => setDocTheme(t)} title={`${t} page`} style={{ width: 30, height: 30, borderRadius: 99, display: 'grid', placeItems: 'center', background: docTheme === t ? 'var(--ink)' : 'transparent', color: docTheme === t ? 'var(--on-ink)' : 'var(--text-3)' }}>
                {t === 'light'
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 10 4a6.8 6.8 0 0 0 10 10.5z" /></svg>}
              </button>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--good)' }} /> Live preview · updates instantly
          </div>
        </div>
      </div>

      {/* ---- RIGHT: controls ---- */}
      <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600 }}>{widget.name}</h3>
                {widget.pro ? <ProBadge small /> : null}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, maxWidth: 280 }}>{widget.desc}</div>
            </div>
          </div>

          {/* theme */}
          <CtrlGroup label="Theme">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Segmented value={wTheme === 'auto' && !isPro ? 'light' : wTheme} onChange={v => v === 'auto' && !isPro ? onUnlock('Auto theme') : setWTheme(v)} options={[{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }, { v: 'auto', l: 'Auto' }]} />
              {!isPro && <span className="lock-pill" onClick={() => onUnlock('Auto theme')} style={{ cursor: 'pointer' }}><LockIcon />Auto</span>}
            </div>
          </CtrlGroup>

          {/* accent */}
          <CtrlGroup label="Accent color">
            <ColorField value={accent} onChange={setAccent} />
          </CtrlGroup>

          {/* font */}
          <CtrlGroup label="Font">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(86px,1fr))', gap: 7 }}>
              {FONTS.map(f => {
                const lk = f.pro && !isPro;
                return (
                  <button key={f.v} onClick={() => lk ? onUnlock('Premium fonts') : setFontV(f.v)}
                    style={{ height: 46, borderRadius: 9, border: `1px solid ${fontV === f.v && !lk ? 'var(--ink)' : 'var(--border-strong)'}`, background: fontV === f.v && !lk ? 'var(--surface-2)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 11px', gap: 1, position: 'relative', opacity: lk ? 0.7 : 1 }}>
                    <span style={{ fontFamily: f.stack, fontSize: 17, lineHeight: 1, color: 'var(--text)' }}>Ag</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600 }}>{f.l}</span>
                    {lk && <span style={{ position: 'absolute', top: 6, right: 6, color: 'var(--pro)' }}><LockIcon /></span>}
                  </button>
                );
              })}
            </div>
          </CtrlGroup>

          {/* size */}
          <CtrlGroup label="Size">
            <Segmented value={sizeV} onChange={setSizeV} options={[{ v: 'S', l: 'Small' }, { v: 'M', l: 'Medium' }, { v: 'L', l: 'Large' }]} />
          </CtrlGroup>

          {/* widget-specific */}
          <WidgetOptions widget={widget} config={config} set={set} />

          {/* pro extras */}
          <CtrlGroup label="Finishing" right={!isPro ? <span className="lock-pill" style={{ cursor: 'pointer' }} onClick={() => onUnlock('Remove caption')}><LockIcon />Pro</span> : null}>
            <div className="field-row">
              <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Remove “Notion Crafts” caption</span>
              <Toggle on={removeCap && isPro} onChange={v => isPro ? setRemoveCap(v) : onUnlock('Remove caption')} />
            </div>
          </CtrlGroup>
        </div>

        {/* sticky copy footer */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {widgetLocked ? (
            <button className="btn btn-primary btn-lg" style={{ width: '100%', background: 'var(--pro)', color: '#fff' }} onClick={() => onUnlock(widget.name)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.3L21 9l-5 4.6L17.5 21 12 17.5 6.5 21 8 13.6 3 9l6.6-0.7z" /></svg>
              Unlock {widget.name} with Pro
            </button>
          ) : (
            <CopyBar url={url} saved={saved} onSave={() => toggleFav(favKey)} />
          )}
        </div>
      </div>
    </div>
  );
}

function LockIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>;
}

function WidgetOptions({ widget, config: c, set }) {
  const t = widget.type;
  if (t === 'clock') return (
    <>
      <CtrlGroup label="Timezone"><select className="select" value={c.tz} onChange={e => set('tz', e.target.value)}>{TIMEZONES.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}</select></CtrlGroup>
      <CtrlGroup label="Format"><Segmented value={c.format} onChange={v => set('format', v)} options={[{ v: '12', l: '12-hour' }, { v: '24', l: '24-hour' }]} /></CtrlGroup>
      <CtrlGroup label="Display">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show seconds</span><Toggle on={c.seconds} onChange={v => set('seconds', v)} /></div>
          <div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show date</span><Toggle on={c.showDate} onChange={v => set('showDate', v)} /></div>
        </div>
      </CtrlGroup>
      <CtrlGroup label="Label (optional)"><input className="input" placeholder="e.g. New York office" value={c.label} onChange={e => set('label', e.target.value)} /></CtrlGroup>
    </>
  );
  if (t === 'countdown') return (
    <>
      <CtrlGroup label="Title"><input className="input" value={c.title} onChange={e => set('title', e.target.value)} placeholder="What are you counting to?" /></CtrlGroup>
      <CtrlGroup label="Target date"><input className="input" type="date" value={c.target} onChange={e => set('target', e.target.value)} /></CtrlGroup>
    </>
  );
  if (t === 'pomodoro') return (
    <>
      <CtrlGroup label="Focus length" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.work} min</span>}><input className="range" type="range" min="5" max="60" step="5" value={c.work} onChange={e => set('work', +e.target.value)} /></CtrlGroup>
      <CtrlGroup label="Break length" right={<span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.brk} min</span>}><input className="range" type="range" min="1" max="20" step="1" value={c.brk} onChange={e => set('brk', +e.target.value)} /></CtrlGroup>
    </>
  );
  if (t === 'weather') return (
    <>
      <CtrlGroup label="City"><select className="select" value={c.city} onChange={e => set('city', e.target.value)}>{WEATHER_CITIES.map(z => <option key={z} value={z}>{z}</option>)}</select></CtrlGroup>
      <CtrlGroup label="Units"><Segmented value={c.units} onChange={v => set('units', v)} options={[{ v: 'C', l: 'Celsius' }, { v: 'F', l: 'Fahrenheit' }]} /></CtrlGroup>
      <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>4-day forecast</span><Toggle on={c.forecast} onChange={v => set('forecast', v)} /></div></CtrlGroup>
    </>
  );
  if (t === 'quote') return (
    <>
      <CtrlGroup label="Collection"><select className="select" value={c.collection} onChange={e => set('collection', e.target.value)}>{Object.keys(QUOTES).map(k => <option key={k} value={k}>{k}</option>)}</select></CtrlGroup>
      <CtrlGroup label="Display"><div className="field-row"><span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Show author</span><Toggle on={c.author} onChange={v => set('author', v)} /></div></CtrlGroup>
    </>
  );
  if (t === 'habit') return (
    <CtrlGroup label="Habit name"><input className="input" value={c.habit} onChange={e => set('habit', e.target.value)} placeholder="e.g. Read 20 min" /></CtrlGroup>
  );
  if (t === 'calendar') return (
    <CtrlGroup label="About"><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>Shows the current month and highlights today automatically. Recolor it with your accent.</div></CtrlGroup>
  );
  return null;
}

/* ============================================================
   PACKS · PRICING · UNLOCK MODAL
   ============================================================ */

function PackCard({ pack, onOpen }) {
  return (
    <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.22s var(--ease), box-shadow 0.22s var(--ease)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      onClick={() => onOpen(pack)}>
      {/* header band tinted with pack accent */}
      <div style={{ padding: '20px 22px', background: `color-mix(in srgb, ${pack.accent} 8%, var(--surface))`, borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow" style={{ color: pack.accent }}>{pack.kicker}</div>
          {pack.pro ? <ProBadge small /> : null}
        </div>
        <h3 className="serif" style={{ fontSize: 26, marginTop: 8 }}>{pack.name}</h3>
        {/* icon cluster */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {pack.icons.slice(0, 6).map((k, i) => (
            <div key={k} style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <Icon name={k} color={pack.accent} variant={i % 2 ? 'filled' : 'outline'} size={22} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '18px 22px 20px' }}>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, marginBottom: 16, textWrap: 'pretty' }}>{pack.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pack.widgets.map(wid => { const w = WIDGETS.find(x => x.id === wid); return <span key={wid} className="tag" style={{ background: 'var(--surface-2)' }}>{w?.name}</span>; })}
          </div>
          <span style={{ color: pack.accent, fontWeight: 600, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>Open
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}

function Setups({ onOpenPack }) {
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="fadein">
        <div className="eyebrow">Curated setups</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginTop: 10, marginBottom: 10 }}>Packs to start a page in one sitting</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 540 }}>Each pack pairs a color, a set of icons, and matching widgets — so a new page looks considered from the first block.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 18, marginTop: 32 }}>
        {PACKS.map(p => <PackCard key={p.id} pack={p} onOpen={onOpenPack} />)}
      </div>
    </div>
  );
}

function PackModal({ pack, onClose, onUseWidget }) {
  const [wi, setWi] = useState(0);
  const w = WIDGETS.find(x => x.id === pack.widgets[wi]);
  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="eyebrow" style={{ color: pack.accent }}>{pack.kicker}</div>
        {pack.pro ? <ProBadge small /> : null}
      </div>
      <h2 className="serif" style={{ fontSize: 27, marginBottom: 14 }}>{pack.name}</h2>
      <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
        <Widget type={w.type} config={w.config || {}} accent={pack.accent} fontStack="'Hanken Grotesk', sans-serif" sizeScale={0.92} theme="light" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {pack.widgets.map((wid, i) => { const x = WIDGETS.find(y => y.id === wid); return <button key={wid} className={'chip' + (i === wi ? ' active' : '')} onClick={() => setWi(i)}>{x?.name}</button>; })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" style={{ flex: 1, background: pack.accent, color: onColor(pack.accent) }} onClick={() => onUseWidget(w, pack.accent)}>Customize {w.name}</button>
        <button className="btn btn-ghost btn-lg" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function Pricing({ isPro, onUpgrade }) {
  const [cycle, setCycle] = useState('lifetime');
  const price = cycle === 'lifetime' ? '$29' : '$4';
  const per = cycle === 'lifetime' ? 'one-time' : '/month';
  return (
    <div className="wrap" style={{ paddingTop: 44, paddingBottom: 70, maxWidth: 980 }}>
      <div className="fadein" style={{ textAlign: 'center', marginBottom: 36 }}>
        <div className="eyebrow">Pricing</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,4.6vw,50px)', marginTop: 10, marginBottom: 12 }}>Free to start. Pro when you’re ready.</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 500, margin: '0 auto 22px' }}>No account required, ever. Pro is a one-time unlock stored on this device — upgrade only if you want the premium packs.</p>
        <div className="seg" style={{ margin: '0 auto' }}>
          <button className={cycle === 'monthly' ? 'on' : ''} onClick={() => setCycle('monthly')}>Monthly</button>
          <button className={cycle === 'lifetime' ? 'on' : ''} onClick={() => setCycle('lifetime')}>Lifetime</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="pricing-grid">
        {/* FREE */}
        <div className="card" style={{ padding: 30 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Free</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 4px' }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em' }}>$0</span>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>forever</span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 22 }}>The core library, fully usable.</p>
          <button className="btn btn-ghost" style={{ width: '100%', marginBottom: 22 }} disabled>You’re on Free</button>
          <FeatureList items={FREE_FEATURES} />
        </div>

        {/* PRO */}
        <div className="card" style={{ padding: 30, position: 'relative', borderColor: 'var(--pro-border)', background: 'color-mix(in srgb, var(--pro) 4%, var(--surface))', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ position: 'absolute', top: 22, right: 24 }}><ProBadge /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pro)' }}>Pro</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 4px' }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em' }}>{price}</span>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>{per}</span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 22 }}>Everything in Free, plus the premium library.</p>
          {isPro
            ? <button className="btn" style={{ width: '100%', marginBottom: 22, background: 'var(--pro-soft)', color: 'var(--pro)', border: '1px solid var(--pro-border)' }} disabled>✓ Pro unlocked</button>
            : <button className="btn btn-primary" style={{ width: '100%', marginBottom: 22, background: 'var(--pro)', color: '#fff' }} onClick={() => onUpgrade('Notion Crafts Pro')}>Upgrade to Pro</button>}
          <FeatureList items={PRO_FEATURES} pro />
        </div>
      </div>
      <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 24 }}>Prices shown for demo. Pro state is simulated and saved locally on this device.</p>
    </div>
  );
}

function FeatureList({ items, pro }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((f, i) => (
        <li key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', fontSize: 14, color: 'var(--text)' }}>
          <span style={{ flex: 'none', marginTop: 1, color: pro ? 'var(--pro)' : 'var(--good)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function UnlockModal({ reason, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const go = () => { setLoading(true); setTimeout(() => { onConfirm(); }, 900); };
  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--pro-soft)', color: 'var(--pro)', display: 'grid', placeItems: 'center', border: '1px solid var(--pro-border)' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.3L21 9l-5 4.6L17.5 21 12 17.5 6.5 21 8 13.6 3 9l6.6-0.7z" /></svg>
        </span>
        <div>
          <div style={{ fontSize: 12, color: 'var(--pro)', fontWeight: 600 }}>Pro</div>
          <h2 style={{ fontSize: 19, fontWeight: 600 }}>Unlock {reason || 'Pro'}</h2>
        </div>
      </div>
      <p style={{ color: 'var(--text-2)', fontSize: 14.5, lineHeight: 1.5, marginBottom: 18 }}>
        Get every premium widget, gradient icons, premium fonts and auto-theme — a one-time unlock, no account needed.
      </p>
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, border: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Notion Crafts Pro</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Lifetime · all future widgets</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>$29</div>
      </div>
      <button className="btn btn-primary btn-lg" style={{ width: '100%', background: 'var(--pro)', color: '#fff' }} onClick={go} disabled={loading}>
        {loading
          ? <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: 99, display: 'inline-block' }} />
          : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>Continue to checkout</>}
      </button>
      <button className="btn" style={{ width: '100%', color: 'var(--text-3)', marginTop: 8 }} onClick={onClose}>Maybe later</button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>Demo checkout · unlock is simulated and saved on this device.</p>
    </Modal>
  );
}

/* ============================================================
   HOME / specimen catalogue title page
   ============================================================ */

const INK_SWATCHES = ['#E8431C', '#1B1813', '#2A5BD7', '#1F7A4D', '#6D4FD6', '#C2417B'];

function PlateHead({ no, kicker, title, desc, action }) {
  return (
    <div className="section-head">
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 'clamp(34px,4vw,54px)', color: 'var(--accent)', lineHeight: 0.86, transition: 'color 0.4s var(--ease)', flex: 'none' }}>{no}</div>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{kicker}</div>
          <h2 className="section-title" style={{ marginTop: 10 }}>{title}</h2>
          {desc && <p className="section-desc">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Home({ go, onOpen }) {
  const [ink, setInk] = useState('#E8431C');
  const [iconAccent, setIconAccent] = useState('#E8431C');
  const featured = WIDGETS.filter(w => ['clock', 'pomodoro', 'countdown'].includes(w.id));
  const stripIcons = ['rocket', 'target', 'book', 'flame', 'calendar', 'heart', 'bolt', 'leaf', 'star', 'coffee', 'compass', 'gem'];

  // recolor the ENTIRE page's signature ink, live
  const setPageInk = (c) => {
    setInk(c);
    document.documentElement.style.setProperty('--accent', c);
  };
  useEffect(() => () => { document.documentElement.style.removeProperty('--accent'); }, []);

  const tickerItems = ['Seven live widgets', 'Thirty-six recolorable icons', 'Six icon styles', 'One embed link', 'No account · No setup', 'Tune it live', 'Paste it in'];

  return (
    <div>
      {/* ============ MASTHEAD ============ */}
      <div className="wrap" style={{ paddingTop: 28 }}>
        <div className="fadein" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border-strong)' }}>
          <span className="plate-no">№ 00 — Title Plate</span>
          <span className="mono only-desktop" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Widgets &amp; Icons for Notion</span>
        </div>

        <div className="hero" style={{ textAlign: 'center', paddingBottom: 30 }}>
          <h1 className="serif fadein" style={{ fontSize: 'clamp(54px, 10.5vw, 150px)', lineHeight: 0.92, letterSpacing: '-0.02em', margin: '0 auto', maxWidth: 1100 }}>
            Make your pages feel <em>unmistakably</em> yours.
          </h1>

          <div className="fadein mono" style={{ marginTop: 26, fontSize: 12.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>7 Widgets</span><span style={{ color: 'var(--accent)', transition: 'color 0.4s var(--ease)' }}>·</span>
            <span style={{ whiteSpace: 'nowrap' }}>36 Icons</span><span style={{ color: 'var(--accent)', transition: 'color 0.4s var(--ease)' }}>·</span>
            <span style={{ whiteSpace: 'nowrap' }}>6 Styles</span><span style={{ color: 'var(--accent)', transition: 'color 0.4s var(--ease)' }}>·</span>
            <span style={{ whiteSpace: 'nowrap' }}>No account</span>
          </div>

          <p className="hero-sub fadein" style={{ fontSize: 'clamp(16px,1.7vw,19px)', color: 'var(--text-2)', maxWidth: 560, margin: '24px auto 0', lineHeight: 1.55, textWrap: 'pretty' }}>
            A best-in-class library of customizable widgets and icons for Notion. Tune them live, copy one link, paste it in.
          </p>

          {/* SET THE INK — recolors the whole page, live */}
          <div className="fadein" style={{ marginTop: 30, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span className="field-label" style={{ whiteSpace: 'nowrap' }}>Set the ink</span>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 9, border: '1px solid var(--border-strong)', borderRadius: 99, background: 'var(--surface)' }}>
              {INK_SWATCHES.map(c => (
                <button key={c} aria-label={c}
                  onClick={() => setPageInk(c)}
                  style={{ width: 30, height: 30, borderRadius: 99, background: c, border: 'none', cursor: 'pointer', position: 'relative', transition: 'transform 0.16s var(--ease)', boxShadow: ink === c ? '0 0 0 2px var(--surface), 0 0 0 4px var(--text)' : 'none', transform: ink === c ? 'scale(1.08)' : 'none' }} />
              ))}
            </div>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Watch the whole page follow</span>
          </div>

          <div className="hero-cta fadein" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            <button className="btn btn-accent btn-lg" onClick={() => go('widgets')}>Browse widgets
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go('icons')}>Browse icons</button>
          </div>
        </div>
      </div>

      {/* ============ TICKER ============ */}
      <div className="ticker">
        <div className="ticker-track">
          {[0, 1].map(dup => (
            <div className="ticker-item" key={dup}>
              {tickerItems.map((t, i) => <span key={i}>{t}</span>)}
            </div>
          ))}
        </div>
      </div>

      {/* ============ LIVE EMBED PLATE ============ */}
      <div className="wrap" style={{ paddingTop: 52, paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
          <span className="plate-no">Plate I — Live Embed</span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Recolors with the ink ↑</span>
        </div>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <div className="crop" style={{ height: 432 }}>
            <DocsCanvas docTheme="light" accent={ink} emoji="home">
              <EmbedBlock showCaption height={228}>
                <Widget type="clock" config={{ tz: 'America/New_York', format: '12', seconds: true, showDate: true, label: 'New York' }} accent={ink} fontStack="'Hanken Grotesk', sans-serif" sizeScale={1} theme="light" />
              </EmbedBlock>
            </DocsCanvas>
          </div>
        </div>
      </div>

      {/* ============ № 01 — WIDGETS ============ */}
      <div className="wrap section">
        <PlateHead no="№ 01" kicker="Widgets" title="Live, not screenshots"
          desc="Each one ticks, counts and updates right here. Open any to customize and copy."
          action={<button className="btn btn-ghost" onClick={() => go('widgets')}>See all 7</button>} />
        <div className="wgrid">{featured.map(w => <WidgetCard key={w.id} widget={w} onOpen={onOpen} />)}</div>
      </div>

      {/* ============ № 02 — ICONS (recolor band) ============ */}
      <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-strong)', borderBottom: '1px solid var(--border-strong)' }}>
        <div className="wrap section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
              <div className="serif" style={{ fontSize: 'clamp(34px,4vw,54px)', color: 'var(--accent)', lineHeight: 0.86, transition: 'color 0.4s var(--ease)', flex: 'none' }}>№ 02</div>
              <div>
                <div className="eyebrow">Icons</div>
                <h2 className="section-title" style={{ marginTop: 10 }}>One color recolors them all</h2>
                <p className="section-desc" style={{ marginBottom: 22 }}>Set a hex, pick a style, copy the image URL into any page icon. Pixel-clean at every size.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
                  {['#E8431C', '#1B1813', '#2A5BD7', '#1F7A4D', '#6D4FD6', '#C2417B'].map(c => (
                    <button key={c} className={'swatch' + (iconAccent === c ? ' on' : '')} style={{ background: c, borderRadius: 99, width: 30, height: 30 }} onClick={() => setIconAccent(c)} aria-label={c} />
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => go('icons')}>Open icon gallery
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {stripIcons.map((k, i) => (
              <div key={k} style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', transition: 'transform 0.2s var(--ease)' }}>
                <Icon name={k} color={iconAccent} variant={i % 4 === 3 ? 'duotone' : i % 4 === 1 ? 'filled' : 'outline'} size={34} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ № 03 — PACKS ============ */}
      <div className="wrap section">
        <PlateHead no="№ 03" kicker="Curated setups" title="Matching icons + widgets, bundled"
          desc="Opinionated packs to set up a page in one sitting."
          action={<button className="btn btn-ghost" onClick={() => go('packs')}>All packs</button>} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {PACKS.slice(0, 2).map(p => <PackCard key={p.id} pack={p} onOpen={() => go('packs')} />)}
        </div>
      </div>

      {/* ============ COLOPHON CTA ============ */}
      <div className="wrap" style={{ paddingBottom: 70 }}>
        <div style={{ background: 'var(--ink)', color: 'var(--on-ink)', borderRadius: 'var(--r-lg)', padding: '60px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 20 }}>Colophon</div>
          <h2 className="serif" style={{ fontSize: 'clamp(36px,5vw,64px)', lineHeight: 0.98, marginBottom: 18 }}>Your page, in your palette.</h2>
          <p style={{ opacity: 0.66, maxWidth: 470, margin: '0 auto 30px', fontSize: 16.5, lineHeight: 1.55 }}>Start free with the core library. Upgrade to Pro when you want the premium packs.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-lg" style={{ background: 'var(--accent)', color: 'var(--on-accent)', transition: 'background 0.4s var(--ease)' }} onClick={() => go('widgets')}>Start building</button>
            <button className="btn btn-lg" style={{ background: 'transparent', color: 'var(--on-ink)', border: '1px solid rgba(245,240,225,0.28)' }} onClick={() => go('pricing')}>See Pro</button>
          </div>
        </div>
      </div>

      <Footer go={go} />
    </div>
  );
}

function Footer({ go }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border-strong)', padding: '30px 0', background: 'var(--bg)' }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <BrandMark size={24} />
          <span style={{ fontWeight: 600 }}>Notion Crafts</span>
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11, letterSpacing: '0.04em' }}>· Independent add-on · Not affiliated with Notion Labs</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 6 }}>
          {[['widgets', 'Widgets'], ['icons', 'Icons'], ['packs', 'Packs'], ['pricing', 'Pricing']].map(([p, l]) => (
            <a key={p} className="nav-link" onClick={() => go(p)} style={{ cursor: 'pointer' }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   APP SHELL — routing, theme, favorites, Pro state, modals
   ============================================================ */

function NavLink({ active, onClick, children }) {
  return <button className={'nav-link' + (active ? ' active' : '')} onClick={onClick}>{children}</button>;
}

function App() {
  const [theme, setTheme] = useLocalStorage('nc-theme', 'light');
  const [isPro, setIsPro] = useLocalStorage('nc-pro', false);
  const [favorites, setFavorites] = useLocalStorage('nc-favs', []);
  const [page, setPage] = useState('home');
  const [widget, setWidget] = useState(WIDGETS[0]);
  const [seedAccent, setSeedAccent] = useState(null);
  const [studioKey, setStudioKey] = useState(0);
  const [unlock, setUnlock] = useState(null);
  const [packModal, setPackModal] = useState(null);
  const [toast, setToast] = useState(null);
  const tref = useRef();

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const showToast = (msg) => { setToast(msg); clearTimeout(tref.current); tref.current = setTimeout(() => setToast(null), 2200); };

  const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const openStudio = (w, accent) => {
    setWidget(w); setSeedAccent(accent || null); setStudioKey(k => k + 1); setPage('studio');
    window.scrollTo({ top: 0 });
  };

  const toggleFav = (id) => {
    setFavorites(f => {
      const has = f.includes(id);
      showToast(has ? 'Removed from favorites' : 'Saved to favorites');
      return has ? f.filter(x => x !== id) : [...f, id];
    });
  };

  const onUnlock = (reason) => setUnlock(reason || 'Pro');
  const confirmUnlock = () => { setIsPro(true); setUnlock(null); showToast('Pro unlocked — enjoy the full library'); };

  const navItems = [['widgets', 'Widgets'], ['icons', 'Icons'], ['packs', 'Packs'], ['pricing', 'Pricing']];

  return (
    <div className="app">
      {/* TOP NAV */}
      <nav className="topnav">
        {page === 'studio'
          ? <button className="btn btn-subtle btn-sm" onClick={() => go('widgets')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Library
            </button>
          : <button className="brand" onClick={() => go('home')}><BrandMark /> Notion Crafts <span className="brand-tag only-desktop">Specimen</span></button>}

        {page === 'studio' && <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Studio<span style={{ color: 'var(--text-2)', fontWeight: 600 }}> · {widget.name}</span></div>}

        <div className="nav-links" style={{ marginLeft: 8 }}>
          {page !== 'studio' && navItems.map(([p, l]) => <NavLink key={p} active={page === p} onClick={() => go(p)}>{l}</NavLink>)}
        </div>

        <div className="nav-spacer" />

        <span className="mono only-desktop" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Ed. MMXXVI</span>

        <button className="btn btn-icon btn-subtle" onClick={() => go('favorites')} title="Favorites" style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.length ? 'var(--pro)' : 'none'} stroke={favorites.length ? 'var(--pro)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.3C12 20.3 3.8 14.7 3.8 9.2A4.4 4.4 0 0 1 12 6.8A4.4 4.4 0 0 1 20.2 9.2C20.2 14.7 12 20.3 12 20.3Z" /></svg>
          {favorites.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: 'var(--ink)', color: 'var(--on-ink)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{favorites.length}</span>}
        </button>

        <ThemeToggle theme={theme} setTheme={setTheme} />

        {isPro
          ? <span className="badge badge-pro" style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.3L21 9l-5 4.6L17.5 21 12 17.5 6.5 21 8 13.6 3 9l6.6-0.7z" /></svg>Pro
            </span>
          : <button className="btn btn-primary btn-sm" onClick={() => onUnlock('Notion Crafts Pro')}>Upgrade</button>}
      </nav>

      {/* PAGES */}
      <div className="page">
        {page === 'home' && <Home go={go} onOpen={openStudio} />}
        {page === 'widgets' && <WidgetGallery onOpen={openStudio} />}
        {page === 'icons' && <IconGallery isPro={isPro} onUnlock={onUnlock} />}
        {page === 'packs' && <Setups onOpenPack={setPackModal} />}
        {page === 'pricing' && <Pricing isPro={isPro} onUpgrade={onUnlock} />}
        {page === 'favorites' && <Favorites favorites={favorites} onOpen={openStudio} go={go} />}
        {page === 'studio' && <Configurator key={studioKey} widget={widget} setWidget={setWidget} isPro={isPro} onUnlock={onUnlock} favorites={favorites} toggleFav={toggleFav} seedAccent={seedAccent} />}
      </div>

      {/* OVERLAYS */}
      {packModal && <PackModal pack={packModal} onClose={() => setPackModal(null)} onUseWidget={(w, accent) => { setPackModal(null); openStudio(w, accent); }} />}
      {unlock && <UnlockModal reason={unlock} onClose={() => setUnlock(null)} onConfirm={confirmUnlock} />}
      {toast && <div className="toast"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>{toast}</div>}
    </div>
  );
}

function Favorites({ favorites, onOpen, go }) {
  const list = WIDGETS.filter(w => favorites.includes(w.id));
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="eyebrow">Saved</div>
      <h1 className="serif" style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 10, marginBottom: 24 }}>Your favorites</h1>
      {list.length
        ? <div className="wgrid">{list.map(w => <WidgetCard key={w.id} widget={w} onOpen={onOpen} />)}</div>
        : (
          <div style={{ textAlign: 'center', padding: '70px 24px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)', background: 'var(--surface)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.3C12 20.3 3.8 14.7 3.8 9.2A4.4 4.4 0 0 1 12 6.8A4.4 4.4 0 0 1 20.2 9.2C20.2 14.7 12 20.3 12 20.3Z" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Nothing saved yet</div>
            <p style={{ color: 'var(--text-2)', maxWidth: 340, margin: '0 auto 18px' }}>Tap the heart on any widget in the studio to keep your favorite setups one click away.</p>
            <button className="btn btn-primary" onClick={() => go('widgets')}>Browse widgets</button>
          </div>
        )}
    </div>
  );
}

export default App;
