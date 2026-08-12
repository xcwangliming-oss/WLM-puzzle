#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Add preload logic before preloadAllMaterials
preload_logic = """const shatterTextures: Record<string, PIXI.Texture[]> = {};
let shatterPreloaded = false;

async function preloadShatterEffects() {
  if (shatterPreloaded) return;
  shatterPreloaded = true;
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  const colorMap: Record<string, string> = {
    'red': '红', 'blue': '蓝', 'green': '绿', 'yellow': '黄', 'pink': '粉'
  };
  const promises = [];
  for (const c of colors) {
    shatterTextures[c] = [];
    const folderName = colorMap[c];
    for (let i = 0; i <= 84; i++) {
      const idxStr = i.toString().padStart(2, '0');
      const url = `/assets/gem-shatter/${folderName}/Armature_1_1_${idxStr}.png`;
      promises.push(PIXI.Assets.load(url).then(tex => {
        shatterTextures[c][i] = tex;
      }).catch(() => {}));
    }
  }
  await Promise.all(promises);
}

async function preloadAllMaterials() {"""

if 'async function preloadShatterEffects' not in ts:
    ts = ts.replace("async function preloadAllMaterials() {", preload_logic)

# 2. Add await preloadShatterEffects() inside preloadAllMaterials
old_preload_start = """async function preloadAllMaterials() {



try {"""
new_preload_start = """async function preloadAllMaterials() {
await preloadShatterEffects();
try {"""
ts = ts.replace(old_preload_start, new_preload_start)

# 3. Modify checkEliminations block removal
old_tl_to = """tl.to(b.sprite.scale, { y: 0, duration: 0.1, ease: 'power2.in' }, delay);



tl.to(b.sprite, { alpha: 0, duration: 0.1 }, delay);"""

new_tl_to = """tl.to(b.sprite.scale, { y: 0, duration: 0.1, ease: 'power2.in' }, delay);
tl.to(b.sprite, { alpha: 0, duration: 0.1 }, delay);

tl.call(() => {
  const texArray = shatterTextures[b.color];
  if (texArray && texArray.length > 0 && texArray[0]) {
    const anim = new PIXI.AnimatedSprite(texArray.filter(t => t));
    anim.loop = false;
    anim.animationSpeed = 0.5; // adjust if too fast/slow
    
    anim.anchor.set(0.5);
    const cellSz = PARAMS.cellSize || 50;
    const w = b.length * cellSz;
    // Position it at the center of the block
    anim.x = b.col * cellSz + w / 2;
    anim.y = b.sprite.y + cellSz / 2;
    
    // Scale it to cover the block appropriately
    // Since images are huge, let's fix its dimensions
    // We want it to be a bit larger than the block's width and height
    const targetW = w * 1.5;
    const targetH = cellSz * 4; // Gem shatter is usually vertical
    
    // Maintain aspect ratio: original size doesn't matter, we force it
    // But AnimatedSprite inherits size from its first frame.
    // If we just set width and height, it will scale
    anim.width = targetW;
    anim.height = targetH;
    
    anim.onComplete = () => {
      if (anim.parent) anim.parent.removeChild(anim);
      anim.destroy();
    };
    blocksContainer.addChild(anim);
    anim.play();
  }
}, [], delay);"""

if old_tl_to in ts:
    ts = ts.replace(old_tl_to, new_tl_to)
else:
    print("Error: Could not find gsap block removal animation.")
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print("Patch applied successfully.")
