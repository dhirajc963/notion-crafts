#!/usr/bin/env python3
"""Replace widget renderer functions in NotionCrafts.jsx by literal match.
Usage: python3 patch_renderers.py <fixes.json>
fixes.json = list of { type, comp, renderer }  (the NEW renderer)
Old renderer text is looked up from research/specs.json + specs-live.json by type
(the assembler wrote them .strip()'d). Replaces old->new. Verifies each old is
found exactly once. Does NOT touch anything else in the shared file.
"""
import json, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src/components/NotionCrafts.jsx')

fixes = json.load(open(sys.argv[1]))
old_by_type = {}
for fn in ('research/specs.json', 'research/specs-live.json'):
    p = os.path.join(ROOT, fn)
    if os.path.exists(p):
        for s in json.load(open(p)):
            old_by_type[s['type']] = s['renderer'].strip()
# overlay the latest applied renderers (so subsequent rounds match the current file)
cur = os.path.join(ROOT, 'research/current-renderers.json')
if os.path.exists(cur):
    for t, txt in json.load(open(cur)).items():
        old_by_type[t] = txt.strip()

src = open(SRC).read()
applied, missing, ambiguous = [], [], []
for f in fixes:
    t = f['type']
    old = old_by_type.get(t)
    new = f['renderer'].strip()
    if not old:
        missing.append(t); continue
    n = src.count(old)
    if n == 0:
        missing.append(t); continue
    if n > 1:
        ambiguous.append((t, n)); continue
    src = src.replace(old, new)
    # update our record so a re-run uses the new text as "old"
    old_by_type[t] = new
    applied.append(t)

open(SRC, 'w').write(src)
# persist updated old map so subsequent rounds match the current file
json.dump(old_by_type, open(os.path.join(ROOT, 'research/current-renderers.json'), 'w'))
print(f"Applied {len(applied)} renderer swaps.")
if missing: print(f"  NOT FOUND (skipped): {missing}")
if ambiguous: print(f"  AMBIGUOUS (skipped): {ambiguous}")
