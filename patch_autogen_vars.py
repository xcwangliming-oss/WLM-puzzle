#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Add module-level autoGenScrollSpeed variable
if 'let autoGenScrollSpeed' not in ts:
    ANCHOR = 'let propTextureCache: Record<string, PIXI.Texture> = {};'
    if ANCHOR in ts:
        ts = ts.replace(ANCHOR, ANCHOR + '\nlet autoGenScrollSpeed: number | null = null;\n', 1)
        print("OK: autoGenScrollSpeed declared at module level")
    else:
        # Try another anchor
        ANCHOR2 = 'let customPropMachineImg'
        if ANCHOR2 in ts:
            ts = ts.replace(ANCHOR2, 'let autoGenScrollSpeed: number | null = null;\n' + ANCHOR2, 1)
            print("OK: autoGenScrollSpeed declared (alternate anchor)")
        else:
            print("ERROR: no anchor found for autoGenScrollSpeed"); sys.exit(1)
else:
    print("SKIP: autoGenScrollSpeed already declared")

# 2. Add preSavedManualSpeed before preSpeed override in generator
if 'preSavedManualSpeed' not in ts:
    # Find the preSpeed set before the Pre-adjusted log
    log_marker = '[AutoPlay Generator] Pre-adjusted scroll speed to:'
    idx_log = ts.find(log_marker)
    if idx_log < 0:
        print("ERROR: Pre-adjusted log not found"); sys.exit(1)
    
    pre_speed_assign = 'PARAMS.scrollSpeed = preSpeed;'
    idx_assign = ts.rfind(pre_speed_assign, 0, idx_log)
    if idx_assign < 0:
        print("ERROR: PARAMS.scrollSpeed = preSpeed not found"); sys.exit(1)
    
    ts = ts[:idx_assign] + 'const preSavedManualSpeed = PARAMS.scrollSpeed; // save user speed before auto-gen overrides it\n      ' + ts[idx_assign:]
    print("OK: preSavedManualSpeed saved before preSpeed override")
else:
    print("SKIP: preSavedManualSpeed already declared")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
