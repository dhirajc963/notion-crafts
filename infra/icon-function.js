// CloudFront Function (runtime: cloudfront-js-2.0)
// Renders a recolored Notion Crafts icon as an SVG at the edge.
//   GET /i/<name>.svg?c=<hex>&s=<outline|filled|duotone|gradient>
// Returns the SVG directly from the viewer-request event — the S3 origin is
// never hit. Mirrors the <Icon> component in src/components/NotionCrafts.jsx.

var ICONS = {
  home: { b: ['M3.7 11 L12 4 L20.3 11 V19.5 a1.2 1.2 0 0 1 -1.2 1.2 H4.9 A1.2 1.2 0 0 1 3.7 19.5 Z'], d: ['M9.6 20.7 V14 h4.8 v6.7'] },
  star: { b: ['M12 3 L14.6 8.7 L20.8 9.5 L16.2 13.8 L17.5 20 L12 16.8 L6.5 20 L7.8 13.8 L3.2 9.5 L9.4 8.7 Z'] },
  heart: { b: ['M12 20.3 C12 20.3 3.8 14.7 3.8 9.2 A4.4 4.4 0 0 1 12 6.8 A4.4 4.4 0 0 1 20.2 9.2 C20.2 14.7 12 20.3 12 20.3 Z'] },
  calendar: { b: ['M4 7.2 a1.6 1.6 0 0 1 1.6-1.6 h12.8 a1.6 1.6 0 0 1 1.6 1.6 V19.4 a1.6 1.6 0 0 1 -1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 19.4 Z'], d: ['M4 10.4 H20', 'M8.2 4 V7.2', 'M15.8 4 V7.2'] },
  clock: { b: ['M12 21 a9 9 0 1 1 0.01 0 Z'], d: ['M12 7.4 V12 L15.6 13.9'] },
  target: { b: ['M12 21 a9 9 0 1 1 0.01 0 Z'], d: ['M12 16.6 a4.6 4.6 0 1 1 0.01 0', 'M12 12.2 h0.01'] },
  rocket: { b: ['M12 3.2 C15.4 5.2 16.9 9.2 16.4 14 L13 16.8 H11 L7.6 14 C7.1 9.2 8.6 5.2 12 3.2 Z'], d: ['M12 9.6 a1.7 1.7 0 1 0 0.01 0', 'M11 16.8 L9 21', 'M13 16.8 L15 21'] },
  book: { b: ['M6 3.8 H17 a1.5 1.5 0 0 1 1.5 1.5 V20.2 H7.5 A1.5 1.5 0 0 1 6 18.7 Z'], d: ['M9 3.8 V20.2', 'M11.6 8.4 H15.8', 'M11.6 11.6 H15.8'] },
  folder: { b: ['M3.5 7 a1.5 1.5 0 0 1 1.5-1.5 h4 l2 2 h7.5 a1.5 1.5 0 0 1 1.5 1.5 V18 a1.5 1.5 0 0 1 -1.5 1.5 H5 A1.5 1.5 0 0 1 3.5 18 Z'] },
  bolt: { b: ['M13 2.5 L5 13 h5 l-1 8.5 L19 11 h-5 Z'] },
  leaf: { b: ['M4.5 19.5 C4.5 11 10 5 20 4.5 C20 14 14.5 19.5 4.5 19.5 Z'], d: ['M4.5 19.5 C8 15 12 11.5 16.5 9'] },
  flame: { b: ['M12 21 C8.4 21 6 18.5 6 15 C6 11 9 9 9.5 5 C12 7 13 8.5 13 10.5 C14 9.5 14.5 8.5 14.5 7 C16.5 9 18 12 18 15 C18 18.5 15.6 21 12 21 Z'] },
  moon: { b: ['M20 14.5 A8.5 8.5 0 1 1 10 4 A6.8 6.8 0 0 0 20 14.5 Z'] },
  sun: { b: ['M12 16.5 a4.5 4.5 0 1 1 0.01 0 Z'], d: ['M12 2.5 V5', 'M12 19 V21.5', 'M2.5 12 H5', 'M19 12 H21.5', 'M5.2 5.2 L7 7', 'M17 17 L18.8 18.8', 'M18.8 5.2 L17 7', 'M7 17 L5.2 18.8'] },
  cloud: { b: ['M7 19 a4.2 4.2 0 0 1 -0.4 -8.4 A5 5 0 0 1 16.4 9.4 A3.8 3.8 0 0 1 16.8 19 Z'] },
  check: { b: ['M5 12 a7 7 0 1 1 0.01 0 Z'], d: ['M8.5 12.2 L11 14.7 L15.6 9.6'] },
  inbox: { b: ['M3.6 13 L6.4 5.4 a1.5 1.5 0 0 1 1.4-1 h8.4 a1.5 1.5 0 0 1 1.4 1 L20.4 13 V18.5 a1.5 1.5 0 0 1 -1.5 1.5 H5.1 A1.5 1.5 0 0 1 3.6 18.5 Z'], d: ['M3.6 13 H8 a1 1 0 0 1 1 1 a3 3 0 0 0 6 0 a1 1 0 0 1 1 -1 H20.4'] },
  compass: { b: ['M12 21 a9 9 0 1 1 0.01 0 Z'], d: ['M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z'] },
  gem: { b: ['M6 4.5 H18 L21.5 9.5 L12 21 L2.5 9.5 Z'], d: ['M2.5 9.5 H21.5', 'M9 4.5 L7.5 9.5 L12 21', 'M15 4.5 L16.5 9.5 L12 21'] },
  coffee: { b: ['M5 8.5 H17 V15 a4 4 0 0 1 -4 4 H9 a4 4 0 0 1 -4 -4 Z'], d: ['M17 9.5 h1.8 a2.6 2.6 0 0 1 0 5.2 H17', 'M8.5 3 V5', 'M12 3 V5'] },
  music: { b: ['M9 18 a2.5 2.5 0 1 1 -0.01 0 Z', 'M18 15.5 a2.5 2.5 0 1 1 -0.01 0 Z'], d: ['M11.5 18 V6 L20.5 4 V15.5', 'M11.5 9 L20.5 7'] },
  camera: { b: ['M3.6 8.5 a1.5 1.5 0 0 1 1.5-1.5 H8 l1.5-2 h5 L16 7 h3 a1.5 1.5 0 0 1 1.5 1.5 V18 a1.5 1.5 0 0 1 -1.5 1.5 H5.1 A1.5 1.5 0 0 1 3.6 18 Z'], d: ['M12 16.8 a3.6 3.6 0 1 1 0.01 0'] },
  globe: { b: ['M12 21 a9 9 0 1 1 0.01 0 Z'], d: ['M3.2 12 H20.8', 'M12 3 C8 6 8 18 12 21 C16 18 16 6 12 3 Z'] },
  pin: { b: ['M12 21.5 C7 16.5 5.5 13 5.5 9.8 A6.5 6.5 0 0 1 18.5 9.8 C18.5 13 17 16.5 12 21.5 Z'], d: ['M12 12.3 a2.6 2.6 0 1 1 0.01 0'] },
  tag: { b: ['M4 11 V4.8 a1 1 0 0 1 1-1 H11 L20 12.8 a1.4 1.4 0 0 1 0 2 L14.8 20 a1.4 1.4 0 0 1 -2 0 Z'], d: ['M8 8 h0.01'] },
  bell: { b: ['M6 17.5 C6.8 16.5 7.5 15 7.5 12 C7.5 8 9.5 5.5 12 5.5 C14.5 5.5 16.5 8 16.5 12 C16.5 15 17.2 16.5 18 17.5 Z'], d: ['M10 20 a2 2 0 0 0 4 0', 'M12 3.2 V5.5'] },
  bookmark: { b: ['M6 3.8 h12 a0.8 0.8 0 0 1 0.8 0.8 V20.5 L12 16.5 L5.2 20.5 V4.6 A0.8 0.8 0 0 1 6 3.8 Z'] },
  chart: { b: ['M5 19 V11 h3.5 V19 Z', 'M10.2 19 V5 h3.5 V19 Z', 'M15.5 19 V14 H19 V19 Z'] },
  wallet: { b: ['M4 7.5 a1.6 1.6 0 0 1 1.6-1.6 h11.8 a1.6 1.6 0 0 1 1.6 1.6 V18 a1.6 1.6 0 0 1 -1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 18 Z'], d: ['M15.5 11 a1.6 1.6 0 0 0 0 3.2 H20.5 V11 Z', 'M16.8 12.6 h0.01'] },
  dumbbell: { b: ['M3 9.5 h2.5 v5 H3 Z', 'M18.5 9.5 H21 v5 h-2.5 Z', 'M6.5 8.5 h2 v7 h-2 Z', 'M15.5 8.5 h2 v7 h-2 Z'], d: ['M8.5 12 H15.5'] },
  palette: { b: ['M12 21 C6.8 21 3 17 3 12 A9 9 0 0 1 21 12 C21 14.8 18.8 16 17 16 H15 a1.5 1.5 0 0 0 -1 2.6 A2 2 0 0 1 12 21 Z'], d: ['M7.5 12 h0.01', 'M9.5 8 h0.01', 'M14 7.5 h0.01', 'M16.5 11 h0.01'] },
  code: { b: [], d: ['M9 7 L4 12 L9 17', 'M15 7 L20 12 L15 17', 'M13 4.5 L11 19.5'] },
  lightbulb: { b: ['M8 14.5 C6.2 13.2 5 11.2 5 9 A7 7 0 0 1 19 9 C19 11.2 17.8 13.2 16 14.5 V17 H8 Z'], d: ['M9.5 20 H14.5', 'M10 17 H14'] },
  gift: { b: ['M4.5 10 H19.5 V20 a1 1 0 0 1 -1 1 H5.5 a1 1 0 0 1 -1 -1 Z'], d: ['M4 7 a1 1 0 0 1 1-1 H19 a1 1 0 0 1 1 1 V10 H4 Z', 'M12 6 V21', 'M12 6 C12 6 10 2.5 8 3.5 C6 4.5 8.5 6 12 6 Z', 'M12 6 C12 6 14 2.5 16 3.5 C18 4.5 15.5 6 12 6 Z'] },
  plane: { b: ['M21 6 a1.6 1.6 0 0 0 -2.2 -1.5 L13 7 L5 4.5 L3.2 6.3 L9 10 L6 13 H3.5 L2.5 14.8 L6.5 16.5 L8.2 20.5 L10 19.5 V17 L13 14 L16.7 19.8 L18.5 18 L16 10 Z'] },
  flag: { b: ['M6 21 V4 a1 1 0 0 1 1-1 h11.5 a0.6 0.6 0 0 1 0.5 1 L17 7 l2 3 a0.6 0.6 0 0 1 -0.5 1 H6 Z'], d: ['M6 13 H18.5'] }
};

function clampHex(v) {
  if (!v) return '18181a';
  v = v.replace('#', '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) v = v.charAt(0) + v.charAt(0) + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2);
  return /^[0-9a-f]{6}$/.test(v) ? v : '18181a';
}
function chan(hex, i) { return parseInt(hex.substr(i, 2), 16); }
function lighten(hex, amt) {
  var r = Math.round(chan(hex, 0) + (255 - chan(hex, 0)) * amt);
  var g = Math.round(chan(hex, 2) + (255 - chan(hex, 2)) * amt);
  var b = Math.round(chan(hex, 4) + (255 - chan(hex, 4)) * amt);
  function h(x) { var s = x.toString(16); return s.length < 2 ? '0' + s : s; }
  return '#' + h(r) + h(g) + h(b);
}
function onColor(hex) {
  var lum = (0.299 * chan(hex, 0) + 0.587 * chan(hex, 2) + 0.114 * chan(hex, 4)) / 255;
  return lum > 0.62 ? '#1a1a18' : '#ffffff';
}

function renderSvg(name, hex, variant) {
  var spec = ICONS[name] || ICONS.star;
  var body = spec.b || [], detail = spec.d || [];
  var color = '#' + hex, onc = onColor(hex), sw = 1.7;
  var defs = '', soft = '', i;

  if (variant === 'gradient') {
    defs = '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0%" stop-color="' + lighten(hex, 0.28) + '"/>'
      + '<stop offset="100%" stop-color="' + color + '"/></linearGradient></defs>';
  }
  if (variant === 'duotone') {
    for (i = 0; i < body.length; i++) soft += '<path d="' + body[i] + '" fill="' + color + '" opacity="0.18"/>';
  }

  var isDuo = variant === 'duotone';
  var bodyFill = variant === 'filled' ? color : (variant === 'gradient' ? 'url(#g)' : 'none');
  if (isDuo) bodyFill = 'none';
  var bodyStroke = (variant === 'outline' || isDuo) ? color : 'none';
  var detailStroke = (variant === 'outline' || isDuo) ? color : onc;

  var out = '';
  for (i = 0; i < body.length; i++) {
    out += '<path d="' + body[i] + '" fill="' + bodyFill + '" stroke="' + bodyStroke + '" stroke-width="' + sw + '"/>';
  }
  for (i = 0; i < detail.length; i++) {
    out += '<path d="' + detail[i] + '" fill="none" stroke="' + detailStroke + '" stroke-width="' + sw + '"/>';
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" '
    + 'fill="none" stroke="none" stroke-linecap="round" stroke-linejoin="round">'
    + defs + soft + out + '</svg>';
}

function handler(event) {
  var req = event.request;
  var uri = req.uri; // e.g. /i/clock.svg
  var name = uri.replace(/^\/i\//, '').replace(/\.svg$/, '');
  var qs = req.querystring || {};
  var hex = clampHex(qs.c && qs.c.value);
  var variant = (qs.s && qs.s.value) || 'outline';
  if (variant !== 'filled' && variant !== 'duotone' && variant !== 'gradient') variant = 'outline';

  var svg = renderSvg(name, hex, variant);
  return {
    statusCode: 200,
    statusDescription: 'OK',
    headers: {
      'content-type': { value: 'image/svg+xml; charset=utf-8' },
      'cache-control': { value: 'public, max-age=31536000, immutable' },
      'access-control-allow-origin': { value: '*' }
    },
    body: svg
  };
}
