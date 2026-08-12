#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Update full-consume durations
ts = ts.replace('const shakeDurL  = 250;\n    const shrinkDurL = 400;', 'const shakeDurL  = 400;\n    const shrinkDurL = 800;')

# 2. Update full-consume shake logic
old_shake_full = '''const shakeX = Math.sin(el * 0.08) * 4;
        const shakeY = Math.cos(el * 0.08) * 2;'''
new_shake_full = '''const shakeX = Math.sin(el * 0.04) * 2;
        const shakeY = Math.cos(el * 0.04) * 1;'''
ts = ts.replace(old_shake_full, new_shake_full)

# 3. Update partial-consume durations
ts = ts.replace('const shakeDuration = 250; // 250ms vibration/shake\n\n  const shrinkDuration = 400; // 400ms smooth shrink towards machine', 'const shakeDuration = 400; // 400ms vibration/shake\n\n  const shrinkDuration = 800; // 800ms smooth shrink towards machine')

# 4. Update partial-consume shake logic
old_shake_partial = '''const shakeX = Math.sin(elapsed * 0.08) * 4;

      const shakeY = Math.cos(elapsed * 0.08) * 2;'''
new_shake_partial = '''const shakeX = Math.sin(elapsed * 0.04) * 2;

      const shakeY = Math.cos(elapsed * 0.04) * 1;'''
ts = ts.replace(old_shake_partial, new_shake_partial)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Animation values updated successfully.")
