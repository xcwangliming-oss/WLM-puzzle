#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# Replace the instant-removal block we added earlier with a 3-phase animation
OLD_INSTANT = (
    "  // If the prop is being fully consumed, remove it instantly with no animation\n"
    "  if (newLen <= 0) {\n"
    "    if (onComplete) onComplete();\n"
    "    return;\n"
    "  }\n"
)

NEW_FADE = (
    "  // If the prop is fully consumed: shake + shrink candy → machine head fades out\n"
    "  if (newLen <= 0) {\n"
    "    const cellSz  = PARAMS.cellSize || 50;\n"
    "    const machineW = cellSz;\n"
    "    // For 'left': machine head is at the rightmost cell, right edge stays fixed while candy shrinks from left\n"
    "    // For 'right': machine head is at the leftmost cell, left edge stays fixed while candy shrinks from right\n"
    "    const rightEdge  = oldCol * cellSz + oldLen * cellSz; // fixed right edge for dir=left\n"
    "    const startWw    = oldLen * cellSz;\n"
    "    const baseYy     = sprite.y;\n"
    "    const shakeDurL  = 150;\n"
    "    const shrinkDurL = 220;\n"
    "    const fadeDurL   = 350;\n"
    "    const totalDurL  = shakeDurL + shrinkDurL + fadeDurL;\n"
    "    const startTimeL = performance.now();\n"
    "    let textureSwapped = false;\n"
    "    function stepLast(now: number) {\n"
    "      const el = now - startTimeL;\n"
    "      if (el < shakeDurL) {\n"
    "        // Phase 1: shake whole prop\n"
    "        sprite.x = (dir === 'left' ? rightEdge - startWw : oldCol * cellSz) + (Math.random() - 0.5) * 6;\n"
    "        sprite.y = baseYy + (Math.random() - 0.5) * 4;\n"
    "        sprite.width = startWw;\n"
    "        requestAnimationFrame(stepLast);\n"
    "      } else if (el < shakeDurL + shrinkDurL) {\n"
    "        // Phase 2: shrink candy, machine head position stays\n"
    "        const t = (el - shakeDurL) / shrinkDurL;\n"
    "        const ease = t * (2 - t);\n"
    "        const curW = startWw + (machineW - startWw) * ease;\n"
    "        sprite.width = curW;\n"
    "        sprite.y = baseYy;\n"
    "        if (dir === 'left') {\n"
    "          sprite.x = rightEdge - curW; // right edge fixed\n"
    "        } else {\n"
    "          sprite.x = oldCol * cellSz;  // left edge fixed\n"
    "        }\n"
    "        requestAnimationFrame(stepLast);\n"
    "      } else if (el < totalDurL) {\n"
    "        // Phase 3: machine head fades out\n"
    "        if (!textureSwapped) {\n"
    "          textureSwapped = true;\n"
    "          const mTex = getPropTexture(1, dir);\n"
    "          sprite.texture = mTex;\n"
    "          sprite.width  = machineW;\n"
    "          sprite.height = cellSz;\n"
    "          sprite.x = dir === 'left' ? rightEdge - machineW : oldCol * cellSz;\n"
    "          sprite.y = baseYy;\n"
    "        }\n"
    "        sprite.alpha = 1 - (el - shakeDurL - shrinkDurL) / fadeDurL;\n"
    "        requestAnimationFrame(stepLast);\n"
    "      } else {\n"
    "        sprite.alpha = 1;\n"
    "        if (onComplete) onComplete();\n"
    "      }\n"
    "    }\n"
    "    requestAnimationFrame(stepLast);\n"
    "    return;\n"
    "  }\n"
)

if OLD_INSTANT in content:
    content = content.replace(OLD_INSTANT, NEW_FADE, 1)
    print("OK: 3-phase last-piece animation added")
else:
    print("ERROR: instant-removal block not found")
    idx = content.find('If the prop is being fully consumed')
    print("Found instant block at:", idx)
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
