import React, { useEffect, useState } from 'react';
import { Widget, WIDGETS, FONTS, SIZE_SCALE } from './NotionCrafts.jsx';

/* Standalone widget renderer for the page Notion actually iframes.
   Reads the config the Studio encoded into the URL and mounts a single,
   chrome-less <Widget> that fills the embed. Pure client-side — no backend. */

const GLOBAL_KEYS = new Set(['theme', 'accent', 'font', 'size']);

// Rebuild the per-widget config object from URL params, restoring the
// original types from the widget's default config (buildEmbedUrl flattens
// everything to strings, drops false booleans, and joins arrays with commas).
function reconstructConfig(defaults, params) {
  const cfg = { ...(defaults || {}) };
  if (defaults) {
    for (const [k, dv] of Object.entries(defaults)) {
      if (typeof dv === 'boolean' && !params.has(k)) cfg[k] = false;
    }
  }
  for (const [k, raw] of params.entries()) {
    if (GLOBAL_KEYS.has(k)) continue;
    const dv = defaults ? defaults[k] : undefined;
    if (typeof dv === 'boolean') cfg[k] = raw === '1' || raw === 'true';
    else if (typeof dv === 'number') cfg[k] = Number(raw);
    else if (Array.isArray(dv)) cfg[k] = raw.split(',');
    else cfg[k] = raw;
  }
  return cfg;
}

function resolveTheme(raw) {
  if (raw === 'auto') {
    const dark = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return dark ? 'dark' : 'light';
  }
  return raw === 'dark' ? 'dark' : 'light';
}

export default function Embed({ widgetId }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const widget = WIDGETS.find(w => w.id === widgetId) || WIDGETS[0];

    const accentRaw = (params.get('accent') || '').replace('#', '');
    const accent = accentRaw ? `#${accentRaw}` : '#18181a';

    const fontObj = FONTS.find(f => f.v === (params.get('font') || 'sans')) || FONTS[0];
    const sizeScale = SIZE_SCALE[(params.get('size') || 'm').toUpperCase()] || 1;
    const theme = resolveTheme(params.get('theme') || 'light');
    const config = reconstructConfig(widget.config, params);

    // Match the page background to the widget surface (set pre-hydration by the
    // inline script too — this keeps it correct if 'auto' flips after mount).
    document.documentElement.setAttribute('data-embed-theme', theme);

    setState({ type: widget.type, config, accent, fontStack: fontObj.stack, sizeScale, theme });
  }, [widgetId]);

  if (!state) return null;
  return (
    <Widget
      type={state.type}
      config={state.config}
      accent={state.accent}
      fontStack={state.fontStack}
      sizeScale={state.sizeScale}
      theme={state.theme}
    />
  );
}
