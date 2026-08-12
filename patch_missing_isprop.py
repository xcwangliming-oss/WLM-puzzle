#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

targets = [2879, 2947, 3211, 3501, 3553, 3597, 3649, 3693, 32330, 32606, 32954]

# Note: The lines array is 0-indexed, targets are 1-indexed.
for t in targets:
    idx = t - 1
    # Check if we already have it
    has_skip = False
    for j in range(idx, min(idx+5, len(lines))):
        if 'b.isCollectible' in lines[j] or 'b.isProp' in lines[j]:
            has_skip = True
            break
    
    if not has_skip:
        # insert the skip line right after blocks.forEach(b => {
        # find the exact line
        if 'blocks.forEach(b => {' in lines[idx]:
            lines[idx] = lines[idx].replace('blocks.forEach(b => {', 'blocks.forEach(b => { if (b.isCollectible || b.isProp) return;')

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Patch applied successfully.")
