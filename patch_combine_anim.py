#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# Replace full-consume animation
old_full = '''      if (el < shakeDurL) {
        // Phase 1: shake whole prop
        const shakeX = Math.sin(el * 0.04) * 2;
        const shakeY = Math.cos(el * 0.04) * 1;
        sprite.x = (dir === 'left' ? rightEdge - startWw : oldCol * cellSz) + shakeX;
        sprite.y = baseYy + shakeY;
        sprite.width = startWw;
        requestAnimationFrame(stepLast);
      } else if (el < shakeDurL + shrinkDurL) {
        // Phase 2: shrink candy, machine head position stays
        const t = (el - shakeDurL) / shrinkDurL;
        const ease = t * (2 - t);
        const curW = startWw + (machineW - startWw) * ease;
        sprite.width = curW;
        sprite.y = baseYy;
        if (dir === 'left') {
          sprite.x = rightEdge - curW; // right edge fixed
        } else {
          sprite.x = oldCol * cellSz;  // left edge fixed
        }
        requestAnimationFrame(stepLast);
      } else if (el < totalDurL) {'''

new_full = '''      if (el < shakeDurL + shrinkDurL) {
        // Combined Phase: shake while shrinking
        const t = el / (shakeDurL + shrinkDurL);
        const ease = t * (2 - t);
        const curW = startWw + (machineW - startWw) * ease;
        const shakeX = Math.sin(el * 0.04) * 2;
        const shakeY = Math.cos(el * 0.04) * 1;
        
        sprite.width = curW;
        sprite.y = baseYy + shakeY;
        if (dir === 'left') {
          sprite.x = rightEdge - curW + shakeX; // right edge fixed + shake
        } else {
          sprite.x = oldCol * cellSz + shakeX;  // left edge fixed + shake
        }
        requestAnimationFrame(stepLast);
      } else if (el < totalDurL) {'''

ts = ts.replace(old_full, new_full)

# Replace partial-consume animation
old_partial = '''    if (elapsed < shakeDuration) {

      // Phase 1: Vibration / Shake effect

      const shakeX = Math.sin(elapsed * 0.04) * 2;

      const shakeY = Math.cos(elapsed * 0.04) * 1;

      sprite.x = startX + shakeX;

      sprite.y = baseY + shakeY;

      sprite.width = startW;

      requestAnimationFrame(step);

    } else if (elapsed < totalDuration) {

      // Phase 2: Smooth shrink towards machine location

      const t = (elapsed - shakeDuration) / shrinkDuration;

      const easeT = t * (2 - t);



      sprite.x = startX + (targetX - startX) * easeT;

      sprite.y = baseY;

      sprite.width = startW + (targetW - startW) * easeT;

      requestAnimationFrame(step);'''

new_partial = '''    if (elapsed < totalDuration) {
      // Combined Phase: Vibration + Shrink simultaneously
      const t = elapsed / totalDuration;
      const easeT = t * (2 - t);
      
      const shakeX = Math.sin(elapsed * 0.04) * 2;
      const shakeY = Math.cos(elapsed * 0.04) * 1;

      sprite.x = startX + (targetX - startX) * easeT + shakeX;
      sprite.y = baseY + shakeY;
      sprite.width = startW + (targetW - startW) * easeT;

      requestAnimationFrame(step);'''

ts = ts.replace(old_partial, new_partial)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Patch applied successfully.")
