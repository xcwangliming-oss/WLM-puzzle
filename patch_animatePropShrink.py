#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

old_func_start = "function animatePropShrink("
old_func_end = "const startTime = performance.now();" # We'll find a better end

# Let's replace the whole animatePropShrink function
# find the start index
start_idx = ts.find('function animatePropShrink(')
# find the end index (the end of animatePropShrink function body)
# we can just use regex or string find

if start_idx == -1:
    print("Error: animatePropShrink not found")
    sys.exit(1)

# we need to find the matching closing brace for the function
brace_count = 0
in_func = False
end_idx = -1
for i in range(start_idx, len(ts)):
    if ts[i] == '{':
        brace_count += 1
        in_func = True
    elif ts[i] == '}':
        brace_count -= 1
        if in_func and brace_count == 0:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Error: Could not find end of animatePropShrink")
    sys.exit(1)

new_func = """function animatePropShrink(
  sprite: PIXI.Sprite,
  dir: 'left' | 'right',
  oldCol: number,
  oldLen: number,
  newCol: number,
  newLen: number,
  onComplete?: () => void
) {
  if (!sprite || !sprite.parent) {
    if (onComplete) onComplete();
    return;
  }

  const cellSz = PARAMS.cellSize || 50;
  const machineW = cellSz;
  const startWw = oldLen * cellSz;
  const baseYy = sprite.y;
  
  const rightEdge = oldCol * cellSz + oldLen * cellSz;
  const leftEdge = oldCol * cellSz;

  const shakeDurL = 400;
  const shrinkDurL = 800;
  const fadeDurL = 350;
  const totalDurL = newLen <= 0 ? shakeDurL + shrinkDurL + fadeDurL : shakeDurL + shrinkDurL;
  const startTimeL = performance.now();

  // Create temporary sprites
  const machineSprite = new PIXI.Sprite(getPropTexture(1, dir));
  machineSprite.width = machineW;
  machineSprite.height = cellSz;
  machineSprite.y = baseYy;
  machineSprite.x = dir === 'left' ? rightEdge - machineW : leftEdge;

  const candySprite = new PIXI.Sprite(sprite.texture);
  candySprite.width = startWw;
  candySprite.height = cellSz;
  candySprite.y = baseYy;
  candySprite.x = dir === 'left' ? rightEdge - startWw : leftEdge;

  const mask = new PIXI.Graphics();
  candySprite.mask = mask;

  const container = new PIXI.Container();
  container.addChild(candySprite, machineSprite, mask);
  sprite.parent.addChild(container);

  sprite.visible = false;

  function stepLast(now: number) {
    const el = now - startTimeL;
    
    if (el < shakeDurL + shrinkDurL) {
      const t = el / (shakeDurL + shrinkDurL);
      const ease = t * (2 - t);
      
      const targetWw = Math.max(newLen * cellSz, machineW);
      const curW = startWw + (targetWw - startWw) * ease;
      
      const shakeX = Math.sin(el * 0.04) * 2;
      const shakeY = Math.cos(el * 0.04) * 1;

      machineSprite.y = baseYy + shakeY;
      candySprite.y = baseYy + shakeY;
      machineSprite.x = (dir === 'left' ? rightEdge - machineW : leftEdge) + shakeX;

      let candyX = 0;
      mask.clear();
      mask.beginFill(0xffffff);
      if (dir === 'left') {
        candyX = rightEdge - curW + shakeX;
        candySprite.x = candyX;
        mask.drawRect(candyX, baseYy - 20, Math.max(0, curW - machineW), cellSz + 40); 
      } else {
        candyX = leftEdge - (startWw - curW) + shakeX;
        candySprite.x = candyX;
        mask.drawRect(leftEdge + machineW + shakeX, baseYy - 20, Math.max(0, curW - machineW), cellSz + 40);
      }
      mask.endFill();
      
      requestAnimationFrame(stepLast);
    } else if (el < totalDurL && newLen <= 0) {
      candySprite.visible = false;
      machineSprite.y = baseYy;
      machineSprite.x = dir === 'left' ? rightEdge - machineW : leftEdge;
      machineSprite.alpha = 1 - (el - shakeDurL - shrinkDurL) / fadeDurL;
      requestAnimationFrame(stepLast);
    } else {
      container.destroy({ children: true });
      if (newLen > 0) {
        sprite.texture = getPropTexture(newLen, dir);
        sprite.width = newLen * cellSz;
        sprite.x = dir === 'left' ? rightEdge - sprite.width : leftEdge;
        sprite.y = baseYy;
        sprite.visible = true;
      }
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(stepLast);
}"""

ts = ts[:start_idx] + new_func + ts[end_idx:]

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Patch applied successfully.")
