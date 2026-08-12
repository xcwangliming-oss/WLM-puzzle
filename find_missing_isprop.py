#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'blocks.forEach' in s:
        # Check next 20 lines for texture or color change
        changes_texture = False
        skips_prop = False
        for j in range(i-1, min(i+20, len(lines))):
            js = lines[j].strip()
            if 'texture = ' in js or 'b.color = ' in js:
                changes_texture = True
            if 'b.isProp' in js and ('return' in js or 'continue' in js or '!' in js):
                skips_prop = True
        
        if changes_texture and not skips_prop:
            print(f'Line {i}: modifies texture/color without skipping props!')
            for j in range(i-1, min(i+20, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
            print('-'*40)
