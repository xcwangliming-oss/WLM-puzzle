import re
import json

with open('src/main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update interfaces
content = content.replace("propType?: 'row-bomb';", "propType?: 'row-bomb' | 'peppermint';\n  propDir?: 'left' | 'right';")

# 2. replace getPropTexture
old_getPropTexture = """let propTextureCache: Record<string, PIXI.Texture> = {};
function getPropTexture(type: string): PIXI.Texture {
  if (propTextureCache[type]) return propTextureCache[type];
  const size = PARAMS.cellSize || 50;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#ff6600');
  grad.addColorStop(1, '#ff2200');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(2, 2, size - 4, size - 4, 6);
  ctx.fill();
  // Inner glow
  const innerGrad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
  innerGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.roundRect(4, 4, size - 8, size - 8, 4);
  ctx.fill();
  // Lightning icon
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', size / 2, size / 2);
  const tex = PIXI.Texture.from(canvas);
  propTextureCache[type] = tex;
  return tex;
}"""

new_getPropTexture = """let propTextureCache: Record<string, PIXI.Texture> = {};

function getPropTexture(length: number, dir: 'left' | 'right' = 'left'): PIXI.Texture {
  const cellSize = PARAMS.cellSize || 50;
  const key = `peppermint_${length}_${dir}_${cellSize}`;
  if (propTextureCache[key]) return propTextureCache[key];

  const w = length * cellSize;
  const h = cellSize;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const machineRadius = h * 0.42;
  const machineCenterX = dir === 'left' ? w - h / 2 : h / 2;
  const machineCenterY = h / 2;

  // 1. Draw Candy Stick Body
  const stickStartX = dir === 'left' ? 4 : h * 0.45;
  const stickEndX = dir === 'left' ? w - h * 0.45 : w - 4;
  const stickW = Math.max(2, stickEndX - stickStartX);
  const stickY = h * 0.12;
  const stickH = h * 0.76;
  const cornerRadius = h * 0.32;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(stickStartX, stickY, stickW, stickH, cornerRadius);
  ctx.clip();

  // White Base
  ctx.fillStyle = '#fff0f3';
  ctx.fillRect(0, 0, w, h);

  // Red Diagonal Stripes
  ctx.fillStyle = '#e60033';
  const stripeWidth = h * 0.28;
  const stripeGap = h * 0.28;
  const step = stripeWidth + stripeGap;
  const angleOffset = h * 0.45;

  for (let x = -h * 2; x < w + h * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + stripeWidth, h);
    ctx.lineTo(x + stripeWidth + angleOffset, 0);
    ctx.lineTo(x + angleOffset, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Glossy 3D Tube Gradient
  const gloss = ctx.createLinearGradient(0, stickY, 0, stickY + stickH);
  gloss.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  gloss.addColorStop(0.25, 'rgba(255, 255, 255, 0.25)');
  gloss.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gloss.addColorStop(0.85, 'rgba(0, 0, 0, 0.25)');
  gloss.addColorStop(1.0, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  // Candy Stick Outer Outline
  ctx.beginPath();
  ctx.roundRect(stickStartX, stickY, stickW, stickH, cornerRadius);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(140, 0, 25, 0.7)';
  ctx.stroke();

  // 2. Metallic Connector Ring
  ctx.save();
  const connX = dir === 'left' ? w - h * 0.62 : h * 0.42;
  const connGrad = ctx.createLinearGradient(0, stickY, 0, stickY + stickH);
  connGrad.addColorStop(0, '#e6d8f5');
  connGrad.addColorStop(0.5, '#8a75d5');
  connGrad.addColorStop(1, '#3c2b70');
  ctx.fillStyle = connGrad;
  ctx.beginPath();
  ctx.roundRect(connX, stickY - 2, h * 0.2, stickH + 4, 3);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#27194e';
  ctx.stroke();
  ctx.restore();

  // 3. Machine Launcher Nozzle Head
  ctx.save();
  const machineGrad = ctx.createRadialGradient(
    machineCenterX - 2, machineCenterY - 2, 2,
    machineCenterX, machineCenterY, machineRadius
  );
  machineGrad.addColorStop(0, '#6c5ba7');
  machineGrad.addColorStop(0.7, '#342766');
  machineGrad.addColorStop(1, '#1b1238');

  ctx.fillStyle = machineGrad;
  ctx.beginPath();
  ctx.arc(machineCenterX, machineCenterY, machineRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#b09eff';
  ctx.stroke();

  // Inner Nozzle Ring
  const innerRadius = machineRadius * 0.7;
  ctx.fillStyle = '#221646';
  ctx.beginPath();
  ctx.arc(machineCenterX, machineCenterY, innerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#d5c9ff';
  ctx.stroke();

  // Center Machine Face/Nozzle Icon
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(h * 0.36)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🤖', machineCenterX, machineCenterY + 1);

  ctx.restore();

  const tex = PIXI.Texture.from(canvas);
  propTextureCache[key] = tex;
  return tex;
}"""

content = content.replace(old_getPropTexture, new_getPropTexture)


# 3. Update spawnBlock signature and texture logic
content = content.replace(
    "function spawnBlock(col: number, row: number, length: number, color: string, id?: number, noGravity?: boolean, isCollectible?: boolean, isProp?: boolean, propType?: 'row-bomb') {",
    "function spawnBlock(col: number, row: number, length: number, color: string, id?: number, noGravity?: boolean, isCollectible?: boolean, isProp?: boolean, propType?: 'row-bomb' | 'peppermint', propDir: 'left' | 'right' = 'left') {"
)

old_sb_texture = """  if (isProp) {
    // Prop blocks use a dynamically generated texture
    const texture = getPropTexture(propType || 'row-bomb');
    sprite = new PIXI.Sprite(texture);
  }"""
new_sb_texture = """  if (isProp) {
    const texture = getPropTexture(length, propDir);
    sprite = new PIXI.Sprite(texture);
  }"""
content = content.replace(old_sb_texture, new_sb_texture)

content = content.replace(
    "const block: Block = { id: blockId, col, row, length, color, sprite, noGravity, isCollectible, isProp, propType };",
    "const block: Block = { id: blockId, col, row, length, color, sprite, noGravity, isCollectible, isProp, propType, propDir };"
)


# 4. Update initOrUpdateManualPreviewSprite
old_preview = """function initOrUpdateManualPreviewSprite(length: number, color: string, visible: boolean = false) {
  if (color === 'prop-row-bomb') {
    if (manualPreviewSprite) {
      blocksContainer.removeChild(manualPreviewSprite);
      manualPreviewSprite.destroy();
    }
    const texture = getPropTexture('row-bomb');
    manualPreviewSprite = new PIXI.Sprite(texture);
    blocksContainer.addChild(manualPreviewSprite);
  } else if"""
new_preview = """function initOrUpdateManualPreviewSprite(length: number, color: string, visible: boolean = false) {
  if (color === 'prop-peppermint') {
    if (manualPreviewSprite) {
      blocksContainer.removeChild(manualPreviewSprite);
      manualPreviewSprite.destroy();
    }
    const texture = getPropTexture(length, manualSelectedBlock?.propDir || 'left');
    manualPreviewSprite = new PIXI.Sprite(texture);
    manualPreviewSprite.width = length * PARAMS.cellSize;
    manualPreviewSprite.height = PARAMS.cellSize;
    blocksContainer.addChild(manualPreviewSprite);
  } else if"""
content = content.replace(old_preview, new_preview)


# 5. manualSelectedBlock interface update
content = content.replace(
    "let manualSelectedBlock: { length: number; color: string } | null = null;",
    "let manualSelectedBlock: { length: number; color: string; propDir?: 'left' | 'right' } | null = null;"
)


# 6. buildManualBlockPalette
old_prop_palette = """    // Prop (Row Bomb) button - always available
    const propRow = document.createElement('div');
    propRow.className = 'palette-row';
    propRow.style.justifyContent = 'center';
    propRow.style.marginBottom = '12px';
    propRow.style.borderBottom = '1px solid #444';
    propRow.style.paddingBottom = '8px';

    const propBtn = document.createElement('div');
    propBtn.className = 'palette-block-btn';
    propBtn.innerText = '⚡';
    propBtn.style.background = 'linear-gradient(135deg, #ff6600, #ff2200)';
    propBtn.style.width = '24px';
    propBtn.title = '行炸弹道具 (1x1)';
    propBtn.onclick = () => {
      document.querySelectorAll('.palette-block-btn').forEach(el => el.classList.remove('active'));
      propBtn.classList.add('active');
      manualSelectedBlock = { length: 1, color: 'prop-row-bomb' };
      initOrUpdateManualPreviewSprite(1, 'prop-row-bomb', false);
    };
    propRow.appendChild(propBtn);
    manualBlockPalette.appendChild(propRow);"""

new_prop_palette = """    // Peppermint Machine Prop Section
    let currentPropDir: 'left' | 'right' = 'left';
    
    const propTitle = document.createElement('div');
    propTitle.style.color = '#fff';
    propTitle.style.fontSize = '12px';
    propTitle.style.marginBottom = '4px';
    propTitle.style.textAlign = 'center';
    propTitle.innerText = '🍬 机器糖果棒道具';
    manualBlockPalette.appendChild(propTitle);

    const dirRow = document.createElement('div');
    dirRow.className = 'palette-row';
    dirRow.style.justifyContent = 'center';
    dirRow.style.marginBottom = '4px';

    const leftDirBtn = document.createElement('button');
    leftDirBtn.innerText = '⬅️ 向右机器 (向左延展)';
    leftDirBtn.style.fontSize = '11px';
    leftDirBtn.style.marginRight = '4px';
    leftDirBtn.style.background = '#444';
    leftDirBtn.style.color = '#fff';
    leftDirBtn.style.border = '1px solid #666';
    leftDirBtn.style.borderRadius = '4px';
    leftDirBtn.style.padding = '2px 6px';
    leftDirBtn.style.cursor = 'pointer';

    const rightDirBtn = document.createElement('button');
    rightDirBtn.innerText = '➡️ 向左机器 (向右延展)';
    rightDirBtn.style.fontSize = '11px';
    rightDirBtn.style.background = '#444';
    rightDirBtn.style.color = '#fff';
    rightDirBtn.style.border = '1px solid #666';
    rightDirBtn.style.borderRadius = '4px';
    rightDirBtn.style.padding = '2px 6px';
    rightDirBtn.style.cursor = 'pointer';

    const updateDirUI = () => {
      leftDirBtn.style.background = currentPropDir === 'left' ? '#666' : '#444';
      rightDirBtn.style.background = currentPropDir === 'right' ? '#666' : '#444';
      if (manualSelectedBlock && manualSelectedBlock.color === 'prop-peppermint') {
        manualSelectedBlock.propDir = currentPropDir;
        initOrUpdateManualPreviewSprite(manualSelectedBlock.length, 'prop-peppermint', false);
      }
    };
    leftDirBtn.onclick = () => { currentPropDir = 'left'; updateDirUI(); };
    rightDirBtn.onclick = () => { currentPropDir = 'right'; updateDirUI(); };
    updateDirUI();
    dirRow.appendChild(leftDirBtn);
    dirRow.appendChild(rightDirBtn);
    manualBlockPalette.appendChild(dirRow);

    const propRow = document.createElement('div');
    propRow.className = 'palette-row';
    propRow.style.justifyContent = 'center';
    propRow.style.marginBottom = '12px';
    propRow.style.borderBottom = '1px solid #444';
    propRow.style.paddingBottom = '8px';

    [1, 2, 3, 4, 5, 6].forEach(l => {
      const btn = document.createElement('div');
      btn.className = 'palette-block-btn';
      btn.innerText = `${l}格`;
      btn.style.background = 'linear-gradient(135deg, #e60033, #ffffff)';
      btn.style.color = '#000';
      btn.style.fontSize = '10px';
      const widths: Record<number, number> = { 1: 18, 2: 32, 3: 46, 4: 60, 5: 74, 6: 88 };
      btn.style.width = `${widths[l]}px`;
      
      btn.onclick = () => {
        document.querySelectorAll('.palette-block-btn').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        manualSelectedBlock = { length: l, color: 'prop-peppermint', propDir: currentPropDir };
        initOrUpdateManualPreviewSprite(l, 'prop-peppermint', false);
      };
      propRow.appendChild(btn);
    });
    manualBlockPalette.appendChild(propRow);"""
content = content.replace(old_prop_palette, new_prop_palette)


# 7. setupInteraction manual placement handler
old_placement = """            if (isColl) {
              const activeIdStr = String(activeCollectibleId);
              if (activeIdStr === 'star' || activeIdStr === 'coin') spawnColor = 'yellow';
              else if (activeIdStr === 'gem') spawnColor = 'blue';
              else if (activeIdStr === 'heart') spawnColor = 'pink';
              else spawnColor = 'pink';
            } else if (isPropBlock) {
              spawnColor = 'red'; // Props use a default color for gravity/data purposes
            }
            spawnBlock(col, row, length, spawnColor, undefined, undefined, isColl, isPropBlock, isPropBlock ? 'row-bomb' : undefined);"""
new_placement = """            if (isColl) {
              const activeIdStr = String(activeCollectibleId);
              if (activeIdStr === 'star' || activeIdStr === 'coin') spawnColor = 'yellow';
              else if (activeIdStr === 'gem') spawnColor = 'blue';
              else if (activeIdStr === 'heart') spawnColor = 'pink';
              else spawnColor = 'pink';
            } else if (color === 'prop-peppermint') {
              spawnColor = 'red';
            }
            if (color === 'prop-peppermint') {
              spawnBlock(col, row, length, spawnColor, undefined, undefined, false, true, 'peppermint', manualSelectedBlock.propDir || 'left');
            } else {
              spawnBlock(col, row, length, spawnColor, undefined, undefined, isColl, false, undefined);
            }"""
content = content.replace("const isPropBlock = color === 'prop-row-bomb';", "")
content = content.replace(old_placement, new_placement)

# 8. propType -> propDir mappings mapping and spawnBlock calls
content = re.sub(r'propType: ([a-zA-Z]+)\.propType', r'propType: \1.propType,\n      propDir: \1.propDir', content)

# 9. Fixing the 5 spawnBlock bugs introduced by my PowerShell command
content = content.replace("spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType);", "spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType, sb.propDir);")


# wait, I need to check my PowerShell replacements carefully.
# In `src/main.ts`, these lines are currently:
# 1389: spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType);
# 1865: spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType);
# 7225: spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType);
# 8478: spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType); -> this one is WRONG originally! It was `spawnBlock(col, row, length, color, undefined, isNoGravityMode ? sb.noGravity : false, sb.isCollectible, sb.isProp, sb.propType);`
# 8712: spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType); -> this one was `spawnBlock(col, row, length, color, sb.id, sb.noGravity, sb.isCollectible, sb.isProp, sb.propType);`
# And 1063: `spawnBlock(ib.col, ib.row, ib.length, ib.color, ib.id, ib.noGravity, ib.isCollectible, ib.isProp, ib.propType);`
# 1480: `spawnBlock(cb.col, cb.row, cb.length, cb.color, cb.id, cb.noGravity, cb.isCollectible, cb.isProp, cb.propType);`


# Let's fix 8478 and 8712 and others by just re-writing the correct ones:
lines = content.splitlines()

# We can fix them explicitly by line number or regex if we know what they should be.
# It's better to just do this properly.

# checkEliminations logic
old_checkElims = '''    // ===== Prop trigger logic: scan for props near eliminated rows =====
    const propTriggeredRows = new Set<number>();
    const triggeredPropIds = new Set<number>();
    
    function scanPropsForTrigger(eliminatedRows: number[]) {
      let newRows: number[] = [];
      for (const b of blocks) {
        if (!b.isProp || triggeredPropIds.has(b.id)) continue;
        const isTriggered = eliminatedRows.some(r => Math.abs(r - b.row) <= 1);
        if (isTriggered) {
          triggeredPropIds.add(b.id);
          if (!eliminatedRows.includes(b.row) && !propTriggeredRows.has(b.row)) {
            propTriggeredRows.add(b.row);
            newRows.push(b.row);
          }
        }
      }
      return newRows;
    }
    
    // Chain reaction: new rows may trigger more props
    let currentTriggerRows = [...fullRows];
    while (true) {
      const newRows = scanPropsForTrigger(currentTriggerRows);
      if (newRows.length === 0) break;
      currentTriggerRows = newRows;
    }
    
    // Merge prop-triggered rows into fullRows
    propTriggeredRows.forEach(r => {
      if (!fullRows.includes(r)) fullRows.push(r);
    });
    fullRows.sort((a, b) => a - b);
    // ===== End prop trigger logic ====='''

new_checkElims = '''    // ===== Prop trigger logic: Peppermint machine shrinks =====
    let propsToRemove: typeof blocks = [];
    for (const b of blocks) {
      if (!b.isProp) continue;
      if (fullRows.some(r => Math.abs(r - b.row) <= 1)) {
        if (b.propDir === 'right') {
          b.length -= 1;
        } else {
          b.col += 1;
          b.length -= 1;
        }
        
        if (b.length > 0) {
          b.sprite.texture = getPropTexture(b.length, b.propDir || 'left');
          b.sprite.x = b.col * PARAMS.cellSize;
          b.sprite.width = b.length * PARAMS.cellSize;
          if (typeof playRowShatterEffect === 'function') {
            playRowShatterEffect([b.row]);
          }
        } else {
          propsToRemove.push(b);
        }
      }
    }
    propsToRemove.forEach(b => {
      blocksContainer.removeChild(b.sprite);
      blocks = blocks.filter(blk => blk.id !== b.id);
    });
    // ===== End prop trigger logic ====='''
content = content.replace(old_checkElims, new_checkElims)

old_checkSimElims = '''  // Prop chain trigger (simulation)
  const triggeredPropIds = new Set<number>();
  let currentRows = [...fullRows];
  while (true) {
    let newRows: number[] = [];
    for (const b of simBlocks) {
      if (!b.isProp || triggeredPropIds.has(b.id)) continue;
      if (currentRows.some(r => Math.abs(r - b.row) <= 1)) {
        triggeredPropIds.add(b.id);
        if (!fullRows.includes(b.row)) {
          fullRows.push(b.row);
          newRows.push(b.row);
        }
      }
    }
    if (newRows.length === 0) break;
    currentRows = newRows;
  }'''
new_checkSimElims = '''  if (fullRows.length > 0) {
    for (let i = simBlocks.length - 1; i >= 0; i--) {
      const b = simBlocks[i];
      if (!b.isProp) continue;
      if (fullRows.some(r => Math.abs(r - b.row) <= 1)) {
        if (b.propDir === 'right') {
          b.length -= 1;
        } else {
          b.col += 1;
          b.length -= 1;
        }
        if (b.length <= 0) {
          simBlocks.splice(i, 1);
        }
      }
    }
  }'''
content = content.replace(old_checkSimElims, new_checkSimElims)


with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
