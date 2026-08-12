#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import re

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# Replace full-consume case
ts = ts.replace(
    'const shakeDurL  = 150;\nconst shrinkDurL = 220;',
    'const shakeDurL  = 250;\nconst shrinkDurL = 400;'
)

old_shake_full = '''// Phase 1: shake whole prop
sprite.x = (dir === 'left' ? rightEdge - startWw : oldCol * cellSz) + (Math.random() - 0.5) * 6;
sprite.y = baseYy + (Math.random() - 0.5) * 4;'''

new_shake_full = '''// Phase 1: shake whole prop
const shakeX = Math.sin(el * 0.08) * 4;
const shakeY = Math.cos(el * 0.08) * 2;
sprite.x = (dir === 'left' ? rightEdge - startWw : oldCol * cellSz) + shakeX;
sprite.y = baseYy + shakeY;'''

if old_shake_full in ts:
    ts = ts.replace(old_shake_full, new_shake_full, 1)
else:
    print("Warning: old_shake_full not found!")

# Replace partial-consume case
ts = ts.replace(
    'const shakeDuration = 150; // 150ms vibration/shake\n\nconst shrinkDuration = 220; // 220ms smooth shrink towards machine',
    'const shakeDuration = 250; // 250ms vibration/shake\n\nconst shrinkDuration = 400; // 400ms smooth shrink towards machine'
)

old_shake_partial = '''// Phase 1: Vibration / Shake effect

const shakeX = (Math.random() - 0.5) * 6;

const shakeY = (Math.random() - 0.5) * 4;

sprite.x = startX + shakeX;

sprite.y = baseY + shakeY;'''

new_shake_partial = '''// Phase 1: Vibration / Shake effect

const shakeX = Math.sin(elapsed * 0.08) * 4;

const shakeY = Math.cos(elapsed * 0.08) * 2;

sprite.x = startX + shakeX;

sprite.y = baseY + shakeY;'''

if old_shake_partial in ts:
    ts = ts.replace(old_shake_partial, new_shake_partial, 1)
else:
    print("Warning: old_shake_partial not found!")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Patch applied successfully.")
