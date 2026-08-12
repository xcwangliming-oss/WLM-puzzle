#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Two fixes:
1. Props don't shatter when their row is cleared
2. Last prop piece disappears instantly (no shrink animation)
"""
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# ─── Fix 1: skip shatter for prop columns ─────────────────────────────────────
#
# Modify playRowShatterEffect signature to accept skipCols param,
# then skip those columns in the loop.
#
# Also modify the call site to pass prop columns as skipCols.

# 1a. Add skipCols param to function signature + skip in column loop
OLD_SIG = "function playRowShatterEffect(row: number, color: string, rowBlocks: Block[] = []) {"
NEW_SIG = "function playRowShatterEffect(row: number, color: string, rowBlocks: Block[] = [], skipCols: Set<number> = new Set()) {"

if OLD_SIG in content:
    content = content.replace(OLD_SIG, NEW_SIG, 1)
    print("OK: skipCols param added to playRowShatterEffect signature")
else:
    print("ERROR: playRowShatterEffect signature not found"); sys.exit(1)

# 1b. Add the skip check inside the for loop
# Find "for (let col = minCol; col <= maxCol; col++) {" and add skip right after
OLD_LOOP = "  for (let col = minCol; col <= maxCol; col++) {"
NEW_LOOP = "  for (let col = minCol; col <= maxCol; col++) {\n    if (skipCols.has(col)) continue; // skip prop columns"

if OLD_LOOP in content:
    content = content.replace(OLD_LOOP, NEW_LOOP, 1)
    print("OK: skipCols skip inserted in column loop")
else:
    print("ERROR: column loop not found"); sys.exit(1)

# 1c. At the call site, build skipCols from props in that row and pass it
OLD_CALL = "        playRowShatterEffect(r, explosionColor, rowBlocks);"
NEW_CALL = (
    "        const propSkipCols = new Set<number>();\n"
    "        blocks.forEach(b => {\n"
    "          if (b.isProp && b.row === r) {\n"
    "            for (let c = 0; c < b.length; c++) propSkipCols.add(b.col + c);\n"
    "          }\n"
    "        });\n"
    "        playRowShatterEffect(r, explosionColor, rowBlocks, propSkipCols);"
)

if OLD_CALL in content:
    content = content.replace(OLD_CALL, NEW_CALL, 1)
    print("OK: skipCols built and passed at call site")
else:
    print("ERROR: playRowShatterEffect call site not found"); sys.exit(1)

# ─── Fix 2: last prop piece disappears instantly (no animation) ───────────────
#
# In animatePropShrink, if newLen <= 0, skip the rAF loop entirely
# and call onComplete immediately.
#
OLD_ANIM_START = (
    "  if (!sprite) return;\n"
    "\n"
    "  const cellSize = PARAMS.cellSize || 50;\n"
    "\n"
    "  const startX = oldCol * cellSize;"
)
NEW_ANIM_START = (
    "  if (!sprite) return;\n"
    "\n"
    "  // If the prop is being fully consumed, remove it instantly with no animation\n"
    "  if (newLen <= 0) {\n"
    "    if (onComplete) onComplete();\n"
    "    return;\n"
    "  }\n"
    "\n"
    "  const cellSize = PARAMS.cellSize || 50;\n"
    "\n"
    "  const startX = oldCol * cellSize;"
)

if OLD_ANIM_START in content:
    content = content.replace(OLD_ANIM_START, NEW_ANIM_START, 1)
    print("OK: instant removal for last prop piece added")
else:
    print("ERROR: animatePropShrink start not found")
    idx = content.find('function animatePropShrink')
    if idx >= 0:
        print(repr(content[idx:idx+400]))
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
