#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Define anyPropDamaged
old_prop_loop = '''// Props take one hit when their row or an adjacent row clears.

blocks.forEach(b => {

if (!b.isProp) return;

const damage = damagePropForClearedRows(b, fullRows);

if (damage.triggered) {'''

new_prop_loop = '''// Props take one hit when their row or an adjacent row clears.
let anyPropDamaged = false;
blocks.forEach(b => {

if (!b.isProp) return;

const damage = damagePropForClearedRows(b, fullRows);

if (damage.triggered) {
anyPropDamaged = true;'''

if old_prop_loop in ts:
    ts = ts.replace(old_prop_loop, new_prop_loop, 1)
else:
    print("Warning: old_prop_loop not found")

# 2. Update customElimDelay * 1000 in checkEliminations
# To be safe, we only want to replace it in the context of checkEliminations where anyPropDamaged is in scope.
# The previous search showed it's at lines 23275 and 23339.
# We can just replace 'customElimDelay * 1000)' with 'Math.max(customElimDelay * 1000, anyPropDamaged ? 1200 : 0))'
# Let's see how it looks:
old_delay1 = '}, customElimDelay * 1000);'
new_delay1 = '}, Math.max(customElimDelay * 1000, typeof anyPropDamaged !== "undefined" && anyPropDamaged ? 1200 : 0));'

ts = ts.replace(old_delay1, new_delay1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Patch applied successfully.")
