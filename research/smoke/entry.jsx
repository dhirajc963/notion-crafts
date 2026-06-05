import React from 'react';
import { renderToString } from 'react-dom/server';
import { Widget, WIDGETS } from '../../src/components/NotionCrafts.jsx';
const fails = [];
for (const w of WIDGETS) {
  try {
    renderToString(React.createElement(Widget, { type: w.type, config: w.config || {}, accent: '#2A6FDB', fontStack: 'sans-serif', sizeScale: 1, theme: 'light' }));
    renderToString(React.createElement(Widget, { type: w.type, config: w.config || {}, accent: '#2A6FDB', fontStack: 'sans-serif', sizeScale: 0.64, theme: 'dark', mini: true }));
  } catch (e) { fails.push([w.type, String(e && e.message || e).split('\n')[0]]); }
}
console.log('RENDERED OK:', WIDGETS.length - fails.length, '/', WIDGETS.length);
fails.forEach(f => console.log('FAIL', f[0], '::', f[1]));
