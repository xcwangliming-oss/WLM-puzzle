#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# Find and replace the candy tiling block in getPropTexture (custom path)
# The current code uses ctx.createPattern + translate which has pattern offset issues.
# Replace with manual per-tile drawing + mirroring for 'right' direction.

OLD_CANDY_BLOCK = (
    "    if (candyW > 0 && customPropCandyImg) {\n"
    "      const sc = cellSize / customPropCandyImg.naturalHeight;\n"
    "      const tw = Math.max(1, Math.ceil(customPropCandyImg.naturalWidth * sc));\n"
    "      const tc = document.createElement('canvas'); tc.width = tw; tc.height = cellSize;\n"
    "      tc.getContext('2d')!.drawImage(customPropCandyImg, 0, 0, tw, cellSize);\n"
    "      const pat = cx.createPattern(tc, 'repeat-x');\n"
    "      if (pat) {\n"
    "        cx.save(); cx.beginPath();\n"
    "        if (dir === 'left') { cx.rect(0, 0, candyW, h2); }\n"
    "        else { cx.translate(machineW, 0); cx.rect(0, 0, candyW, h2); }\n"
    "        cx.clip(); cx.fillStyle = pat; cx.fillRect(0, 0, candyW, h2); cx.restore();\n"
    "      }\n"
    "    }"
)

NEW_CANDY_BLOCK = (
    "    if (candyW > 0 && customPropCandyImg) {\n"
    "      const sc = cellSize / customPropCandyImg.naturalHeight;\n"
    "      const tw = Math.max(1, Math.ceil(customPropCandyImg.naturalWidth * sc));\n"
    "      // Build scaled tile canvas\n"
    "      const tc = document.createElement('canvas'); tc.width = tw; tc.height = cellSize;\n"
    "      tc.getContext('2d')!.drawImage(customPropCandyImg, 0, 0, tw, cellSize);\n"
    "      // For 'right' direction: mirror the tile so candy appears to flow toward the machine\n"
    "      const tileCanvas = document.createElement('canvas');\n"
    "      tileCanvas.width = tw; tileCanvas.height = cellSize;\n"
    "      const tCtx = tileCanvas.getContext('2d')!;\n"
    "      if (dir === 'right') {\n"
    "        tCtx.save(); tCtx.translate(tw, 0); tCtx.scale(-1, 1);\n"
    "        tCtx.drawImage(tc, 0, 0); tCtx.restore();\n"
    "      } else {\n"
    "        tCtx.drawImage(tc, 0, 0);\n"
    "      }\n"
    "      // Manual tiling: clip to candy region then draw tiles\n"
    "      const candyStartX = dir === 'left' ? 0 : machineW;\n"
    "      cx.save();\n"
    "      cx.beginPath();\n"
    "      cx.rect(candyStartX, 0, candyW, h2);\n"
    "      cx.clip();\n"
    "      for (let dx = candyStartX; dx < candyStartX + candyW; dx += tw) {\n"
    "        cx.drawImage(tileCanvas, dx, 0, tw, h2);\n"
    "      }\n"
    "      cx.restore();\n"
    "    }"
)

if OLD_CANDY_BLOCK in content:
    content = content.replace(OLD_CANDY_BLOCK, NEW_CANDY_BLOCK, 1)
    print("OK: candy tiling replaced with manual tile + mirror for right dir")
else:
    print("ERROR: candy block not found")
    idx = content.find('createPattern(tc')
    if idx >= 0:
        print(repr(content[idx-200:idx+300]))
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
