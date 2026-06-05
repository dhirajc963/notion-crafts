#!/usr/bin/env python3
"""Splice generated widget specs into NotionCrafts.jsx using STABLE insertion
points (re-runnable, order-independent of prior runs).
Usage: python3 assemble.py <specs.json> [meta.json]
specs.json = list of { type, comp, renderer, options, configStr, tags }
meta.json (default research/build-input.json) provides name/category/desc/accent/pro per type.
"""
import json, sys, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src/components/NotionCrafts.jsx')
BUILD_INPUT = os.path.join(ROOT, 'research/build-input.json')

specs = json.load(open(sys.argv[1]))
META_FILE = sys.argv[2] if len(sys.argv) > 2 else BUILD_INPUT
meta_by_type = {w['type']: w for w in json.load(open(META_FILE))}

seen = set(); specs = [s for s in specs if not (s['type'] in seen or seen.add(s['type']))]

src = open(SRC).read()
existing_types = set(re.findall(r"id: '([a-zA-Z0-9]+)', name:", src))

def esc(s): return s.replace('\\', '\\\\').replace("'", "\\'")

ALL_CATS = ['All', 'Time', 'Productivity', 'Daily', 'Planning', 'Finance', 'Health', 'Dev', 'Creator', 'Fun', 'Data']

meta_entries, renderers, map_pairs, accent_pairs, option_blocks = [], [], [], [], []
skipped = []
for s in specs:
    t = s['type']
    if t in existing_types: skipped.append(t); continue
    m = meta_by_type.get(t)
    if not m: skipped.append(t); continue
    comp = s['comp']
    tags = (s.get('tags') or [m['category'], 'New'])[:2]
    if len(tags) < 2: tags = (tags + ['New'])[:2]
    cfg = (s.get('configStr') or '{}').strip()
    if not cfg.startswith('{'): cfg = '{' + cfg + '}'
    tagstr = ', '.join("'" + esc(x) + "'" for x in tags)
    meta_entries.append(
        "  {\n"
        f"    id: '{t}', name: '{esc(m['name'])}', type: '{t}', pro: {'true' if m['pro'] else 'false'},\n"
        f"    desc: '{esc(m['desc'])}',\n"
        f"    tags: [{tagstr}], category: '{m['category']}',\n"
        f"    config: {cfg},\n  }},"
    )
    renderers.append("/* ---------------- " + m['name'].upper() + " ---------------- */\n" + s['renderer'].strip() + "\n")
    map_pairs.append(f"{t}: {comp}")
    accent_pairs.append(f"{t}: '{m['accent']}'")
    opt = (s.get('options') or 'null').strip().strip('"').strip()
    if opt and opt != 'null':
        # normalize: drop a single matched outer (...) wrapper, then wrap in a
        # fragment so multi-root option lists are always valid JSX.
        if opt.startswith('(') and opt.endswith(')'):
            opt = opt[1:-1].strip()
        option_blocks.append(f"  if (t === '{t}') return (\n    <>\n    {opt}\n    </>\n  );")

print(f"Assembling {len(meta_entries)} widgets (skipped {len(skipped)}: {skipped})")
if not meta_entries:
    print("Nothing to do."); sys.exit(0)

# 1. WIDGETS array — insert right after the opening line (stable)
m = re.search(r"const WIDGETS = \[\n", src); assert m, "WIDGETS open not found"
i = m.end(); src = src[:i] + "\n".join(meta_entries) + "\n" + src[i:]

# 1b. WIDGET_CATEGORIES — ensure all categories present (idempotent)
mc = re.search(r"const WIDGET_CATEGORIES = \[(.*?)\];", src); assert mc, "WIDGET_CATEGORIES not found"
src = src[:mc.start()] + "const WIDGET_CATEGORIES = [" + ', '.join("'" + c + "'" for c in ALL_CATS) + "];" + src[mc.end():]

# 2. Renderers — before the dispatcher comment (stable)
disp = "/* ---------------- DISPATCHER ---------------- */"
assert src.count(disp) == 1, "dispatcher comment not unique"
src = src.replace(disp, "\n".join(renderers) + "\n" + disp)

# 3. dispatcher map — only the one AFTER the dispatcher comment (avoid widget-internal `const map = {`)
di = src.index(disp)
mm = re.search(r"const map = \{ ", src[di:]); assert mm, "dispatcher map not found"
at = di + mm.end(); src = src[:at] + ", ".join(map_pairs) + ", " + src[at:]

# 4. WIDGET_ACCENT — insert after `{ ` (unique declaration)
ma = re.search(r"const WIDGET_ACCENT = \{ ", src); assert ma, "WIDGET_ACCENT not found"
at = ma.end(); src = src[:at] + ", ".join(accent_pairs) + ", " + src[at:]

# 5. WidgetOptions — insert blocks right after `const t = widget.type;` (unique line)
mo = re.search(r"  const t = widget\.type;\n", src); assert mo, "WidgetOptions anchor not found"
at = mo.end(); src = src[:at] + "\n".join(option_blocks) + "\n" + src[at:]

open(SRC, 'w').write(src)
print(f"Wrote {SRC} ({len(src)} bytes).")
