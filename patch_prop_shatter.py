#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Insert the pre-calculation of prop columns before damage
OLD_DAMAGE_START = (
    '  if (fullRows.length > 0) {\n'
    '\n'
    '\n'
    '\n'
    '    // Props take one hit when their row or an adjacent row clears.\n'
)
NEW_DAMAGE_START = (
    '  if (fullRows.length > 0) {\n'
    '\n'
    '    // PRE-CALCULATE prop columns before they take damage (to prevent particle shatter on props)\n'
    '    const initialPropColsByRow = new Map<number, Set<number>>();\n'
    '    fullRows.forEach(r => initialPropColsByRow.set(r, new Set<number>()));\n'
    '    blocks.forEach(b => {\n'
    '      if (b.isProp && initialPropColsByRow.has(b.row)) {\n'
    '        const skipSet = initialPropColsByRow.get(b.row)!;\n'
    '        for (let c = 0; c < b.length; c++) skipSet.add(b.col + c);\n'
    '      }\n'
    '    });\n'
    '\n'
    '    // Props take one hit when their row or an adjacent row clears.\n'
)

if OLD_DAMAGE_START in ts:
    ts = ts.replace(OLD_DAMAGE_START, NEW_DAMAGE_START, 1)
    print("OK: Inserted pre-calculation of prop columns")
else:
    print("ERROR: OLD_DAMAGE_START not found"); sys.exit(1)

# 2. Update the playRowShatterEffect call to use the pre-calculated sets
OLD_SHATTER_CALL = (
    '        const propSkipCols = new Set<number>();\n'
    '        blocks.forEach(b => {\n'
    '          if (b.isProp && b.row === r) {\n'
    '            for (let c = 0; c < b.length; c++) propSkipCols.add(b.col + c);\n'
    '          }\n'
    '        });\n'
    '        playRowShatterEffect(r, explosionColor, rowBlocks, propSkipCols);\n'
)
NEW_SHATTER_CALL = (
    '        const propSkipCols = initialPropColsByRow.get(r) || new Set<number>();\n'
    '        playRowShatterEffect(r, explosionColor, rowBlocks, propSkipCols);\n'
)

if OLD_SHATTER_CALL in ts:
    ts = ts.replace(OLD_SHATTER_CALL, NEW_SHATTER_CALL, 1)
    print("OK: Replaced playRowShatterEffect call to use pre-calculated columns")
else:
    print("ERROR: OLD_SHATTER_CALL not found"); sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
