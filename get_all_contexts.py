#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

targets = [15897, 15921, 36873, 36889, 36917, 36993, 37145, 38201, 38409, 38473]

for t in targets:
    print(f'--- Line {t} Context ---')
    start = max(0, t - 25)
    end = min(len(lines), t + 25)
    for i in range(start, end):
        if lines[i].strip() != '':
            print(f'{i+1}: {lines[i].strip()}')
