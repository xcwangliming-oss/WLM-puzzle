#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

OLD = (
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

NEW = (
    "    if (candyW > 0 && customPropCandyImg) {\n"
    "      const sc = cellSize / customPropCandyImg.naturalHeight;\n"
    "      const tw = Math.max(1, Math.ceil(customPropCandyImg.naturalWidth * sc));\n"
    "      // Scale tile\n"
    "      const tc = document.createElement('canvas'); tc.width = tw; tc.height = cellSize;\n"
    "      tc.getContext('2d')!.drawImage(customPropCandyImg, 0, 0, tw, cellSize);\n"
    "      // Draw all tiles into a full-width candy strip canvas\n"
    "      const strip = document.createElement('canvas');\n"
    "      strip.width = candyW; strip.height = cellSize;\n"
    "      const sCtx = strip.getContext('2d')!;\n"
    "      for (let dx = 0; dx < candyW; dx += tw) {\n"
    "        sCtx.drawImage(tc, dx, 0, tw, cellSize);\n"
    "      }\n"
    "      // For 'right' dir: flip the ENTIRE strip horizontally so spiral direction reverses\n"
    "      const candyStartX = dir === 'left' ? 0 : machineW;\n"
    "      cx.save();\n"
    "      if (dir === 'right') {\n"
    "        // translate to where the strip ends, then scale -1 to draw it mirrored\n"
    "        cx.translate(candyStartX + candyW, 0);\n"
    "        cx.scale(-1, 1);\n"
    "        cx.drawImage(strip, 0, 0, candyW, cellSize);\n"
    "      } else {\n"
    "        cx.drawImage(strip, candyStartX, 0, candyW, cellSize);\n"
    "      }\n"
    "      cx.restore();\n"
    "    }"
)

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    print("OK: candy strip flipped as a whole for right direction")
else:
    print("ERROR: target block not found")
    idx = content.find('tileCanvas.width = tw')
    if idx >= 0:
        print(repr(content[idx-200:idx+400]))
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
