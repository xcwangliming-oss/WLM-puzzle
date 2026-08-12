#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# We need to change these lines:
# const shakeX = Math.sin(el * 0.04) * 2;
# const shakeY = Math.cos(el * 0.04) * 1;
# machineSprite.y = baseYy + shakeY;
# candySprite.y = baseYy + shakeY;
# machineSprite.x = (dir === 'left' ? rightEdge - machineW : leftEdge) + shakeX;

old_block = '''      const shakeX = Math.sin(el * 0.04) * 2;
      const shakeY = Math.cos(el * 0.04) * 1;

      machineSprite.y = baseYy + shakeY;
      candySprite.y = baseYy + shakeY;
      machineSprite.x = (dir === 'left' ? rightEdge - machineW : leftEdge) + shakeX;'''

new_block = '''      const shakeX = Math.sin(el * 0.04) * 1;
      const shakeY = Math.cos(el * 0.04) * 0.5;

      machineSprite.y = baseYy; // Machine head stays perfectly still!
      candySprite.y = baseYy + shakeY;
      machineSprite.x = dir === 'left' ? rightEdge - machineW : leftEdge; // Machine head stays perfectly still!'''

if old_block in ts:
    ts = ts.replace(old_block, new_block, 1)
else:
    print("Error: Could not find old block")
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Patch applied successfully.")
