#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. UNDO the bad patch at line 21115
BAD_CODE = (
    '  } else {\n'
    '\n'
    '\n'
    '\n'
    'function playRowShatterEffect(row: number, color: string, rowBlocks: Block[] = [], skipCols: Set<number> = new Set()) {\n'
    '\n'
    '  // For continuous beam effects (mode 3 and 4), do not skip any columns so the beam passes over props\n'
    '  if (PARAMS.shatterMode === 3 || PARAMS.shatterMode === 4) {\n'
    '    skipCols = new Set();\n'
    '  }\n'
    '\n'
    '  const isHideShatter = (document.getElementById(\'input-hideshatter\') as HTMLInputElement)?.checked || false;\n'
    '\n'
    '  if (isHideShatter) return;\n'
    '\n'
    '    const minVisibleY = -worldContainer.y;\n'
)

GOOD_CODE = (
    '  } else {\n'
    '\n'
    '\n'
    '\n'
    '    const minVisibleY = -worldContainer.y;\n'
)

if BAD_CODE in ts:
    ts = ts.replace(BAD_CODE, GOOD_CODE, 1)
    print("OK: Reverted bad patch in applyGravity")
else:
    print("ERROR: Bad patch code not found"); sys.exit(1)

# 2. APPLY the correct patch to the real playRowShatterEffect
REAL_FUNC_START = (
    'function playRowShatterEffect(row: number, color: string, rowBlocks: Block[] = [], skipCols: Set<number> = new Set()) {\n'
    '\n'
    '\n'
    '\n'
    '  const isHideShatter = (document.getElementById(\'input-hideshatter\') as HTMLInputElement)?.checked || false;\n'
)

FIXED_FUNC_START = (
    'function playRowShatterEffect(row: number, color: string, rowBlocks: Block[] = [], skipCols: Set<number> = new Set()) {\n'
    '\n'
    '  // For continuous beam effects (mode 3 and 4), do not skip any columns so the beam passes over props\n'
    '  if (PARAMS.shatterMode === 3 || PARAMS.shatterMode === 4) {\n'
    '    skipCols = new Set();\n'
    '  }\n'
    '\n'
    '  const isHideShatter = (document.getElementById(\'input-hideshatter\') as HTMLInputElement)?.checked || false;\n'
)

if REAL_FUNC_START in ts:
    ts = ts.replace(REAL_FUNC_START, FIXED_FUNC_START, 1)
    print("OK: Correctly patched playRowShatterEffect")
else:
    print("ERROR: Real playRowShatterEffect not found")
    idx = ts.find('function playRowShatterEffect')
    if idx > 0:
        print(repr(ts[idx:idx+200]))
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
