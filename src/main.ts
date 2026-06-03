import './style.css'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'



// ---- Configuration ----
const PARAMS = {
  viewportRows: 17,
  totalRows: 50,
  gridCols: 10,
  cellSize: 50,
  scrollSpeed: 30, // px per sec
  gravityDuration: 0.4,
  eliminationDuration: 0.8,
}

const PROBS = {
  1: 20, 2: 40, 3: 30, 4: 10
};

// ---- State ----
type GameMode = 'play' | 'draw' | 'manual';
let currentMode: GameMode = 'play';
let manualSelectedBlock: { length: number; color: string } | null = null;
let manualPreviewSprite: PIXI.Sprite | null = null;
let manualInitialStateSnapshot: string = '';
let isGameStarted = false;
let gameTime = 0;
let comboCount = 0;
let hasAnyEliminationThisStep = false;
let isColorChangingMode = false;
let isRainbowMode = false;
let isRainbowFixedMode = false;
let isMaterialChangingMode = false;
let activeMaterialIndex = 0;
let colorPairIndex = 0;
const COLOR_PAIRS = [
  ['blue', 'pink'],
  ['pink', 'green'],
  ['green', 'red'],
  ['red', 'yellow'],
  ['yellow', 'blue'],
];
const RAINBOW_PALETTE = ['pink','blue','yellow','green','red'];
let rowColors: string[] = [];

// Gameplay Mode State
let isGameplayMode = false;
let gameplayTimer: any = null;
const gameplayRiseInterval = 3500;
let savedParamsBackup: any = null;

// Script Editor State
interface ScriptStep {
  blockId?: number;
  fromCol: number;
  row: number;
  toCol: number;
}
let scriptSteps: ScriptStep[] = [];
let selectedStepIndex: number | null = null;
let isRecordingSteps = false;
let isPlayingScript = false;
let initialBoardBlocks: { id?: number; col: number; row: number; length: number; color: string }[] = [];
let initialScrollY = 0;

// Preloaded materials cache
const preloadedMaterials = new Map<number, Record<string, PIXI.Texture>>();
let preloadedMaterialIds: number[] = [];

class MaterialDB {
  private dbName = 'BlockPuzzleDB';
  private storeName = 'materials';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }
        db.createObjectStore(this.storeName, { keyPath: 'id' });
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMaterials(): Promise<{ id: number; name: string; hasTextures: boolean }[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const list = request.result || [];
        resolve(list.map((item: any) => ({
          id: item.id,
          name: item.name,
          hasTextures: item.textures && Object.keys(item.textures).length > 0
        })));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMaterialTextures(id: number): Promise<Record<string, string> | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.textures);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addMaterial(name: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const id = Date.now();
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add({ id, name, textures: {} });
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMaterialTextures(id: number, textures: Record<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.textures = textures;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error(`Material pack not found for ID: ${id}`));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteMaterial(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const materialDB = new MaterialDB();

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function applyMaterialPack(textures: Record<string, string>) {
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  for (const c of colors) {
    for (let l = 1; l <= 4; l++) {
      const alias = `${c}-${l}`;
      const base64Src = textures[alias];
      if (!base64Src) continue;
      
      const texture = await PIXI.Assets.load<PIXI.Texture>(base64Src);
      PIXI.Assets.cache.set(alias, texture);
      
      blocks.forEach(b => {
        if (b.color === c && b.length === l) {
          b.sprite.texture = texture;
        }
      });
    }
  }
}

async function restoreDefaultTextures() {
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  for (const c of colors) {
    for (let l = 1; l <= 4; l++) {
      const alias = `${c}-${l}`;
      const texture = await PIXI.Assets.load<PIXI.Texture>(`assets/blocks/${c}-${l}.png`);
      PIXI.Assets.cache.set(alias, texture);
      
      blocks.forEach(b => {
        if (b.color === c && b.length === l) {
          b.sprite.texture = texture;
        }
      });
    }
  }
}

async function preloadAllMaterials() {
  try {
    const list = await materialDB.getAllMaterials();
    console.log('preloadAllMaterials list from DB:', list);
    const ids: number[] = [];
    const loadPromises: Promise<void>[] = [];

    for (const item of list) {
      if (!item.hasTextures) continue;
      ids.push(item.id);
      if (preloadedMaterials.has(item.id)) continue;
      
      console.log('Scheduling textures preload for pack:', item.id, item.name);
      const p = (async () => {
        const texturesData = await materialDB.getMaterialTextures(item.id);
        if (texturesData) {
          const textureRecord: Record<string, PIXI.Texture> = {};
          const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
          const texturesPromises: Promise<void>[] = [];
          
          for (const c of colors) {
            for (let l = 1; l <= 4; l++) {
              const alias = `${c}-${l}`;
              const base64Src = texturesData[alias];
              if (base64Src) {
                const lp = PIXI.Assets.load<PIXI.Texture>(base64Src).then(texture => {
                  textureRecord[alias] = texture;
                });
                texturesPromises.push(lp);
              }
            }
          }
          await Promise.all(texturesPromises);
          preloadedMaterials.set(item.id, textureRecord);
          console.log('Successfully preloaded pack:', item.id, 'textures count:', Object.keys(textureRecord).length);
        }
      })();
      loadPromises.push(p);
    }
    await Promise.all(loadPromises);
    preloadedMaterialIds = ids;
    console.log('preloadAllMaterials finished. preloadedMaterialIds:', preloadedMaterialIds);
  } catch (err) {
    console.error('Error preloading materials:', err);
  }
}

function applyCachedMaterialPack(cachedTextures: Record<string, PIXI.Texture>) {
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  for (const c of colors) {
    for (let l = 1; l <= 4; l++) {
      const alias = `${c}-${l}`;
      const texture = cachedTextures[alias];
      if (!texture) continue;
      
      PIXI.Assets.cache.set(alias, texture);
      
      blocks.forEach(b => {
        if (b.color === c && b.length === l) {
          b.sprite.texture = texture;
        }
      });
    }
  }
}

function updateActiveMaterialUI(activeId: number | null) {
  const slotButtons = document.querySelectorAll('.btn-material-slot');
  slotButtons.forEach(btn => {
    const btnId = btn.getAttribute('data-id');
    if (btnId && parseInt(btnId) === activeId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function changeMaterialsInOrder() {
  console.log('changeMaterialsInOrder called. preloadedMaterialIds:', preloadedMaterialIds);
  if (preloadedMaterialIds.length === 0) {
    console.warn('No preloaded material IDs available!');
    return;
  }

  const packId = preloadedMaterialIds[activeMaterialIndex % preloadedMaterialIds.length];
  activeMaterialIndex++;
  console.log('Selected packId:', packId, 'activeMaterialIndex:', activeMaterialIndex);

  const cachedTextures = preloadedMaterials.get(packId);
  console.log('cachedTextures for packId:', packId, cachedTextures ? 'found' : 'not found');
  if (cachedTextures) {
    applyCachedMaterialPack(cachedTextures);
    localStorage.setItem('activeMaterialId', packId.toString());
    updateActiveMaterialUI(packId);
  }
}

// ---- Step Script Editor Helpers ----
function captureBoardState() {
  initialBoardBlocks = blocks.map(b => ({
    id: b.id,
    col: b.col,
    row: b.row,
    length: b.length,
    color: b.color
  }));
  initialScrollY = worldContainer.y;
}

function getRainbowFixedColor(row: number): string {
  const rowIndexFromBottom = PARAMS.totalRows - 1 - row;
  return RAINBOW_PALETTE[Math.floor(rowIndexFromBottom / 3) % RAINBOW_PALETTE.length];
}

function initRowColors() {
  rowColors = [];
  for (let r = 0; r < PARAMS.totalRows; r++) {
    rowColors.push(getRainbowFixedColor(r));
  }
}

function resetAndApplyActiveModeStyle() {
  if (isColorChangingMode) {
    colorPairIndex = 0;
    const initialPair = COLOR_PAIRS[0];
    blocks.forEach(b => {
      const newColor = initialPair[Math.floor(Math.random() * 2)];
      b.color = newColor;
      const texture = PIXI.Assets.get(`${newColor}-${b.length}`);
      if (texture) b.sprite.texture = texture;
    });
    colorPairIndex = 1; // 下次消除从粉绿开始
  } else if (isRainbowMode) {
    if (blocks.length > 0) {
      const minRow = blocks.reduce((m, b) => Math.min(m, b.row), Infinity);
      blocks.forEach(b => {
        const color = RAINBOW_PALETTE[Math.floor((b.row - minRow) / 3) % RAINBOW_PALETTE.length];
        b.color = color;
        const tex = PIXI.Assets.get(`${color}-${b.length}`);
        if (tex) b.sprite.texture = tex;
      });
    }
  } else if (isRainbowFixedMode) {
    initRowColors();
    blocks.forEach(b => {
      const color = rowColors[b.row];
      b.color = color;
      const tex = PIXI.Assets.get(`${color}-${b.length}`);
      if (tex) b.sprite.texture = tex;
    });
  } else if (isMaterialChangingMode) {
    activeMaterialIndex = 0;
    if (preloadedMaterialIds.length > 0) {
      const packId = preloadedMaterialIds[0];
      const cachedTextures = preloadedMaterials.get(packId);
      if (cachedTextures) {
        applyCachedMaterialPack(cachedTextures);
        localStorage.setItem('activeMaterialId', packId.toString());
        updateActiveMaterialUI(packId);
      }
      activeMaterialIndex = 1;
    }
  }
}

function restoreBoardState() {
  clearAllBlocks();
  initialBoardBlocks.forEach(ib => {
    spawnBlock(ib.col, ib.row, ib.length, ib.color, ib.id);
  });
  preventFullRows();
  runPhysicsInstant();
  resetAndApplyActiveModeStyle();
  worldContainer.y = initialScrollY;
}

function runPhysicsInstant() {
  let changed = true;
  let safetyCounter = 0;
  while (changed && safetyCounter < 100) {
    changed = false;
    safetyCounter++;
    
    // 1. Gravity fall
    blocks.sort((a, b) => b.row - a.row); // Bottom blocks first
    blocks.forEach(b => {
      let targetRow = b.row;
      while (targetRow < PARAMS.totalRows - 1) {
        let canDrop = true;
        for (const other of blocks) {
          if (other.id === b.id) continue;
          if (other.row === targetRow + 1) {
            if (b.col < other.col + other.length && b.col + b.length > other.col) { canDrop = false; break; }
          }
        }
        if (canDrop) targetRow++;
        else break;
      }
      if (targetRow !== b.row) {
        b.row = targetRow;
        b.sprite.y = targetRow * PARAMS.cellSize;
        if (isRainbowFixedMode) {
          const newColor = rowColors[targetRow];
          b.color = newColor;
          const texture = PIXI.Assets.get(`${newColor}-${b.length}`);
          if (texture) b.sprite.texture = texture;
        }
        changed = true;
      }
    });

    // Clear draggedBlockId after the first gravity drop in runPhysicsInstant
    draggedBlockId = null;

    // 2. Row elimination check
    const occ = getGridOccupancy();
    const fullRows: number[] = [];
    for (let r = 0; r < PARAMS.totalRows; r++) {
      let isFull = true;
      for (let c = 0; c < PARAMS.gridCols; c++) {
        if (occ[r][c] === 0) { isFull = false; break; }
      }
      if (isFull) fullRows.push(r);
    }
    if (fullRows.length > 0) {
      fullRows.sort((a, b) => a - b).forEach(r => {
        blocks.filter(b => b.row === r).forEach(b => blocksContainer.removeChild(b.sprite));
        blocks = blocks.filter(b => b.row !== r);
        for (let y = r; y > 0; y--) {
          rowColors[y] = rowColors[y - 1];
        }
        rowColors[0] = getRainbowFixedColor(0);
      });
      if (isColorChangingMode) {
        changeColorsInPairs();
      }
      if (isMaterialChangingMode) {
        changeMaterialsInOrder();
      }
      changed = true;
    }
  }
}

function repairScriptSteps() {
  if (scriptSteps.length === 0) return;
  const currentBlocksBackup = blocks.map(b => ({ id: b.id, col: b.col, row: b.row, length: b.length, color: b.color }));
  
  clearAllBlocks();
  initialBoardBlocks.forEach(sb => {
    spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id);
  });
  
  for (let i = 0; i < scriptSteps.length; i++) {
    const step = scriptSteps[i];
    let block = step.blockId ? blocks.find(b => b.id === step.blockId) : null;
    if (!block) {
      block = blocks.find(b => b.row === step.row && b.col === step.fromCol);
    }
    if (!block) {
      const rowBlocks = blocks.filter(b => b.row === step.row);
      if (rowBlocks.length > 0) {
        rowBlocks.sort((a, b) => Math.abs(a.col - step.fromCol) - Math.abs(b.col - step.fromCol));
        block = rowBlocks[0];
        if (block) {
          step.fromCol = block.col;
          step.blockId = block.id;
        }
      }
    }
    if (block) {
      step.blockId = block.id;
      step.fromCol = block.col;
      step.row = block.row;
      
      block.col = step.toCol;
      draggedBlockId = block.id;
      runPhysicsInstant();
    }
  }
  
  clearAllBlocks();
  currentBlocksBackup.forEach(cb => {
    spawnBlock(cb.col, cb.row, cb.length, cb.color, cb.id);
  });
}

function jumpToStepState(stepIndex: number) {
  restoreBoardState();
  selectedStepIndex = stepIndex;

  // Execute all steps up to stepIndex-1 instantly
  for (let i = 0; i < stepIndex; i++) {
    const step = scriptSteps[i];
    let block = step.blockId ? blocks.find(b => b.id === step.blockId) : null;
    if (!block) {
      block = blocks.find(b => b.col === step.fromCol && b.row === step.row);
    }
    if (block) {
      block.col = step.toCol;
      block.sprite.x = step.toCol * PARAMS.cellSize;
      draggedBlockId = block.id;
      runPhysicsInstant();
    }
  }
  highlightStepUI(stepIndex);
}

function highlightStepUI(stepIndex: number | null) {
  const items = document.querySelectorAll('#script-step-list .material-slot-row');
  items.forEach((item, idx) => {
    const btn = item.querySelector('.btn-material-slot');
    if (btn) {
      if (idx === stepIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

function updateScriptUI() {
  const container = document.getElementById('script-step-list')!;
  container.innerHTML = '';
  scriptSteps.forEach((step, idx) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'material-slot-row';
    rowDiv.style.display = 'flex';
    rowDiv.style.gap = '6px';
    rowDiv.style.alignItems = 'center';
    
    const btn = document.createElement('button');
    btn.className = 'btn-material-slot';
    if (idx === selectedStepIndex) {
      btn.classList.add('active');
    }
    btn.innerHTML = `<span>步骤 ${idx + 1}: 行 ${step.row} (列 ${step.fromCol} ➔ ${step.toCol})</span>`;
    btn.onclick = () => {
      if (isPlayingScript) return;
      jumpToStepState(idx);
    };
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn-material-clear';
    btnDel.innerHTML = '🗑️';
    btnDel.title = '删除此步骤';
    btnDel.onclick = (e) => {
      e.stopPropagation();
      if (isPlayingScript) return;
      scriptSteps.splice(idx, 1);
      repairScriptSteps();
      selectedStepIndex = null;
      updateScriptUI();
      restoreBoardState();
    };
    
    rowDiv.appendChild(btn);
    rowDiv.appendChild(btnDel);
    container.appendChild(rowDiv);
  });
}

function waitForPhysics(): Promise<void> {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (!isAnimating) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    setTimeout(check, 80);
  });
}

async function playScript(autoScroll = false) {
  if (isPlayingScript || scriptSteps.length === 0) return;
  isPlayingScript = true;

  const btnPlay = document.getElementById('btn-script-play')!;
  const btnPlayScroll = document.getElementById('btn-script-play-scroll')!;
  btnPlay.innerText = '⏸ 暂停播放';
  btnPlayScroll.innerText = '⏸ 暂停播放';

  const durInput = document.getElementById('input-script-duration') as HTMLInputElement;
  const slideDelayInput = document.getElementById('input-script-delay-slide') as HTMLInputElement;
  const stepDelayInput = document.getElementById('input-script-delay-step') as HTMLInputElement;

  const duration = parseFloat(durInput.value) || 0.3;
  const slideDelay = parseFloat(slideDelayInput.value) || 0.15;
  const stepDelay = parseFloat(stepDelayInput.value) || 0.5;

  let startIdx = 0;
  const isResuming = (selectedStepIndex !== null && selectedStepIndex < scriptSteps.length);
  if (isResuming) {
    startIdx = selectedStepIndex!;
  } else {
    restoreBoardState();
    comboCount = 0;
    hasAnyEliminationThisStep = false;
  }
  
  if (autoScroll) {
    isGameStarted = true;
    gameTime = 0;
  }

  await new Promise(r => setTimeout(r, 200));

  for (let i = startIdx; i < scriptSteps.length; i++) {
    if (!isPlayingScript) break;

    selectedStepIndex = i;
    highlightStepUI(i);

    const step = scriptSteps[i];
    let block = step.blockId ? blocks.find(b => b.id === step.blockId) : null;
    if (!block) {
      block = blocks.find(b => b.col === step.fromCol && b.row === step.row);
    }
    if (block) {
      // 1. Move/Slide the block
      await new Promise<void>((resolve) => {
        isAnimating = true;
        
        // Brighten block during playback slide
        const brightFilter = new PIXI.ColorMatrixFilter();
        brightFilter.brightness(2.8, false);
        block.sprite.filters = [brightFilter];

        playSound(sounds.spawn);

        gsap.to(block.sprite, {
          x: step.toCol * PARAMS.cellSize,
          duration: duration,
          ease: 'power1.inOut',
          onComplete: () => {
            block.col = step.toCol;
            block.sprite.filters = []; // Clear filter
            isAnimating = false;
            resolve();
          }
        });
      });

      if (!isPlayingScript) break;

      // 2. Pause after slide
      if (slideDelay > 0) {
        await new Promise(r => setTimeout(r, slideDelay * 1000));
      }

      if (!isPlayingScript) break;

      // 3. Apply gravity and eliminations
      hasAnyEliminationThisStep = false;
      draggedBlockId = block.id;
      draggedBlockColor = block.color;
      blocksThatFell.clear();
      blocksThatFell.add(block.id);

      applyGravity(true);
      await waitForPhysics();

      if (!isPlayingScript) break;

      // 4. Pause between steps
      if (stepDelay > 0 && i < scriptSteps.length - 1) {
        await new Promise(r => setTimeout(r, stepDelay * 1000));
      }
    } else {
      console.warn(`[Playback] Block not found at (${step.fromCol}, ${step.row}) for step ${i + 1}`);
    }
  }

  const paused = (selectedStepIndex !== null && selectedStepIndex < scriptSteps.length - 1);
  isPlayingScript = false;
  if (!paused || selectedStepIndex === null) {
    selectedStepIndex = null;
    highlightStepUI(null);
  } else {
    selectedStepIndex++;
    highlightStepUI(selectedStepIndex);
  }
  isGameStarted = false;
  btnPlay.innerText = '▶ 自动播放';
  btnPlayScroll.innerText = '▶ 自动播放 (带上升)';

  // Clear any leftover filters
  blocks.forEach(b => {
    if (b.sprite) b.sprite.filters = [];
  });
}


function generateGameplayRow(row: number) {
  const occupied = Array(PARAMS.gridCols).fill(false);
  const targetWidth = Math.floor(Math.random() * 2) + 7; // fill 7 or 8 columns
  let filledWidth = 0;
  let retries = 0;
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  
  while (filledWidth < targetWidth && retries < 30) {
    retries++;
    const len = weightedRandomLength(Math.min(4, PARAMS.gridCols - filledWidth));
    if (len <= 0) continue;
    
    const freeCols: number[] = [];
    for (let c = 0; c <= PARAMS.gridCols - len; c++) {
      let isFree = true;
      for (let i = 0; i < len; i++) {
        if (occupied[c + i]) { isFree = false; break; }
      }
      if (isFree) freeCols.push(c);
    }
    if (freeCols.length === 0) continue;
    const startCol = freeCols[Math.floor(Math.random() * freeCols.length)];
    
    for (let i = 0; i < len; i++) occupied[startCol + i] = true;
    filledWidth += len;
    
    const color = isRainbowFixedMode ? rowColors[row] : colors[randomInt(0, colors.length - 1)];
    spawnBlock(startCol, row, len, color);
  }
}

function initGameplayModeBoard() {
  clearAllBlocks();
  const startRow = PARAMS.viewportRows - 4;
  for (let r = startRow; r < PARAMS.viewportRows; r++) {
    generateGameplayRow(r);
  }
  preventFullRows();
  applyGravity(false);
}

function spawnRisingRow() {
  if (isAnimating) return; // Skip if busy animating
  hasAnyEliminationThisStep = false;
  
  // 1. Shift all blocks up
  blocks.forEach(b => {
    b.row -= 1;
    b.sprite.y = b.row * PARAMS.cellSize;
  });
  
  for (let y = 0; y < PARAMS.totalRows - 1; y++) {
    rowColors[y] = rowColors[y + 1];
  }
  rowColors[PARAMS.totalRows - 1] = getRainbowFixedColor(PARAMS.totalRows - 1);
  
  // Proactive check
  const reachedTop = blocks.some(b => b.row < 0);
  if (reachedTop) {
    triggerGameplayGameOver();
    return;
  }
  
  // 2. Spawn new row at bottom
  const bottomRow = PARAMS.viewportRows - 1;
  generateGameplayRow(bottomRow);
  
  playSound(sounds.spawn);
  applyGravity(true);
}

function resetGameplayTimer() {
  if (!isGameplayMode || !isGameStarted) return;
  if (gameplayTimer) clearInterval(gameplayTimer);
  gameplayTimer = setInterval(() => {
    spawnRisingRow();
  }, gameplayRiseInterval);
}

function triggerGameOver() {
  isGameStarted = false;
  document.getElementById('btn-play')!.innerHTML = '<span class="icon">▶</span>开始<br>游戏';
  document.getElementById('game-over-text')!.style.display = 'block';
  if (gameplayTimer) {
    clearInterval(gameplayTimer);
    gameplayTimer = null;
  }
  
  setTimeout(() => {
    document.getElementById('game-over-text')!.style.display = 'none';
    if (isGameplayMode) {
      initGameplayModeBoard();
      isGameStarted = true;
      resetGameplayTimer();
    } else {
      restoreBoardState();
    }
  }, 3000);
}

function triggerGameplayGameOver() {
  triggerGameOver();
}

async function renderMaterialList() {
  const listContainer = document.getElementById('material-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  const activeIdStr = localStorage.getItem('activeMaterialId');
  const activeId = activeIdStr ? parseInt(activeIdStr) : null;

  try {
    const list = await materialDB.getAllMaterials();
    
    if (list.length === 0) {
      listContainer.innerHTML = '<div style="color: #666; font-size: 13px; text-align: center; margin-top: 20px;">暂无自定义材质包，请新建。</div>';
      return;
    }

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'material-slot-row';

      const slotBtn = document.createElement('button');
      slotBtn.className = 'btn-material-slot';
      slotBtn.setAttribute('data-id', item.id.toString());
      if (!item.hasTextures) {
        slotBtn.classList.add('empty');
        slotBtn.innerText = `${item.name} (空)`;
      } else {
        slotBtn.innerText = `${item.name} (已导入)`;
      }

      if (activeId === item.id) {
        slotBtn.classList.add('active');
      }

      slotBtn.onclick = async () => {
        if (!item.hasTextures) {
          // Import
          try {
            const dirHandle = await (window as any).showDirectoryPicker();
            const textures: Record<string, string> = {};
            let matchCount = 0;

            for await (const entry of dirHandle.values()) {
              if (entry.kind === 'file') {
                const file = await entry.getFile();
                
                let color = '';
                let length = 0;

                const englishMatch = file.name.match(/^(red|blue|green|yellow|pink)-([1-4])\.(png|jpg|jpeg|webp)$/i);
                if (englishMatch) {
                  color = englishMatch[1].toLowerCase();
                  length = parseInt(englishMatch[2]);
                } else {
                  const chineseMatch = file.name.match(/^(红|黄|绿|蓝|粉).+([1-4])\.(png|jpg|jpeg|webp)$/i);
                  if (chineseMatch) {
                    const chineseColor = chineseMatch[1];
                    length = parseInt(chineseMatch[2]);
                    const colorMap: Record<string, string> = {
                      '红': 'red',
                      '黄': 'yellow',
                      '绿': 'green',
                      '蓝': 'blue',
                      '粉': 'pink'
                    };
                    color = colorMap[chineseColor];
                  }
                }

                if (color && length) {
                  const base64 = await fileToBase64(file);
                  textures[`${color}-${length}`] = base64;
                  matchCount++;
                }
              }
            }

            if (matchCount === 0) {
              alert('未在所选文件夹中找到符合要求的方块图片！\n命名要求：例如 red-1.png, blue-3.png 或 红1-1.png, 黄1-3.png 等。');
              return;
            }

            await materialDB.saveMaterialTextures(item.id, textures);
            await preloadAllMaterials();
            await applyMaterialPack(textures);
            localStorage.setItem('activeMaterialId', item.id.toString());
            await renderMaterialList();
            alert(`已成功导入并切换至材质包 "${item.name}"！`);
          } catch (err) {
            console.error(err);
            if ((err as Error).name !== 'AbortError') {
              alert('导入材质包失败，请检查文件夹或浏览器支持状态。');
            }
          }
        } else {
          // Switch
          try {
            const textures = await materialDB.getMaterialTextures(item.id);
            if (textures) {
              await applyMaterialPack(textures);
              localStorage.setItem('activeMaterialId', item.id.toString());
              await renderMaterialList();
            } else {
              alert('读取材质包失败！');
            }
          } catch (err) {
            console.error(err);
            alert('读取材质包失败！');
          }
        }
      };

      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn-material-clear';
      clearBtn.title = '删除此材质包';
      clearBtn.innerHTML = '🗑️';
      clearBtn.onclick = async () => {
        if (!confirm(`确定要删除材质包 "${item.name}" 吗？`)) return;

        try {
          await materialDB.deleteMaterial(item.id);
          preloadedMaterials.delete(item.id);
          preloadedMaterialIds = preloadedMaterialIds.filter(id => id !== item.id);
          if (activeId === item.id) {
            localStorage.removeItem('activeMaterialId');
            await restoreDefaultTextures();
          }
          await renderMaterialList();
          alert(`材质包 "${item.name}" 已删除。`);
        } catch (err) {
          console.error(err);
          alert('删除材质包失败！');
        }
      };

      row.appendChild(slotBtn);
      row.appendChild(clearBtn);
      listContainer.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load materials list:', err);
  }
}

// ---- Audio ----
const sounds = {
  fall: new Audio('assets/音效/下落.mp3'),
  spawn: new Audio('assets/音效/出块儿.mp3'),
  combos: Array.from({ length: 10 }, (_, i) => new Audio(`assets/递进消除音效/gem_combo_${i + 1}.mp3`)),
  vocals: {
    good: new Audio('assets/人声/good.mp3'),
    great: new Audio('assets/人声/great.mp3'),
    amazing: new Audio('assets/人声/amazing.mp3'),
    excellent: new Audio('assets/人声/Excellent.mp3'),
    unbelievable: new Audio('assets/人声/unbelievable.mp3')
  }
};

let audioCtx: AudioContext | null = null;
let recAudioDest: MediaStreamAudioDestinationNode | null = null;
let audioSourcesInitialized = false;

function initAudioContext() {
  if (audioSourcesInitialized) return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  audioCtx = new AudioContextClass();
  recAudioDest = audioCtx.createMediaStreamDestination();

  const connectAudio = (audio: HTMLAudioElement) => {
    audio.crossOrigin = "anonymous";
    const source = audioCtx!.createMediaElementSource(audio);
    source.connect(audioCtx!.destination);
    source.connect(recAudioDest!);
  };

  connectAudio(sounds.fall);
  connectAudio(sounds.spawn);
  sounds.combos.forEach(connectAudio);
  Object.values(sounds.vocals).forEach(connectAudio);

  audioSourcesInitialized = true;
}

function playSound(audio: HTMLAudioElement) {
  if (!audioSourcesInitialized) {
    initAudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  audio.currentTime = 0;
  audio.play().catch(err => console.log('Audio play blocked:', err));
}

interface Block {
  id: number;
  col: number;
  row: number;
  length: number;
  color: string;
  sprite: PIXI.Sprite;
}

let app: PIXI.Application;
let worldContainer: PIXI.Container;
let blocks: Block[] = [];
let nextBlockId = 1;
let blocksContainer: PIXI.Container;
let holeGraphics: PIXI.Graphics;
let gridGraphics: PIXI.Graphics;
let isAnimating = false;
let shatterTextures: PIXI.Texture[] = [];
const blocksThatFell = new Set<number>();
let draggedBlockId: number | null = null;
let draggedBlockColor: string | null = null;

let holeMask: boolean[][] = [];
function resetHoleMask() {
  holeMask = Array.from({ length: PARAMS.totalRows }, () => Array(PARAMS.gridCols).fill(false));
  drawHoles();
}

// ---- Recording ----
let recorderWebM: MediaRecorder | null = null;
let recordedChunksWebM: Blob[] = [];
let isRecording = false;

// ---- Utilities ----
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getRandomColor() {
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  return colors[randomInt(0, colors.length - 1)];
}

function weightedRandomLength(maxAllowed: number): number {
  const allowedLengths = [1, 2, 3, 4].filter(l => l <= maxAllowed);
  if (allowedLengths.length === 0) return 0;
  let totalWeight = 0;
  for (const l of allowedLengths) totalWeight += PROBS[l as keyof typeof PROBS];
  let r = Math.random() * totalWeight;
  for (const l of allowedLengths) {
    r -= PROBS[l as keyof typeof PROBS];
    if (r <= 0) return l;
  }
  return allowedLengths[allowedLengths.length - 1];
}

// ---- Initialization ----
async function init() {
  app = new PIXI.Application();

  await app.init({
    width: PARAMS.gridCols * PARAMS.cellSize,
    height: PARAMS.viewportRows * PARAMS.cellSize,
    backgroundAlpha: 0,
    clearBeforeRender: true,
    preserveDrawingBuffer: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
  });

  const container = document.getElementById('board-wrapper');
  if (container) container.insertBefore(app.canvas, document.getElementById('game-over-text'));

  // Preload Assets
  const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
  for (const c of colors) {
    for (let l = 1; l <= 4; l++) {
      PIXI.Assets.add({ alias: `${c}-${l}`, src: `assets/blocks/${c}-${l}.png` });
    }
  }
  await PIXI.Assets.load(colors.flatMap(c => [1,2,3,4].map(l => `${c}-${l}`)));

  // Preload Shatter Effects
  for (let i = 0; i <= 44; i++) {
    const frameStr = i.toString().padStart(5, '0');
    PIXI.Assets.add({ alias: `shatter_${i}`, src: `assets/effects/break/1_${frameStr}.png` });
  }
  const shatterAliases = Array.from({ length: 45 }, (_, i) => `shatter_${i}`);
  await PIXI.Assets.load(shatterAliases);
  for (let i = 0; i <= 44; i++) {
    shatterTextures.push(PIXI.Assets.get(`shatter_${i}`));
  }

  gridGraphics = new PIXI.Graphics();
  app.stage.addChild(gridGraphics);

  worldContainer = new PIXI.Container();
  app.stage.addChild(worldContainer);

  holeGraphics = new PIXI.Graphics();
  worldContainer.addChild(holeGraphics);

  blocksContainer = new PIXI.Container();
  worldContainer.addChild(blocksContainer);

  drawGrid();
  resetHoleMask();
  initRowColors();
  setupInteraction();
  setupDOMUI();

  // Initialize MaterialDB and load active slot
  try {
    await materialDB.init();
    await preloadAllMaterials();
    // 默认普通模式，启动时不加载自定义材质，但保留材质面板的选中态高亮
    await renderMaterialList();
  } catch (dbErr) {
    console.error('Failed to initialize MaterialDB:', dbErr);
  }

  // Auto-scrolling ticker — scrolling is NEVER blocked by animations
  app.ticker.add((ticker) => {
    if (!isGameStarted) return;
    const deltaSec = ticker.deltaMS / 1000;
    
    gameTime += deltaSec;
    document.getElementById('time-display')!.innerText = gameTime.toFixed(1) + 's';
    
    worldContainer.y -= PARAMS.scrollSpeed * deltaSec;

    // Clamp
    const minY = -Math.max(0, PARAMS.totalRows - PARAMS.viewportRows) * PARAMS.cellSize;
    if (worldContainer.y < minY) worldContainer.y = minY;

    // Check Game Over (any block touches top of viewport)
    const minVisibleY = -worldContainer.y;
    const isGameOver = blocks.some(b => b.row * PARAMS.cellSize <= minVisibleY + 1);
    if (isGameOver) {
      triggerGameOver();
    }
  });
}

function drawGrid() {
  gridGraphics.clear();
  const w = PARAMS.gridCols * PARAMS.cellSize;
  const h = PARAMS.totalRows * PARAMS.cellSize;

  for (let i = 0; i <= PARAMS.gridCols; i++) {
    const x = i * PARAMS.cellSize;
    gridGraphics.moveTo(x, 0); gridGraphics.lineTo(x, h);
  }
  for (let i = 0; i <= PARAMS.totalRows; i++) {
    const y = i * PARAMS.cellSize;
    gridGraphics.moveTo(0, y); gridGraphics.lineTo(w, y);
  }
  gridGraphics.stroke({ width: 1, color: 0xffffff, alpha: 0.05 });
}

function drawHoles() {
  holeGraphics.clear();
  if (currentMode !== 'draw') return;

  for (let r = 0; r < PARAMS.totalRows; r++) {
    for (let c = 0; c < PARAMS.gridCols; c++) {
      if (holeMask[r][c]) {
        holeGraphics.rect(c * PARAMS.cellSize + 2, r * PARAMS.cellSize + 2, PARAMS.cellSize - 4, PARAMS.cellSize - 4);
      }
    }
  }
  holeGraphics.fill({ color: 0xc53a5c, alpha: 0.6 });
}

// ---- Block Logic ----
function getGridOccupancy(ignoreBlockId: number = -1): number[][] {
  const grid = Array.from({ length: PARAMS.totalRows }, () => Array(PARAMS.gridCols).fill(0));
  blocks.forEach(b => {
    if (b.id === ignoreBlockId) return;
    if (b.row >= 0 && b.row < PARAMS.totalRows) {
      for (let c = 0; c < b.length; c++) {
        if (b.col + c >= 0 && b.col + c < PARAMS.gridCols) {
          grid[b.row][b.col + c] = 1;
        }
      }
    }
  });
  return grid;
}

function canPlaceBlock(col: number, row: number, length: number): boolean {
  if (col < 0 || col + length > PARAMS.gridCols || row < 0 || row >= PARAMS.totalRows) return false;
  return !blocks.some(b => b.row === row && !(b.col + b.length <= col || b.col >= col + length));
}

function updateManualPreview(col: number, row: number) {
  if (!manualPreviewSprite || !manualSelectedBlock) return;
  const { length, color } = manualSelectedBlock;
  const texture = PIXI.Assets.get(`${color}-${length}`);
  if (texture) {
    manualPreviewSprite.texture = texture;
    manualPreviewSprite.width = length * PARAMS.cellSize;
    manualPreviewSprite.height = PARAMS.cellSize;
    manualPreviewSprite.x = col * PARAMS.cellSize;
    manualPreviewSprite.y = row * PARAMS.cellSize;
    
    if (canPlaceBlock(col, row, length)) {
      manualPreviewSprite.tint = 0x00ff00;
      manualPreviewSprite.alpha = 0.6;
    } else {
      const existing = blocks.find(b => b.row === row && col >= b.col && col < b.col + b.length);
      if (existing) {
        manualPreviewSprite.tint = 0xff3366;
        manualPreviewSprite.alpha = 0.7;
      } else {
        manualPreviewSprite.tint = 0xff0000;
        manualPreviewSprite.alpha = 0.4;
      }
    }
    manualPreviewSprite.visible = true;
  }
}


function spawnBlock(col: number, row: number, length: number, color: string, id?: number) {
  const texture = PIXI.Assets.get(`${color}-${length}`);
  if (!texture) return null;

  const sprite = new PIXI.Sprite(texture);
  sprite.width = length * PARAMS.cellSize;
  sprite.height = PARAMS.cellSize;
  sprite.x = col * PARAMS.cellSize;
  sprite.y = row * PARAMS.cellSize;

  sprite.eventMode = 'dynamic';
  sprite.cursor = 'grab';

  let isDragging = false;
  let dragStartPointerX = 0;
  let dragStartX = 0;
  let minCol = 0;
  let maxCol = PARAMS.gridCols - length;

  sprite.on('pointerdown', (e) => {
    if (currentMode !== 'play' || isAnimating) return;
    playSound(sounds.spawn);
    isDragging = true;
    sprite.cursor = 'grabbing';
    dragStartPointerX = e.global.x;
    dragStartX = sprite.x;

    // Brighten selected block
    const brightFilter = new PIXI.ColorMatrixFilter();
    brightFilter.brightness(2.8, false);
    sprite.filters = [brightFilter];

    const occ = getGridOccupancy(block.id);
    const rowOcc = occ[block.row] || [];

    minCol = 0;
    for (let c = block.col - 1; c >= 0; c--) { if (rowOcc[c]) { minCol = c + 1; break; } }
    maxCol = PARAMS.gridCols - length;
    for (let c = block.col + length; c < PARAMS.gridCols; c++) { if (rowOcc[c]) { maxCol = c - length; break; } }
  });

  app.stage.on('pointermove', (e) => {
    if (!isDragging) return;
    let newX = dragStartX + (e.global.x - dragStartPointerX);
    newX = Math.max(minCol * PARAMS.cellSize, Math.min(newX, maxCol * PARAMS.cellSize));
    sprite.x = newX;
  });

  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    sprite.cursor = 'grab';
    // Remove brightness filter
    sprite.filters = [];

    const newCol = Math.round(sprite.x / PARAMS.cellSize);
    sprite.x = newCol * PARAMS.cellSize;

    if (newCol !== block.col) {
      const oldCol = block.col;
      block.col = newCol;
      hasAnyEliminationThisStep = false;
      draggedBlockId = block.id;
      draggedBlockColor = block.color;
      blocksThatFell.clear();
      blocksThatFell.add(block.id);

      if (isRecordingSteps) {
        scriptSteps.push({ blockId: block.id, fromCol: oldCol, row: block.row, toCol: newCol });
        repairScriptSteps();
        updateScriptUI();
        applyGravity();
      } else if (selectedStepIndex !== null) {
        scriptSteps[selectedStepIndex].toCol = newCol;
        repairScriptSteps();
        runPhysicsInstant();
        updateScriptUI();
      } else {
        applyGravity();
      }

      if (isGameplayMode) {
        resetGameplayTimer();
      }
    }
  };

  app.stage.on('pointerup', stopDrag);
  app.stage.on('pointerupoutside', stopDrag);

  const blockId = id !== undefined ? id : nextBlockId++;
  if (id !== undefined && id >= nextBlockId) {
    nextBlockId = id + 1;
  }

  const block: Block = { id: blockId, col, row, length, color, sprite };
  blocksContainer.addChild(sprite);
  blocks.push(block);
  return block;
}

function clearAllBlocks() {
  blocks.forEach(b => blocksContainer.removeChild(b.sprite));
  blocks = [];
  nextBlockId = 1; // Reset block ID counter to keep IDs fully deterministic across restores
}

// ---- Physics ----
function applyGravity(checkElim: boolean = true) {
  if (isAnimating) return;
  blocks.sort((a, b) => b.row - a.row);

  // Check if any block will drop or if any row will eliminate
  const simulatedRows: Record<number, number> = {};
  
  blocks.forEach(b => {
    let targetRow = b.row;
    while (targetRow < PARAMS.totalRows - 1) {
      let canDrop = true;
      for (const other of blocks) {
        if (other.id === b.id) continue;
        const otherRow = simulatedRows[other.id] !== undefined ? simulatedRows[other.id] : other.row;
        if (otherRow === targetRow + 1) {
          if (b.col < other.col + other.length && b.col + b.length > other.col) { canDrop = false; break; }
        }
      }
      if (canDrop) targetRow++;
      else break;
    }
    simulatedRows[b.id] = targetRow;
  });

  const simulatedOcc = Array.from({ length: PARAMS.totalRows }, () => Array(PARAMS.gridCols).fill(0));
  blocks.forEach(b => {
    const row = simulatedRows[b.id];
    for (let c = 0; c < b.length; c++) {
      simulatedOcc[row][b.col + c] = 1;
    }
  });

  let willEliminate = false;
  const minVisibleY = -worldContainer.y;
  const maxVisibleY = minVisibleY + PARAMS.viewportRows * PARAMS.cellSize;
  const minRow = Math.max(0, Math.floor(minVisibleY / PARAMS.cellSize));
  const maxRow = Math.min(PARAMS.totalRows - 1, Math.ceil(maxVisibleY / PARAMS.cellSize));

  for (let r = minRow; r <= maxRow; r++) {
    let isFull = true;
    for (let c = 0; c < PARAMS.gridCols; c++) {
      if (simulatedOcc[r][c] === 0) { isFull = false; break; }
    }
    if (isFull) {
      willEliminate = true;
      break;
    }
  }



  let droppedAny = false;
  let hasElim = false;

  const tl = gsap.timeline({
    onComplete: () => {
      if (droppedAny && checkElim) checkEliminations();
      else isAnimating = false;
    }
  });

  blocks.forEach(b => {
    let targetRow = b.row;
    while (targetRow < PARAMS.totalRows - 1) {
      let canDrop = true;
      for (const other of blocks) {
        if (other.id === b.id) continue;
        if (other.row === targetRow + 1) {
           if (b.col < other.col + other.length && b.col + b.length > other.col) { canDrop = false; break; }
        }
      }
      if (canDrop) targetRow++;
      else break;
    }

    if (targetRow !== b.row) {
      droppedAny = true;
      const targetR = targetRow;
      b.row = targetR;
      blocksThatFell.add(b.id);
      tl.to(b.sprite, {
        y: targetR * PARAMS.cellSize,
        duration: PARAMS.gravityDuration,
        ease: 'power2.in',
        onComplete: () => {
          if (isRainbowFixedMode) {
            const newColor = rowColors[targetR];
            if (b.color !== newColor) {
              b.color = newColor;
              const texture = PIXI.Assets.get(`${newColor}-${b.length}`);
              if (texture) b.sprite.texture = texture;
            }
          }
        }
      }, 0);
    }
  });

  hasElim = willEliminate;

  if (droppedAny) {
    isAnimating = true;
    if (!hasElim) {
      const soundDelay = Math.max(0, PARAMS.gravityDuration - 0.15);
      tl.call(() => {
        playSound(sounds.fall);
      }, [], soundDelay);
    }
  }
  else if (checkElim) checkEliminations();
}

function playRowShatterEffect(row: number, color: string) {
  if (shatterTextures.length === 0) return;
  const anim = new PIXI.AnimatedSprite(shatterTextures);
  // 横向居中(0.5)，纵向对齐初始爆炸点(127/1200 ≈ 0.106)
  anim.anchor.set(0.5, 0.106);
  anim.x = (PARAMS.gridCols * PARAMS.cellSize) / 2;
  anim.y = (row + 0.5) * PARAMS.cellSize;
  anim.width = PARAMS.gridCols * PARAMS.cellSize * 1.8;
  anim.height = PARAMS.gridCols * PARAMS.cellSize * 1.8; // Maintain 1:1 square aspect ratio scaled by 1.8
  anim.loop = false;
  anim.animationSpeed = 0.625;

  // 根据填充块的颜色修改色相与饱和度 (按照用户提供的设计参数)
  const colorParams: Record<string, { hue: number; saturate: number }> = {
    pink: { hue: 0, saturate: 0 },
    red: { hue: 41, saturate: 0.4 },
    yellow: { hue: 80, saturate: 0.4 },
    green: { hue: 164, saturate: 0.2 },
    blue: { hue: 252, saturate: 0.2 }
  };
  
  const filter = new PIXI.ColorMatrixFilter();
  const params = colorParams[color] || { hue: 0, saturate: 0 };
  filter.hue(params.hue, false);
  if (params.saturate !== 0) {
    filter.saturate(params.saturate, true);
  }
  anim.filters = [filter];

  worldContainer.addChild(anim);
  anim.play();
  anim.onComplete = () => {
    worldContainer.removeChild(anim);
    anim.destroy();
  };
}

function changeColorsInPairs() {
  const pair = COLOR_PAIRS[colorPairIndex % COLOR_PAIRS.length];
  colorPairIndex++;

  blocks.forEach(b => {
    const newColor = pair[Math.floor(Math.random() * 2)];
    b.color = newColor;
    const texture = PIXI.Assets.get(`${newColor}-${b.length}`);
    if (texture) {
      b.sprite.texture = texture;
    }
  });
}



function checkEliminations() {
  const occ = getGridOccupancy();
  const fullRows: number[] = [];

  // Only check rows visible in the viewport
  const minVisibleY = -worldContainer.y;
  const maxVisibleY = minVisibleY + PARAMS.viewportRows * PARAMS.cellSize;
  const minRow = Math.max(0, Math.floor(minVisibleY / PARAMS.cellSize));
  const maxRow = Math.min(PARAMS.totalRows - 1, Math.ceil(maxVisibleY / PARAMS.cellSize));

  for (let r = minRow; r <= maxRow; r++) {
    let isFull = true;
    for (let c = 0; c < PARAMS.gridCols; c++) { if (occ[r][c] === 0) { isFull = false; break; } }
    if (isFull) fullRows.push(r);
  }

  if (fullRows.length > 0) {
    isAnimating = true;
    hasAnyEliminationThisStep = true;
    comboCount += 1;
    if (isColorChangingMode) {
      changeColorsInPairs();
    }
    if (isMaterialChangingMode) {
      changeMaterialsInOrder();
    }
    playSound(sounds.combos[Math.min(9, comboCount - 1)]);
    
    // 播放人声消除赞美音效
    if (comboCount === 1) playSound(sounds.vocals.good);
    else if (comboCount === 2) playSound(sounds.vocals.great);
    else if (comboCount === 3) playSound(sounds.vocals.amazing);
    else if (comboCount === 4) playSound(sounds.vocals.excellent);
    else if (comboCount >= 5) playSound(sounds.vocals.unbelievable);
    const scoreEl = document.getElementById('score-val');
    if (scoreEl) {
      const current = parseInt(scoreEl.innerText.replace(/,/g, ''));
      const target = current + fullRows.length * 888;
      const counter = { val: current };
      gsap.to(counter, {
        val: target,
        duration: 0.5,
        ease: 'power2.out',
        onUpdate: () => {
          scoreEl.innerText = Math.round(counter.val).toLocaleString();
        }
      });
    }

    const blocksToRemove = blocks.filter(b => fullRows.includes(b.row));
    const centerCol = PARAMS.gridCols / 2;

    const elimDelayInput = document.getElementById('input-script-delay-elim') as HTMLInputElement;
    const customElimDelay = elimDelayInput ? (parseFloat(elimDelayInput.value) || 0.1) : 0.1;

    const tl = gsap.timeline({
      onComplete: () => {
        blocksToRemove.forEach(b => blocksContainer.removeChild(b.sprite));
        blocks = blocks.filter(b => !fullRows.includes(b.row));

        // Shift rowColors on eliminations
        fullRows.sort((a, b) => a - b).forEach(r => {
          for (let y = r; y > 0; y--) {
            rowColors[y] = rowColors[y - 1];
          }
          rowColors[0] = getRainbowFixedColor(0);
        });

        // Clear dragged block state so secondary drops do not trigger color shifts
        draggedBlockId = null;
        draggedBlockColor = null;

        setTimeout(() => {
          isAnimating = false;
          applyGravity(true);
        }, customElimDelay * 1000);
      }
    });

    fullRows.forEach(r => {
      // 确定当前行爆炸特效颜色：优先使用玩家刚刚滑动掉落那个块儿的颜色（如果它在当前行的话）
      const rowBlocks = blocksToRemove.filter(b => b.row === r);
      let explosionColor = 'pink';
      const hasDraggedBlock = rowBlocks.some(b => b.id === draggedBlockId);
      if (hasDraggedBlock && draggedBlockColor) {
        explosionColor = draggedBlockColor;
      } else {
        const fallingBlock = rowBlocks.find(b => blocksThatFell.has(b.id));
        explosionColor = fallingBlock ? fallingBlock.color : (rowBlocks[0] ? rowBlocks[0].color : 'pink');
      }

      tl.call(() => {
        playRowShatterEffect(r, explosionColor);
      }, [], 0);

      const rowBlocksAnim = blocksToRemove.filter(b => b.row === r);
      rowBlocksAnim.sort((a, b) => {
        const distA = Math.abs((a.col + a.length / 2) - centerCol);
        const distB = Math.abs((b.col + b.length / 2) - centerCol);
        return distA - distB;
      });

      const totalStagger = 0.35;
      const staggerAmount = rowBlocksAnim.length > 1 ? totalStagger / (rowBlocksAnim.length - 1) : 0;

      rowBlocksAnim.forEach((b, i) => {
        const delay = i * staggerAmount;
        tl.to(b.sprite.scale, { y: 0, duration: 0.2, ease: 'back.in(2)' }, delay);
        tl.to(b.sprite, { alpha: 0, duration: 0.2 }, delay);
      });
    });

  } else {
    isAnimating = false;
    blocksThatFell.clear(); // 物理循环结束，清空掉落列表
    draggedBlockId = null;
    draggedBlockColor = null;
    if (!hasAnyEliminationThisStep) {
      comboCount = 0;
    }
  }
}

// ---- Generators ----
function generateRandomLayout() {
  clearAllBlocks();
  playSound(sounds.spawn);
  // 变色模式下重置颜色对索引，第一屏统一用第一对颜色（蓝+粉）
  if (isColorChangingMode) colorPairIndex = 0;
  const initialPair = COLOR_PAIRS[0]; // 蓝+粉
  for (let r = PARAMS.totalRows - 1; r >= 0; r--) {
    let c = 0;
    while (c < PARAMS.gridCols) {
      const remaining = PARAMS.gridCols - c;
      if (Math.random() < 0.2) { c++; continue; }
      const len = weightedRandomLength(Math.min(4, remaining));
      if (len > 0) {
        const color = isColorChangingMode
          ? initialPair[Math.floor(Math.random() * 2)]
          : (isRainbowFixedMode ? rowColors[r] : getRandomColor());
        spawnBlock(c, r, len, color);
        c += len;
      } else c++;
    }
  }
  preventFullRows();
}

function isBlockSupported(c: number, len: number, row: number): boolean {
  if (row === PARAMS.totalRows - 1) return true; // bottom row always supported
  for (let i = c; i < c + len; i++) {
    if (!holeMask[row + 1][i]) return true; // at least one solid cell below
  }
  return false;
}

function getValidPartitions(remainingLen: number, c: number, r: number): number[][] {
  if (remainingLen === 0) return [[]];
  const partitions: number[][] = [];
  const maxLen = Math.min(4, remainingLen);
  for (let len = 1; len <= maxLen; len++) {
    if (isBlockSupported(c, len, r)) {
      const subPartitions = getValidPartitions(remainingLen - len, c + len, r);
      for (const sub of subPartitions) {
        partitions.push([len, ...sub]);
      }
    }
  }
  return partitions;
}

function pickPartition(partitions: number[][]): number[] {
  if (partitions.length === 0) return [];
  let totalWeight = 0;
  const weights = partitions.map(p => {
    let sum = 0;
    for (const len of p) sum += PROBS[len as keyof typeof PROBS];
    return sum / p.length;
  });
  
  for (const w of weights) totalWeight += w;
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < partitions.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return partitions[i];
  }
  return partitions[partitions.length - 1];
}

function generateFromHoles() {
  clearAllBlocks();
  playSound(sounds.spawn);
  for (let r = 0; r < PARAMS.totalRows; r++) {
    let c = 0;
    while (c < PARAMS.gridCols) {
      if (holeMask[r][c]) { c++; continue; }

      // Find end of this solid segment
      let endCol = c;
      while (endCol + 1 < PARAMS.gridCols && !holeMask[r][endCol + 1]) endCol++;

      const remaining = endCol - c + 1;
      const validPartitions = getValidPartitions(remaining, c, r);
      
      let chosenPartition: number[];
      if (validPartitions.length > 0) {
        chosenPartition = pickPartition(validPartitions);
      } else {
        // Fallback for floating/unsupported shapes
        chosenPartition = [];
        let rem = remaining;
        while (rem > 0) {
          const l = Math.min(4, rem);
          chosenPartition.push(l);
          rem -= l;
        }
      }

      for (const len of chosenPartition) {
        const color = isRainbowFixedMode ? rowColors[r] : getRandomColor();
        spawnBlock(c, r, len, color);
        c += len;
      }
    }
  }
}

function preventFullRows() {
  const occ = getGridOccupancy();
  for (let r = 0; r < PARAMS.totalRows; r++) {
    let isFull = true;
    for (let c = 0; c < PARAMS.gridCols; c++) { if (occ[r][c] === 0) { isFull = false; break; } }
    if (isFull) {
      const blocksInRow = blocks.filter(b => b.row === r);
      if (blocksInRow.length > 0) {
        const toRemove = blocksInRow[randomInt(0, blocksInRow.length - 1)];
        blocksContainer.removeChild(toRemove.sprite);
        blocks = blocks.filter(b => b.id !== toRemove.id);
      }
    }
  }
}

// ---- Interactions ----
function setupInteraction() {
  app.stage.eventMode = 'static';
  app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

  let isPainting = false;
  let isErasing = false;

  const handlePointerAction = (e: PIXI.FederatedPointerEvent, isDownEvent: boolean) => {
    if (currentMode !== 'draw') return;
    const pos = e.getLocalPosition(worldContainer);
    const col = Math.floor(pos.x / PARAMS.cellSize);
    const row = Math.floor(pos.y / PARAMS.cellSize);

    if (col >= 0 && col < PARAMS.gridCols && row >= 0 && row < PARAMS.totalRows) {
      if (isDownEvent) {
        isErasing = holeMask[row][col];
      }

      if (holeMask[row][col] !== !isErasing) {
        holeMask[row][col] = !isErasing;
        drawHoles();
      }
    }
  };

  app.stage.on('pointerdown', (e) => {
    if (currentMode === 'draw') { isPainting = true; handlePointerAction(e, true); }
    else if (currentMode === 'manual') {
      const pos = e.getLocalPosition(worldContainer);
      const col = Math.floor(pos.x / PARAMS.cellSize);
      const row = Math.floor(pos.y / PARAMS.cellSize);
      if (col >= 0 && col < PARAMS.gridCols && row >= 0 && row < PARAMS.totalRows) {
        const existing = blocks.find(b => b.row === row && col >= b.col && col < b.col + b.length);
        if (existing) {
          playSound(sounds.fall);
          blocksContainer.removeChild(existing.sprite);
          existing.sprite.destroy();
          blocks = blocks.filter(b => b.id !== existing.id);
          updateManualPreview(col, row);
        } else if (manualSelectedBlock) {
          const { length, color } = manualSelectedBlock;
          if (canPlaceBlock(col, row, length)) {
            playSound(sounds.spawn);
            spawnBlock(col, row, length, color);
            updateManualPreview(col, row);
          }
        }
      }
    }
  });
  app.stage.on('pointermove', (e) => {
    if (isPainting) handlePointerAction(e, false);
    if (currentMode === 'manual') {
      const pos = e.getLocalPosition(worldContainer);
      const col = Math.floor(pos.x / PARAMS.cellSize);
      const row = Math.floor(pos.y / PARAMS.cellSize);
      if (col >= 0 && col < PARAMS.gridCols && row >= 0 && row < PARAMS.totalRows) {
        updateManualPreview(col, row);
      } else {
        if (manualPreviewSprite) manualPreviewSprite.visible = false;
      }
    }
  });
  app.stage.on('pointerup', () => isPainting = false);
  app.stage.on('pointerupoutside', () => isPainting = false);

  app.canvas.addEventListener('wheel', (e) => {
    if (isGameStarted) return;
    e.preventDefault();
    worldContainer.y -= e.deltaY * 0.5;

    const minY = -Math.max(0, PARAMS.totalRows - PARAMS.viewportRows) * PARAMS.cellSize;
    worldContainer.y = Math.max(minY, Math.min(0, worldContainer.y));
  }, { passive: false });

  app.canvas.addEventListener('contextmenu', e => e.preventDefault());
}

// ---- UI DOM Bindings ----
function setupDOMUI() {
  const btnRandom = document.getElementById('btn-random')!;
  const btnDraw = document.getElementById('btn-draw')!;
  const btnManual = document.getElementById('btn-manual')!;
  const btnPlay = document.getElementById('btn-play')!;
  const btnRecord = document.getElementById('btn-record')!;
  const btnGenerate = document.getElementById('btn-generate')!;
  const btnCancel = document.getElementById('btn-cancel')!;

  const btnShiftUp = document.getElementById('btn-shift-up')!;
  const btnShiftDown = document.getElementById('btn-shift-down')!;

  btnShiftDown.onclick = () => {
    if (isPlayingScript || isAnimating || blocks.length === 0) return;
    
    const reachedBottom = blocks.some(b => b.row === PARAMS.totalRows - 1);
    if (reachedBottom) {
      alert('底部已有方块，无法整体下移！');
      return;
    }
    
    blocks.forEach(b => {
      b.row += 1;
      b.sprite.y = b.row * PARAMS.cellSize;
    });
    
    initialBoardBlocks.forEach(ib => {
      ib.row += 1;
    });
    
    scriptSteps.forEach(step => {
      if (step.row !== undefined) step.row += 1;
    });
    
    captureBoardState();
    resetAndApplyActiveModeStyle();
    repairScriptSteps();
    updateScriptUI();
  };

  btnShiftUp.onclick = () => {
    if (isPlayingScript || isAnimating || blocks.length === 0) return;
    
    const reachedTop = blocks.some(b => b.row === 0);
    if (reachedTop) {
      alert('顶部已有方块，无法整体上移！');
      return;
    }
    
    blocks.forEach(b => {
      b.row -= 1;
      b.sprite.y = b.row * PARAMS.cellSize;
    });
    
    initialBoardBlocks.forEach(ib => {
      ib.row -= 1;
    });
    
    scriptSteps.forEach(step => {
      if (step.row !== undefined) step.row -= 1;
    });
    
    captureBoardState();
    resetAndApplyActiveModeStyle();
    repairScriptSteps();
    updateScriptUI();
  };

  const bottomMenu = document.getElementById('bottom-menu')!;
  const drawMenu = document.getElementById('draw-menu')!;
  const manualMenu = document.getElementById('manual-menu')!;
  const btnManualClear = document.getElementById('btn-manual-clear')!;
  const btnManualGenerate = document.getElementById('btn-manual-generate')!;
  const btnManualCancel = document.getElementById('btn-manual-cancel')!;
  const manualBlockPalette = document.getElementById('manual-block-palette')!;

  function buildManualBlockPalette() {
    manualBlockPalette.innerHTML = '';
    const colors = ['red', 'blue', 'green', 'yellow', 'pink'];
    const colorGradients: Record<string, string> = {
      red: 'linear-gradient(135deg, #ff4b72, #d9264c)',
      blue: 'linear-gradient(135deg, #4da3ff, #1a75ff)',
      green: 'linear-gradient(135deg, #33cc66, #1f9947)',
      yellow: 'linear-gradient(135deg, #ffdb4d, #e6b800)',
      pink: 'linear-gradient(135deg, #ff66cc, #cc3399)'
    };
    
    colors.forEach(c => {
      const row = document.createElement('div');
      row.className = 'palette-row';
      row.style.justifyContent = 'center'; // Center the row items
      
      [1, 2, 3, 4].forEach(l => {
        const btn = document.createElement('div');
        btn.className = 'palette-block-btn';
        btn.innerText = l.toString();
        btn.style.background = colorGradients[c];
        
        const widths: Record<number, number> = { 1: 18, 2: 32, 3: 46, 4: 60 };
        btn.style.width = `${widths[l]}px`;
        
        btn.onclick = () => {
          document.querySelectorAll('.palette-block-btn').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
          manualSelectedBlock = { length: l, color: c };
          
          if (!manualPreviewSprite) {
            manualPreviewSprite = new PIXI.Sprite();
            blocksContainer.addChild(manualPreviewSprite);
          }
          const texture = PIXI.Assets.get(`${c}-${l}`);
          if (texture) {
            manualPreviewSprite.texture = texture;
            manualPreviewSprite.width = l * PARAMS.cellSize;
            manualPreviewSprite.height = PARAMS.cellSize;
          }
        };
        
        if (c === 'red' && l === 2) {
          btn.classList.add('active');
          manualSelectedBlock = { length: l, color: c };
        }
        
        row.appendChild(btn);
      });
      
      manualBlockPalette.appendChild(row);
    });
  }

  btnManual.onclick = () => {
    currentMode = 'manual';
    manualInitialStateSnapshot = JSON.stringify(blocks.map(b => ({ id: b.id, col: b.col, row: b.row, length: b.length, color: b.color })));
    bottomMenu.classList.add('hidden');
    manualMenu.classList.remove('hidden');
    buildManualBlockPalette();
    
    if (!manualPreviewSprite) {
      manualPreviewSprite = new PIXI.Sprite();
      blocksContainer.addChild(manualPreviewSprite);
    }
    const defaultTex = PIXI.Assets.get('red-2');
    if (defaultTex) {
      manualPreviewSprite.texture = defaultTex;
      manualPreviewSprite.width = 2 * PARAMS.cellSize;
      manualPreviewSprite.height = PARAMS.cellSize;
    }
    manualPreviewSprite.visible = false;
    worldContainer.y = 0;
    document.getElementById('game-over-text')!.style.display = 'none';
  };

  btnManualGenerate.onclick = () => {
    currentMode = 'play';
    manualMenu.classList.add('hidden');
    bottomMenu.classList.remove('hidden');
    if (manualPreviewSprite) {
      blocksContainer.removeChild(manualPreviewSprite);
      manualPreviewSprite.destroy();
      manualPreviewSprite = null;
    }
    captureBoardState();
    resetAndApplyActiveModeStyle();
    repairScriptSteps();
    applyGravity(true);
  };

  btnManualCancel.onclick = () => {
    clearAllBlocks();
    if (manualInitialStateSnapshot) {
      const savedBlocks = JSON.parse(manualInitialStateSnapshot);
      savedBlocks.forEach((sb: any) => {
        spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id);
      });
    }
    currentMode = 'play';
    manualMenu.classList.add('hidden');
    bottomMenu.classList.remove('hidden');
    if (manualPreviewSprite) {
      blocksContainer.removeChild(manualPreviewSprite);
      manualPreviewSprite.destroy();
      manualPreviewSprite = null;
    }
  };

  btnManualClear.onclick = () => {
    clearAllBlocks();
  };

  btnRandom.onclick = () => { comboCount = 0; hasAnyEliminationThisStep = false; generateRandomLayout(); applyGravity(true); captureBoardState(); resetAndApplyActiveModeStyle(); };

  btnDraw.onclick = () => {
    currentMode = 'draw';
    clearAllBlocks();
    bottomMenu.classList.add('hidden');
    drawMenu.classList.remove('hidden');
    drawHoles();
    worldContainer.y = 0;
    document.getElementById('game-over-text')!.style.display = 'none';
  };

  btnGenerate.onclick = () => {
    currentMode = 'play';
    comboCount = 0;
    hasAnyEliminationThisStep = false;
    generateFromHoles();
    drawMenu.classList.add('hidden');
    bottomMenu.classList.remove('hidden');
    holeGraphics.clear();
    document.getElementById('game-over-text')!.style.display = 'none';
    captureBoardState();
    resetAndApplyActiveModeStyle();
  };

  btnCancel.onclick = () => {
    currentMode = 'play';
    drawMenu.classList.add('hidden');
    bottomMenu.classList.remove('hidden');
    holeGraphics.clear();
    document.getElementById('game-over-text')!.style.display = 'none';
  };

  btnPlay.onclick = () => {
    comboCount = 0;
    hasAnyEliminationThisStep = false;
    if (isGameStarted) {
      isGameStarted = false;
      btnPlay.innerHTML = '<span class="icon">▶</span>开始游戏';
      gameTime = 0;
      document.getElementById('time-display')!.innerText = '0.0s';
    } else {
      isGameStarted = true;
      btnPlay.innerHTML = '<span class="icon">⏸</span>暂停游戏';
      document.getElementById('game-over-text')!.style.display = 'none';
      worldContainer.y = 0;
      gameTime = 0;
      document.getElementById('time-display')!.innerText = '0.0s';
    }
  };

  btnRecord.onclick = () => { if (isRecording) stopRecording(); else startRecording(); };

  // Script Editor Panel UI Bindings
  const btnScriptRecord = document.getElementById('btn-script-record')!;
  const btnScriptPlay = document.getElementById('btn-script-play')!;
  const btnScriptPlayScroll = document.getElementById('btn-script-play-scroll')!;
  const btnScriptReset = document.getElementById('btn-script-reset')!;
  const btnScriptClear = document.getElementById('btn-script-clear')!;

  btnScriptRecord.onclick = () => {
    if (isPlayingScript) return;
    if (isRecordingSteps) {
      isRecordingSteps = false;
      btnScriptRecord.innerText = '● 开始录制';
      btnScriptRecord.style.background = '#d93838';
    } else {
      isRecordingSteps = true;
      btnScriptRecord.innerText = '■ 停止录制';
      btnScriptRecord.style.background = '#4a4a5e';
      captureBoardState();
    }
  };

  btnScriptPlay.onclick = () => {
    if (isRecordingSteps) return;
    if (isPlayingScript) {
      isPlayingScript = false;
    } else {
      playScript(false);
    }
  };

  btnScriptPlayScroll.onclick = () => {
    if (isRecordingSteps) return;
    if (isPlayingScript) {
      isPlayingScript = false;
    } else {
      playScript(true);
    }
  };

  btnScriptReset.onclick = () => {
    if (isPlayingScript || isRecordingSteps) return;
    restoreBoardState();
    selectedStepIndex = null;
    highlightStepUI(null);
  };

  btnScriptClear.onclick = () => {
    if (isPlayingScript || isRecordingSteps) return;
    scriptSteps = [];
    selectedStepIndex = null;
    updateScriptUI();
    restoreBoardState();
  };

  const btnNormalMode = document.getElementById('btn-normal-mode')!;
  const btnColorMode = document.getElementById('btn-color-mode')!;
  const btnRainbowMode = document.getElementById('btn-rainbow-mode')!;
  const btnRainbowFixedMode = document.getElementById('btn-rainbow-fixed-mode')!;
  const btnMaterialMode = document.getElementById('btn-material-mode')!;

  btnNormalMode.onclick = async () => {
    if (!isColorChangingMode && !isRainbowMode && !isRainbowFixedMode && !isMaterialChangingMode) return;

    isColorChangingMode = false;
    isRainbowMode = false;
    isRainbowFixedMode = false;
    isMaterialChangingMode = false;

    btnNormalMode.classList.remove('gray');
    btnNormalMode.classList.add('blue');

    btnColorMode.classList.remove('blue');
    btnColorMode.classList.add('gray');

    btnRainbowMode.classList.remove('blue');
    btnRainbowMode.classList.add('gray');

    btnRainbowFixedMode.classList.remove('blue');
    btnRainbowFixedMode.classList.add('gray');

    btnMaterialMode.classList.remove('blue');
    btnMaterialMode.classList.add('gray');

    // 恢复默认材质与颜色
    await restoreDefaultTextures();
    blocks.forEach(b => {
      const newColor = getRandomColor();
      b.color = newColor;
      const texture = PIXI.Assets.get(`${newColor}-${b.length}`);
      if (texture) b.sprite.texture = texture;
    });
  };

  btnColorMode.onclick = async () => {
    if (isColorChangingMode) return;

    isColorChangingMode = true;
    isRainbowMode = false;
    isRainbowFixedMode = false;
    isMaterialChangingMode = false;

    btnNormalMode.classList.remove('blue');
    btnNormalMode.classList.add('gray');

    btnRainbowMode.classList.remove('blue');
    btnRainbowMode.classList.add('gray');

    btnRainbowFixedMode.classList.remove('blue');
    btnRainbowFixedMode.classList.add('gray');

    btnMaterialMode.classList.remove('blue');
    btnMaterialMode.classList.add('gray');

    btnColorMode.classList.remove('gray');
    btnColorMode.classList.add('blue');

    // Make sure we have original texture aliases
    await restoreDefaultTextures();

    // 立刻把当前所有方块变成第一对颜色（蓝+粉），并把索引推进到1
    colorPairIndex = 0;
    const initialPair = COLOR_PAIRS[0];
    blocks.forEach(b => {
      const newColor = initialPair[Math.floor(Math.random() * 2)];
      b.color = newColor;
      const texture = PIXI.Assets.get(`${newColor}-${b.length}`);
      if (texture) b.sprite.texture = texture;
    });
    colorPairIndex = 1; // 下次消除从粉绿开始
  };

  btnRainbowMode.onclick = async () => {
    if (isRainbowMode) return;

    isRainbowMode = true;
    isColorChangingMode = false;
    isRainbowFixedMode = false;
    isMaterialChangingMode = false;

    btnNormalMode.classList.remove('blue');
    btnNormalMode.classList.add('gray');

    btnColorMode.classList.remove('blue');
    btnColorMode.classList.add('gray');

    btnRainbowFixedMode.classList.remove('blue');
    btnRainbowFixedMode.classList.add('gray');

    btnMaterialMode.classList.remove('blue');
    btnMaterialMode.classList.add('gray');

    btnRainbowMode.classList.remove('gray');
    btnRainbowMode.classList.add('blue');

    // Make sure we have original texture aliases
    await restoreDefaultTextures();

    // 立刻按每3行一个颜色给所有方块上色（从最顶部有方块的行开始）
    const minRow = blocks.reduce((m, b) => Math.min(m, b.row), Infinity);
    blocks.forEach(b => {
      const color = RAINBOW_PALETTE[Math.floor((b.row - minRow) / 3) % RAINBOW_PALETTE.length];
      b.color = color;
      const tex = PIXI.Assets.get(`${color}-${b.length}`);
      if (tex) b.sprite.texture = tex;
    });
  };

  btnRainbowFixedMode.onclick = async () => {
    if (isRainbowFixedMode) return;

    isRainbowFixedMode = true;
    isRainbowMode = false;
    isColorChangingMode = false;
    isMaterialChangingMode = false;

    btnNormalMode.classList.remove('blue');
    btnNormalMode.classList.add('gray');

    btnColorMode.classList.remove('blue');
    btnColorMode.classList.add('gray');

    btnRainbowMode.classList.remove('blue');
    btnRainbowMode.classList.add('gray');

    btnMaterialMode.classList.remove('blue');
    btnMaterialMode.classList.add('gray');

    btnRainbowFixedMode.classList.remove('gray');
    btnRainbowFixedMode.classList.add('blue');

    // Make sure we have original texture aliases
    await restoreDefaultTextures();
    resetAndApplyActiveModeStyle();
  };

  btnMaterialMode.onclick = async () => {
    if (isMaterialChangingMode) return;

    isMaterialChangingMode = true;
    isColorChangingMode = false;
    isRainbowMode = false;
    isRainbowFixedMode = false;

    btnNormalMode.classList.remove('blue');
    btnNormalMode.classList.add('gray');

    btnColorMode.classList.remove('blue');
    btnColorMode.classList.add('gray');

    btnRainbowMode.classList.remove('blue');
    btnRainbowMode.classList.add('gray');

    btnRainbowFixedMode.classList.remove('blue');
    btnRainbowFixedMode.classList.add('gray');

    btnMaterialMode.classList.remove('gray');
    btnMaterialMode.classList.add('blue');

    // Make sure all materials are preloaded
    await preloadAllMaterials();

    // Start with the first material pack immediately if available
    activeMaterialIndex = 0;
    changeMaterialsInOrder();
  };

  const btnEnterGameplay = document.getElementById('btn-enter-gameplay')!;
  const btnGameplayRestart = document.getElementById('btn-gameplay-restart')!;
  const btnGameplayExit = document.getElementById('btn-gameplay-exit')!;
  const gameplayMenu = document.getElementById('gameplay-menu')!;

  const editorPanel = document.getElementById('editor-panel')!;
  const materialPanel = document.getElementById('material-panel')!;

  btnEnterGameplay.onclick = () => {
    isGameplayMode = true;
    isGameStarted = true;
    comboCount = 0;
    hasAnyEliminationThisStep = false;
    gameTime = 0;

    // Reset visually
    bottomMenu.classList.add('hidden');
    drawMenu.classList.add('hidden');
    gameplayMenu.classList.remove('hidden');
    editorPanel.style.display = 'none';
    materialPanel.style.display = 'none';

    // Backup and apply standard parameters
    savedParamsBackup = JSON.parse(JSON.stringify(PARAMS));
    PARAMS.viewportRows = 15;
    PARAMS.totalRows = 17;
    PARAMS.scrollSpeed = 0;
    initRowColors();

    app.renderer.resize(PARAMS.gridCols * PARAMS.cellSize, PARAMS.viewportRows * PARAMS.cellSize);
    worldContainer.y = 0;
    drawGrid();
    resetHoleMask();
    document.getElementById('game-over-text')!.style.display = 'none';

    // Generate board
    initGameplayModeBoard();

    // Start timer
    resetGameplayTimer();
  };

  btnGameplayRestart.onclick = () => {
    isGameStarted = true;
    comboCount = 0;
    hasAnyEliminationThisStep = false;
    gameTime = 0;
    document.getElementById('game-over-text')!.style.display = 'none';
    initGameplayModeBoard();
    resetGameplayTimer();
  };

  btnGameplayExit.onclick = () => {
    isGameplayMode = false;
    isGameStarted = false;

    if (gameplayTimer) {
      clearInterval(gameplayTimer);
      gameplayTimer = null;
    }

    // Show editor
    bottomMenu.classList.remove('hidden');
    gameplayMenu.classList.add('hidden');
    editorPanel.style.display = 'block';
    materialPanel.style.display = 'block';

    // Restore params
    if (savedParamsBackup) {
      Object.assign(PARAMS, savedParamsBackup);
      savedParamsBackup = null;
    }
    initRowColors();

    app.renderer.resize(PARAMS.gridCols * PARAMS.cellSize, PARAMS.viewportRows * PARAMS.cellSize);
    worldContainer.y = 0;
    drawGrid();
    resetHoleMask();
    document.getElementById('game-over-text')!.style.display = 'none';
    clearAllBlocks();
  };

  // Settings
  (document.getElementById('input-vprows') as HTMLInputElement).value = PARAMS.viewportRows.toString();
  (document.getElementById('input-rows') as HTMLInputElement).value = PARAMS.totalRows.toString();
  (document.getElementById('input-cols') as HTMLInputElement).value = PARAMS.gridCols.toString();
  (document.getElementById('input-cellsize') as HTMLInputElement).value = PARAMS.cellSize.toString();
  (document.getElementById('input-speed') as HTMLInputElement).value = PARAMS.scrollSpeed.toString();
  const initScriptSpeed = document.getElementById('input-script-scroll-speed') as HTMLInputElement;
  if (initScriptSpeed) initScriptSpeed.value = PARAMS.scrollSpeed.toString();

  // Level input — updates header immediately
  const inputLevel = document.getElementById('input-level') as HTMLInputElement;
  const levelEl = document.getElementById('level-val')!;
  inputLevel.oninput = () => {
    const v = parseInt(inputLevel.value) || 1;
    levelEl.innerText = v.toString();
  };

  // Initial score input — updates header immediately
  const inputScore = document.getElementById('input-score') as HTMLInputElement;
  const scoreDisplayEl = document.getElementById('score-val')!;
  inputScore.oninput = () => {
    const v = parseInt(inputScore.value) || 0;
    scoreDisplayEl.innerText = v.toLocaleString();
  };

  const inputHideText = document.getElementById('input-hidetext') as HTMLInputElement;
  const gameHeader = document.getElementById('game-header')!;
  const updateHeaderVisibility = () => {
    if (inputHideText.checked) {
      gameHeader.style.display = 'none';
    } else {
      gameHeader.style.display = 'flex';
    }
  };
  inputHideText.onchange = updateHeaderVisibility;
  updateHeaderVisibility();

  const handleResize = () => {
    const vp = parseInt((document.getElementById('input-vprows') as HTMLInputElement).value) || PARAMS.viewportRows;
    const tr = parseInt((document.getElementById('input-rows') as HTMLInputElement).value) || PARAMS.totalRows;
    const cols = parseInt((document.getElementById('input-cols') as HTMLInputElement).value) || PARAMS.gridCols;
    const sz = parseInt((document.getElementById('input-cellsize') as HTMLInputElement).value) || PARAMS.cellSize;
    const sp = parseInt((document.getElementById('input-speed') as HTMLInputElement).value) || PARAMS.scrollSpeed;

    let needsResize = false;
    if (cols !== PARAMS.gridCols || vp !== PARAMS.viewportRows || sz !== PARAMS.cellSize || tr !== PARAMS.totalRows) {
      PARAMS.gridCols = cols; PARAMS.viewportRows = vp; PARAMS.cellSize = sz; PARAMS.totalRows = tr;
      needsResize = true;
    }
    PARAMS.scrollSpeed = sp;

    if (needsResize) {
      clearAllBlocks();
      initRowColors();
      app.renderer.resize(PARAMS.gridCols * PARAMS.cellSize, PARAMS.viewportRows * PARAMS.cellSize);
      worldContainer.y = 0;
      drawGrid();
      resetHoleMask();
    }
  };

  document.getElementById('input-vprows')!.oninput = handleResize;
  document.getElementById('input-rows')!.oninput = handleResize;
  document.getElementById('input-cols')!.oninput = handleResize;
  document.getElementById('input-cellsize')!.oninput = handleResize;
  document.getElementById('input-speed')!.oninput = handleResize;

  const scriptSpeedInput = document.getElementById('input-script-scroll-speed') as HTMLInputElement;
  const mainSpeedInput = document.getElementById('input-speed') as HTMLInputElement;
  if (scriptSpeedInput && mainSpeedInput) {
    scriptSpeedInput.oninput = () => {
      const v = parseInt(scriptSpeedInput.value) || 0;
      PARAMS.scrollSpeed = v;
      mainSpeedInput.value = v.toString();
    };
    const originalSpeedOnInput = mainSpeedInput.oninput;
    mainSpeedInput.oninput = (e) => {
      if (originalSpeedOnInput) originalSpeedOnInput.call(mainSpeedInput, e);
      scriptSpeedInput.value = mainSpeedInput.value;
    };
  }

  [1, 2, 3, 4].forEach(i => {
    const input = document.getElementById(`prob-${i}`) as HTMLInputElement;
    const valSpan = document.getElementById(`val-${i}`)!;
    input.oninput = (e) => {
      const v = parseInt((e.target as HTMLInputElement).value);
      PROBS[i as keyof typeof PROBS] = v;
      valSpan.innerText = v.toString();
    };
  });

  // Save / Load functionality
  const btnSave = document.getElementById('btn-save-slot')!;
  const btnLoad = document.getElementById('btn-load-slot')!;
  const btnDelete = document.getElementById('btn-delete-slot')!;
  const slotSelect = document.getElementById('save-slot') as HTMLSelectElement;
  const inputSaveName = document.getElementById('input-save-name') as HTMLInputElement;

  function refreshSaveList() {
    const savedNamesStr = localStorage.getItem('blockPuzzleSaveNames');
    const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    slotSelect.innerHTML = '<option value="">-- 选择已有存档 --</option>';
    savedNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.innerText = name;
      slotSelect.appendChild(opt);
    });
  }
  refreshSaveList();

  btnSave.onclick = () => {
    let name = inputSaveName.value.trim();
    if (!name) name = `排面_${new Date().toLocaleTimeString()}`;
    const saveData = {
      params: PARAMS,
      probs: PROBS,
      holeMask: holeMask
    };
    localStorage.setItem(`blockPuzzleSave_${name}`, JSON.stringify(saveData));

    const savedNamesStr = localStorage.getItem('blockPuzzleSaveNames');
    const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    if (!savedNames.includes(name)) {
      savedNames.push(name);
      localStorage.setItem('blockPuzzleSaveNames', JSON.stringify(savedNames));
    }

    refreshSaveList();
    slotSelect.value = name;
    alert(`已保存排面：${name}`);
  };

  btnLoad.onclick = () => {
    const name = slotSelect.value;
    if (!name) return alert('请先选择一个存档！');
    const dataStr = localStorage.getItem(`blockPuzzleSave_${name}`);
    if (!dataStr) { alert(`找不到存档：${name}`); return; }
    const saveData = JSON.parse(dataStr);

    Object.assign(PARAMS, saveData.params);
    Object.assign(PROBS, saveData.probs);

    holeMask = Array.from({ length: PARAMS.totalRows }, () => Array(PARAMS.gridCols).fill(false));
    const savedMask = saveData.holeMask;
    for (let r = 0; r < Math.min(PARAMS.totalRows, savedMask.length); r++) {
      for (let c = 0; c < Math.min(PARAMS.gridCols, savedMask[r].length); c++) {
        holeMask[r][c] = savedMask[r][c];
      }
    }

    (document.getElementById('input-vprows') as HTMLInputElement).value = PARAMS.viewportRows.toString();
    (document.getElementById('input-rows') as HTMLInputElement).value = PARAMS.totalRows.toString();
    (document.getElementById('input-cols') as HTMLInputElement).value = PARAMS.gridCols.toString();
    (document.getElementById('input-cellsize') as HTMLInputElement).value = PARAMS.cellSize.toString();
    (document.getElementById('input-speed') as HTMLInputElement).value = PARAMS.scrollSpeed.toString();
    const loadScriptSpeed = document.getElementById('input-script-scroll-speed') as HTMLInputElement;
    if (loadScriptSpeed) loadScriptSpeed.value = PARAMS.scrollSpeed.toString();

    [1, 2, 3, 4].forEach(i => {
      const v = PROBS[i as keyof typeof PROBS];
      (document.getElementById(`prob-${i}`) as HTMLInputElement).value = v.toString();
      document.getElementById(`val-${i}`)!.innerText = v.toString();
    });

    clearAllBlocks();
    app.renderer.resize(PARAMS.gridCols * PARAMS.cellSize, PARAMS.viewportRows * PARAMS.cellSize);
    drawGrid();

    currentMode = 'draw';
    bottomMenu.classList.add('hidden');
    drawMenu.classList.remove('hidden');
    drawHoles();
    worldContainer.y = 0;
    alert(`成功读取存档：${name}`);
  };

  btnDelete.onclick = () => {
    const name = slotSelect.value;
    if (!name) return alert('请先选择一个存档！');
    if (!confirm(`确定要删除存档 "${name}" 吗？`)) return;

    localStorage.removeItem(`blockPuzzleSave_${name}`);
    const savedNamesStr = localStorage.getItem('blockPuzzleSaveNames');
    let savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    savedNames = savedNames.filter(n => n !== name);
    localStorage.setItem('blockPuzzleSaveNames', JSON.stringify(savedNames));

    refreshSaveList();
    alert(`已删除存档：${name}`);
  };

  // Export to local file
  const btnExportLayout = document.getElementById('btn-export-layout')!;
  btnExportLayout.onclick = () => {
    const name = slotSelect.value;
    if (!name) return alert('请先选择一个已有存档进行导出！');
    const dataStr = localStorage.getItem(`blockPuzzleSave_${name}`);
    if (!dataStr) return alert('找不到该存档的数据！');

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import from local file
  const btnImportLayout = document.getElementById('btn-import-layout')!;
  btnImportLayout.onclick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target?.result as string);
          if (!importData.params || !importData.probs || !importData.holeMask) {
            return alert('无效的存档文件格式！');
          }

          let importName = file.name.replace(/\.json$/i, '');
          localStorage.setItem(`blockPuzzleSave_${importName}`, JSON.stringify(importData));

          const savedNamesStr = localStorage.getItem('blockPuzzleSaveNames');
          const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
          if (!savedNames.includes(importName)) {
            savedNames.push(importName);
            localStorage.setItem('blockPuzzleSaveNames', JSON.stringify(savedNames));
          }

          refreshSaveList();
          slotSelect.value = importName;
          btnLoad.click();
          alert(`成功从本地文件导入并读取存档：${importName}`);
        } catch (err) {
          console.error(err);
          alert('解析存档文件失败，请检查文件内容！');
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  // Fixed Layout Save / Load functionality
  const btnFixedSave = document.getElementById('btn-fixed-save-slot')!;
  const btnFixedLoad = document.getElementById('btn-fixed-load-slot')!;
  const btnFixedDelete = document.getElementById('btn-fixed-delete-slot')!;
  const fixedSlotSelect = document.getElementById('fixed-save-slot') as HTMLSelectElement;
  const inputFixedSaveName = document.getElementById('input-fixed-save-name') as HTMLInputElement;

  function refreshFixedSaveList() {
    const savedNamesStr = localStorage.getItem('blockPuzzleFixedSaveNames');
    const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    fixedSlotSelect.innerHTML = '<option value="">-- 选择已有存档 --</option>';
    savedNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.innerText = name;
      fixedSlotSelect.appendChild(opt);
    });
  }
  refreshFixedSaveList();

  btnFixedSave.onclick = () => {
    let name = inputFixedSaveName.value.trim();
    if (!name) name = `固定排面_${new Date().toLocaleTimeString()}`;
    
    const savedBlocks = blocks.map(b => ({
      col: b.col,
      row: b.row,
      length: b.length,
      color: b.color
    }));

    const saveData = {
      params: PARAMS,
      blocks: savedBlocks
    };
    localStorage.setItem(`blockPuzzleFixedSave_${name}`, JSON.stringify(saveData));

    const savedNamesStr = localStorage.getItem('blockPuzzleFixedSaveNames');
    const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    if (!savedNames.includes(name)) {
      savedNames.push(name);
      localStorage.setItem('blockPuzzleFixedSaveNames', JSON.stringify(savedNames));
    }

    refreshFixedSaveList();
    fixedSlotSelect.value = name;
    inputFixedSaveName.value = '';
    alert(`已保存固定排面：${name}`);
  };

  btnFixedLoad.onclick = () => {
    const name = fixedSlotSelect.value;
    if (!name) return alert('请先选择一个固定存档！');
    const dataStr = localStorage.getItem(`blockPuzzleFixedSave_${name}`);
    if (!dataStr) { alert(`找不到存档：${name}`); return; }
    const saveData = JSON.parse(dataStr);

    Object.assign(PARAMS, saveData.params);

    // Update input values
    (document.getElementById('input-vprows') as HTMLInputElement).value = PARAMS.viewportRows.toString();
    (document.getElementById('input-rows') as HTMLInputElement).value = PARAMS.totalRows.toString();
    (document.getElementById('input-cols') as HTMLInputElement).value = PARAMS.gridCols.toString();
    (document.getElementById('input-cellsize') as HTMLInputElement).value = PARAMS.cellSize.toString();
    (document.getElementById('input-speed') as HTMLInputElement).value = PARAMS.scrollSpeed.toString();
    const loadFixedScriptSpeed = document.getElementById('input-script-scroll-speed') as HTMLInputElement;
    if (loadFixedScriptSpeed) loadFixedScriptSpeed.value = PARAMS.scrollSpeed.toString();

    clearAllBlocks();
    app.renderer.resize(PARAMS.gridCols * PARAMS.cellSize, PARAMS.viewportRows * PARAMS.cellSize);
    drawGrid();

    // Reset layout mode to play
    currentMode = 'play';
    const bottomMenu = document.getElementById('bottom-menu')!;
    const drawMenu = document.getElementById('draw-menu')!;
    drawMenu.classList.add('hidden');
    bottomMenu.classList.remove('hidden');
    holeGraphics.clear();
    document.getElementById('game-over-text')!.style.display = 'none';

    // Spawn saved blocks
    const savedBlocks = saveData.blocks || [];
    savedBlocks.forEach((sb: any) => {
      spawnBlock(sb.col, sb.row, sb.length, sb.color);
    });

    preventFullRows();
    runPhysicsInstant();
    worldContainer.y = 0;
    captureBoardState();
    resetAndApplyActiveModeStyle();
    
    alert(`成功读取固定排面存档：${name}`);
  };

  btnFixedDelete.onclick = () => {
    const name = fixedSlotSelect.value;
    if (!name) return alert('请先选择一个固定存档！');
    if (!confirm(`确定要删除固定存档 "${name}" 吗？`)) return;

    localStorage.removeItem(`blockPuzzleFixedSave_${name}`);
    const savedNamesStr = localStorage.getItem('blockPuzzleFixedSaveNames');
    let savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    savedNames = savedNames.filter(n => n !== name);
    localStorage.setItem('blockPuzzleFixedSaveNames', JSON.stringify(savedNames));

    refreshFixedSaveList();
    alert(`已删除固定存档：${name}`);
  };

  // Fixed Export to local file
  const btnFixedExportLayout = document.getElementById('btn-fixed-export-layout')!;
  btnFixedExportLayout.onclick = () => {
    const name = fixedSlotSelect.value;
    if (!name) return alert('请先选择一个已有固定存档进行导出！');
    const dataStr = localStorage.getItem(`blockPuzzleFixedSave_${name}`);
    if (!dataStr) return alert('找不到该存档的数据！');

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_fixed.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fixed Import from local file
  const btnFixedImportLayout = document.getElementById('btn-fixed-import-layout')!;
  btnFixedImportLayout.onclick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target?.result as string);
          if (!importData.params || !importData.blocks) {
            return alert('无效的固定排面存档文件格式！');
          }

          let importName = file.name.replace(/\.json$/i, '').replace(/_fixed$/i, '');
          localStorage.setItem(`blockPuzzleFixedSave_${importName}`, JSON.stringify(importData));

          const savedNamesStr = localStorage.getItem('blockPuzzleFixedSaveNames');
          const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
          if (!savedNames.includes(importName)) {
            savedNames.push(importName);
            localStorage.setItem('blockPuzzleFixedSaveNames', JSON.stringify(savedNames));
          }

          refreshFixedSaveList();
          fixedSlotSelect.value = importName;
          btnFixedLoad.click();
          alert(`成功从本地文件导入并读取固定排面：${importName}`);
        } catch (err) {
          console.error(err);
          alert('解析固定排面文件失败，请检查文件内容！');
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  // Demo Script Save / Load functionality
  const btnScriptSave = document.getElementById('btn-script-save')!;
  const btnScriptLoad = document.getElementById('btn-script-load')!;
  const btnScriptDelete = document.getElementById('btn-script-delete')!;
  const scriptSaveSlotSelect = document.getElementById('select-script-save-slot') as HTMLSelectElement;
  const inputScriptSaveName = document.getElementById('input-script-save-name') as HTMLInputElement;

  function refreshScriptSaveList() {
    const savedNamesStr = localStorage.getItem('blockPuzzleDemoScriptNames');
    const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    scriptSaveSlotSelect.innerHTML = '<option value="">-- 选择已有剧本 --</option>';
    savedNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.innerText = name;
      scriptSaveSlotSelect.appendChild(opt);
    });
  }
  refreshScriptSaveList();

  btnScriptSave.onclick = () => {
    let name = inputScriptSaveName.value.trim();
    if (!name) name = `剧本_${new Date().toLocaleTimeString()}`;
    
    const savedBlocks = initialBoardBlocks.length > 0 ? initialBoardBlocks : blocks.map(b => ({
      id: b.id,
      col: b.col,
      row: b.row,
      length: b.length,
      color: b.color
    }));

    const saveData = {
      params: PARAMS,
      initialBlocks: savedBlocks,
      scriptSteps: scriptSteps
    };
    
    localStorage.setItem(`blockPuzzleDemoScript_${name}`, JSON.stringify(saveData));

    const savedNamesStr = localStorage.getItem('blockPuzzleDemoScriptNames');
    const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    if (!savedNames.includes(name)) {
      savedNames.push(name);
      localStorage.setItem('blockPuzzleDemoScriptNames', JSON.stringify(savedNames));
    }

    refreshScriptSaveList();
    scriptSaveSlotSelect.value = name;
    inputScriptSaveName.value = '';
    alert(`成功保存演示剧本：${name}`);
  };

  btnScriptLoad.onclick = () => {
    const name = scriptSaveSlotSelect.value;
    if (!name) return alert('请先选择一个已有剧本！');
    const dataStr = localStorage.getItem(`blockPuzzleDemoScript_${name}`);
    if (!dataStr) { alert(`找不到剧本：${name}`); return; }
    const saveData = JSON.parse(dataStr);

    Object.assign(PARAMS, saveData.params);

    (document.getElementById('input-vprows') as HTMLInputElement).value = PARAMS.viewportRows.toString();
    (document.getElementById('input-rows') as HTMLInputElement).value = PARAMS.totalRows.toString();
    (document.getElementById('input-cols') as HTMLInputElement).value = PARAMS.gridCols.toString();
    (document.getElementById('input-cellsize') as HTMLInputElement).value = PARAMS.cellSize.toString();
    (document.getElementById('input-speed') as HTMLInputElement).value = PARAMS.scrollSpeed.toString();
    const loadScriptSpeed = document.getElementById('input-script-scroll-speed') as HTMLInputElement;
    if (loadScriptSpeed) loadScriptSpeed.value = PARAMS.scrollSpeed.toString();

    clearAllBlocks();
    app.renderer.resize(PARAMS.gridCols * PARAMS.cellSize, PARAMS.viewportRows * PARAMS.cellSize);
    drawGrid();

    initialBoardBlocks = saveData.initialBlocks || [];
    initialBoardBlocks.forEach((sb: any) => {
      spawnBlock(sb.col, sb.row, sb.length, sb.color, sb.id);
    });

    preventFullRows();
    runPhysicsInstant();
    worldContainer.y = 0;
    captureBoardState();
    resetAndApplyActiveModeStyle();

    scriptSteps = saveData.scriptSteps || [];
    selectedStepIndex = null;
    
    repairScriptSteps();
    updateScriptUI();

    alert(`成功读取演示剧本：${name}！已自动还原初始排面并加载步骤列表。`);
  };

  btnScriptDelete.onclick = () => {
    const name = scriptSaveSlotSelect.value;
    if (!name) return alert('请先选择一个已有剧本！');
    if (!confirm(`确定要删除演示剧本 "${name}" 吗？`)) return;

    localStorage.removeItem(`blockPuzzleDemoScript_${name}`);
    const savedNamesStr = localStorage.getItem('blockPuzzleDemoScriptNames');
    let savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
    savedNames = savedNames.filter(n => n !== name);
    localStorage.setItem('blockPuzzleDemoScriptNames', JSON.stringify(savedNames));

    refreshScriptSaveList();
    alert(`已删除演示剧本：${name}`);
  };

  const btnScriptExport = document.getElementById('btn-script-export')!;
  btnScriptExport.onclick = () => {
    const name = scriptSaveSlotSelect.value;
    if (!name) return alert('请先选择一个已选定的剧本进行导出！');
    const dataStr = localStorage.getItem(`blockPuzzleDemoScript_${name}`);
    if (!dataStr) return alert('找不到该剧本的数据！');

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_剧本.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btnScriptImport = document.getElementById('btn-script-import')!;
  btnScriptImport.onclick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target?.result as string);
          if (!importData.params || !importData.initialBlocks || !importData.scriptSteps) {
            return alert('无效的剧本文件格式！');
          }

          let importName = file.name.replace(/_剧本\.json$/i, '').replace(/\.json$/i, '');
          localStorage.setItem(`blockPuzzleDemoScript_${importName}`, JSON.stringify(importData));

          const savedNamesStr = localStorage.getItem('blockPuzzleDemoScriptNames');
          const savedNames: string[] = savedNamesStr ? JSON.parse(savedNamesStr) : [];
          if (!savedNames.includes(importName)) {
            savedNames.push(importName);
            localStorage.setItem('blockPuzzleDemoScriptNames', JSON.stringify(savedNames));
          }

          refreshScriptSaveList();
          scriptSaveSlotSelect.value = importName;
          btnScriptLoad.click();
          alert(`成功从本地文件导入并读取剧本：${importName}`);
        } catch (err) {
          console.error(err);
          alert('解析剧本文件失败，请检查文件内容！');
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  // Add dynamic material pack handler
  const btnAddMaterial = document.getElementById('btn-add-material');
  if (btnAddMaterial) {
    btnAddMaterial.onclick = async () => {
      const name = prompt('请输入新建材质包的名称：');
      if (name === null) return; // User cancelled
      const cleanName = name.trim() || `材质包_${new Date().toLocaleTimeString()}`;
      try {
        await materialDB.addMaterial(cleanName);
        await renderMaterialList();
      } catch (err) {
        console.error(err);
        alert('新建材质包失败！');
      }
    };
  }

  // Image recognition functionality
  const btnImageRec = document.getElementById('btn-image-recognition')!;
  const inputRecFile = document.getElementById('input-recognition-file') as HTMLInputElement;

  btnImageRec.onclick = () => {
    inputRecFile.click();
  };

  function findGridBoundingBox(ctx: CanvasRenderingContext2D, imgW: number, imgH: number) {
    const isBoardPixel = (r: number, g: number, b: number) => {
      // General dark background detection (empty grid cells / lines)
      const brightness = (r + g + b) / 3;
      if (brightness < 65) return true;

      // Check if close to block colors
      const targets = [
        [220, 50, 80],   // red
        [50, 120, 240],  // blue
        [50, 200, 90],   // green
        [240, 200, 50],  // yellow
        [240, 80, 180]   // pink
      ];
      for (const t of targets) {
        const dist = Math.sqrt((r - t[0])**2 + (g - t[1])**2 + (b - t[2])**2);
        if (dist < 100) return true;
      }
      return false;
    };

    const colDensities = new Array(imgW).fill(0);
    const rowDensities = new Array(imgH).fill(0);

    const step = 2;
    const imgData = ctx.getImageData(0, 0, imgW, imgH);
    const data = imgData.data;

    for (let y = 0; y < imgH; y += step) {
      for (let x = 0; x < imgW; x += step) {
        const idx = (y * imgW + x) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        if (isBoardPixel(r, g, b)) {
          colDensities[x]++;
          rowDensities[y]++;
        }
      }
    }

    const maxColVal = imgH / step;
    const colRatio = colDensities.map(v => v / maxColVal);

    let xMin = 0, xMax = imgW - 1;
    let inGridX = false;
    let bestRunX = [0, 0];
    let currentRunX = [0, 0];

    for (let x = 0; x < imgW; x++) {
      let winSum = 0, winCount = 0;
      for (let i = -5; i <= 5; i++) {
        if (x + i >= 0 && x + i < imgW) {
          winSum += colRatio[x + i];
          winCount++;
        }
      }
      const ratio = winSum / winCount;
      if (ratio > 0.4) {
        if (!inGridX) {
          inGridX = true;
          currentRunX = [x, x];
        } else {
          currentRunX[1] = x;
        }
      } else {
        if (inGridX) {
          inGridX = false;
          if (currentRunX[1] - currentRunX[0] > (bestRunX[1] - bestRunX[0])) {
            bestRunX = currentRunX;
          }
        }
      }
    }
    if (inGridX && currentRunX[1] - currentRunX[0] > (bestRunX[1] - bestRunX[0])) {
      bestRunX = currentRunX;
    }

    if (bestRunX[1] - bestRunX[0] > 50) {
      xMin = bestRunX[0];
      xMax = bestRunX[1];
    }

    // Recalculate row ratios inside the detected columns range
    const rowDensitiesPrecise = new Array(imgH).fill(0);
    for (let y = 0; y < imgH; y += step) {
      for (let x = xMin; x <= xMax; x += step) {
        const idx = (y * imgW + x) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        if (isBoardPixel(r, g, b)) {
          rowDensitiesPrecise[y]++;
        }
      }
    }
    const maxRowValPrecise = (xMax - xMin + 1) / step;
    const rowRatioPrecise = rowDensitiesPrecise.map(v => v / maxRowValPrecise);

    let yMin = 0, yMax = imgH - 1;
    let inGridY = false;
    let bestRunY = [0, 0];
    let currentRunY = [0, 0];

    for (let y = 0; y < imgH; y++) {
      let winSum = 0, winCount = 0;
      for (let i = -5; i <= 5; i++) {
        if (y + i >= 0 && y + i < imgH) {
          winSum += rowRatioPrecise[y + i];
          winCount++;
        }
      }
      const ratio = winSum / winCount;
      if (ratio > 0.4) {
        if (!inGridY) {
          inGridY = true;
          currentRunY = [y, y];
        } else {
          currentRunY[1] = y;
        }
      } else {
        if (inGridY) {
          inGridY = false;
          if (currentRunY[1] - currentRunY[0] > (bestRunY[1] - bestRunY[0])) {
            bestRunY = currentRunY;
          }
        }
      }
    }
    if (inGridY && currentRunY[1] - currentRunY[0] > (bestRunY[1] - bestRunY[0])) {
      bestRunY = currentRunY;
    }

    if (bestRunY[1] - bestRunY[0] > 50) {
      yMin = bestRunY[0];
      yMax = bestRunY[1];
    }

    return { x: xMin, y: yMin, width: xMax - xMin + 1, height: yMax - yMin + 1 };
  }

  inputRecFile.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const aspect = img.width / img.height;
      let gridRect = { x: 0, y: 0, width: img.width, height: img.height };

      // If the image aspect ratio matches the standard layout aspect ratio (e.g. portrait screen),
      // bypass detection and use the full image. Otherwise, detect bounding box.
      if (aspect > 0.75 || aspect < 0.45) {
        gridRect = findGridBoundingBox(ctx, img.width, img.height);
        console.log('Detected grid rect for wide/narrow image:', gridRect);
        
        // Fallback if detected area is suspicious
        if (gridRect.width < 100 || gridRect.height < 150) {
          console.warn('Grid auto-detect too small, falling back to full image.');
          gridRect = { x: 0, y: 0, width: img.width, height: img.height };
        }
      } else {
        console.log('Image aspect ratio matches board layout, skipping locator.', aspect);
      }

      const cols = PARAMS.gridCols;
      const rows = PARAMS.viewportRows;
      
      const cellW = gridRect.width / cols;
      const cellH = gridRect.height / rows;

      const targetColors = [
        { name: 'red', rgb: [220, 50, 80] },
        { name: 'blue', rgb: [50, 120, 240] },
        { name: 'green', rgb: [50, 200, 90] },
        { name: 'yellow', rgb: [240, 200, 50] },
        { name: 'pink', rgb: [240, 80, 180] }
      ];

      const detectedGrid: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const startX = Math.floor(gridRect.x + c * cellW + cellW * 0.25);
          const startY = Math.floor(gridRect.y + r * cellH + cellH * 0.25);
          const sampleW = Math.max(1, Math.floor(cellW * 0.5));
          const sampleH = Math.max(1, Math.floor(cellH * 0.5));

          const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
          const data = imgData.data;

          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            sumR += data[i];
            sumG += data[i + 1];
            sumB += data[i + 2];
            count++;
          }
          const avgR = sumR / count;
          const avgG = sumG / count;
          const avgB = sumB / count;

          const brightness = (avgR + avgG + avgB) / 3;
          if (brightness > 90) {
            let minDistance = Infinity;
            let closestColor = 'yellow';
            for (const tc of targetColors) {
              const dist = Math.sqrt(
                Math.pow(avgR - tc.rgb[0], 2) +
                Math.pow(avgG - tc.rgb[1], 2) +
                Math.pow(avgB - tc.rgb[2], 2)
              );
              if (dist < minDistance) {
                minDistance = dist;
                closestColor = tc.name;
              }
            }
            if (minDistance < 150) {
              detectedGrid[r][c] = closestColor;
            }
          }
        }
      }

      clearAllBlocks();

      for (let r = 0; r < PARAMS.totalRows; r++) {
        const sourceRow = r % rows;
        let c = 0;
        while (c < cols) {
          const color = detectedGrid[sourceRow][c];
          if (color) {
            let len = 1;
            while (c + len < cols && detectedGrid[sourceRow][c + len] === color && len < 4) {
              len++;
            }
            // Use randomized playable game colors instead of single monotone color
            const gameColor = getRandomColor();
            spawnBlock(c, r, len, gameColor);
            c += len;
          } else {
            c++;
          }
        }
      }

      preventFullRows();
      runPhysicsInstant();
      
      // Position the viewport at the first screen (首屏) by default
      worldContainer.y = 0;
      
      captureBoardState();
      resetAndApplyActiveModeStyle();

      alert('一键识图完成！已自动定位网格区域并生成排面。');
      inputRecFile.value = '';
    };
  };
}

let recordingCanvas: HTMLCanvasElement | null = null;
let recordingCtx: CanvasRenderingContext2D | null = null;
let recordingRafId = 0;

function startRecording() {
  if (!recordingCanvas) {
    recordingCanvas = document.createElement('canvas');
    recordingCtx = recordingCanvas.getContext('2d', { alpha: true });
  }

  // 隐藏底部的网格
  gridGraphics.visible = false;

  const headerEl = document.getElementById('game-header')!;
  const headerHeight = headerEl.offsetHeight || 50; 
  const pixiCanvas = app.canvas as HTMLCanvasElement;
  const dpr = window.devicePixelRatio || 1;
  
  const isHideText = (document.getElementById('input-hidetext') as HTMLInputElement)?.checked || false;
  const currentOffset = isHideText ? 0 : (headerHeight + 30) * dpr;

  recordingCanvas.width = pixiCanvas.width; 
  recordingCanvas.height = pixiCanvas.height + currentOffset;
  
  const width = recordingCanvas.width;
  const height = recordingCanvas.height;

  const isGreenScreen = (document.getElementById('input-greenscreen') as HTMLInputElement)?.checked || false;

  // 创建双倍宽度的输出画布（用于并排 Alpha 蒙版技术）
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width * 2;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d', { alpha: false })!;
  
  // 临时画布提取 Alpha
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { alpha: true })!;

  const drawFrame = () => {
    if (!isRecording) return;
    
    // 1. 正常绘制带透明通道的画面到 recordingCtx
    if (isGreenScreen) {
      recordingCtx!.fillStyle = '#00ff00';
      recordingCtx!.fillRect(0, 0, width, height);
    } else {
      recordingCtx!.clearRect(0, 0, width, height);
    }
    
    if (!isHideText) {
      // 回退到浏览器支持的最大合法字重 900 (Canvas 会因为 1000 报错而导致整行失效，退回默认细体)
      recordingCtx!.font = `900 ${26 * dpr}px 'Arial Black', 'Impact', sans-serif`;
      recordingCtx!.fillStyle = '#ffffff';
      recordingCtx!.strokeStyle = '#ffffff';
      // 用描边来物理实现字重调整效果
      recordingCtx!.lineWidth = 1.25 * dpr;
      recordingCtx!.textBaseline = 'middle';
      recordingCtx!.shadowBlur = 0; // 关闭阴影防止异常

      if ('letterSpacing' in recordingCtx!) {
          (recordingCtx as any).letterSpacing = `${2 * dpr}px`;
      }
      
      // 纵向拉伸文字
      recordingCtx!.save();
      recordingCtx!.scale(1, 1.3);
      const textY = ((headerHeight / 2) * dpr) / 1.3;

      recordingCtx!.textAlign = 'left';
      const leftText = `LEVEL: ${document.getElementById('level-val')!.innerText}`;
      recordingCtx!.fillText(leftText, 12 * dpr, textY);
      recordingCtx!.strokeText(leftText, 12 * dpr, textY);
      
      recordingCtx!.textAlign = 'right';
      const rightText = `SCORE: ${document.getElementById('score-val')!.innerText}`;
      recordingCtx!.fillText(rightText, width - 12 * dpr, textY);
      recordingCtx!.strokeText(rightText, width - 12 * dpr, textY);
      
      recordingCtx!.restore();
    }

    recordingCtx!.drawImage(pixiCanvas, 0, currentOffset, pixiCanvas.width, pixiCanvas.height);
    
    const gameOverEl = document.getElementById('game-over-text')!;
    if (gameOverEl.style.display !== 'none') {
       recordingCtx!.font = `900 ${48 * dpr}px sans-serif`;
       recordingCtx!.fillStyle = '#ff3366';
       recordingCtx!.textAlign = 'center';
       recordingCtx!.textBaseline = 'middle';
       recordingCtx!.fillText('GAME OVER', width / 2, height / 2);
    }
    
    // 2. 左边：纯黑底色上的 RGB 画面
    outputCtx.fillStyle = '#000000';
    outputCtx.fillRect(0, 0, width, height);
    outputCtx.drawImage(recordingCanvas!, 0, 0);

    // 3. 右边：提取黑白 Alpha 蒙版
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.drawImage(recordingCanvas!, 0, 0);
    // Source-in 将原本画面的彩色全部替换成纯白色，但完美保留了透明度 (Alpha)
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-over';
    
    // 画在黑底上，这样灰度就能完美表示原本的 Alpha 通道
    outputCtx.fillStyle = '#000000';
    outputCtx.fillRect(width, 0, width, height);
    outputCtx.drawImage(tempCanvas, width, 0);
    
    recordingRafId = requestAnimationFrame(drawFrame);
  };
  
  isRecording = true;
  const recordingStartTime = Date.now();
  drawFrame();

  if (!audioSourcesInitialized) {
    initAudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Create double-width stream (for side-by-side alpha mapping)
  const videoStreamMOV = (outputCanvas as any).captureStream(60);
  const videoTrackMOV = videoStreamMOV.getVideoTracks()[0];
  const tracksMOV: MediaStreamTrack[] = [videoTrackMOV];

  if (recAudioDest) {
    const audioTrack = recAudioDest.stream.getAudioTracks()[0];
    if (audioTrack) {
      tracksMOV.push(audioTrack);
    }
  }

  const streamMOV = new MediaStream(tracksMOV);

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

  const options: any = { mimeType, videoBitsPerSecond: 100000000 };

  // Consolidate into a single recorder capturing outputCanvas (double-width side-by-side)
  recorderWebM = new MediaRecorder(streamMOV, options);
  recordedChunksWebM = [];
  recorderWebM.ondataavailable = e => { if (e.data.size > 0) recordedChunksWebM.push(e.data); };
  recorderWebM.onstop = async () => {
    isRecording = false;
    gridGraphics.visible = true; // 录制结束恢复网格
    
    const btnRecord = document.getElementById('btn-record')!;
    btnRecord.innerHTML = '<span class="icon">⏳</span>正在<br>转换';
    
    const webmBlob = new Blob(recordedChunksWebM, { type: 'video/webm' });
    const durationSeconds = (Date.now() - recordingStartTime) / 1000;
    const taskId = Date.now().toString();
    
    try {
        const response = await fetch(`/api/convert?taskId=${taskId}&duration=${durationSeconds}`, {
            method: 'POST',
            body: webmBlob
        });
        
        if (response.ok) {
            const movBlob = await response.blob();
            const url = URL.createObjectURL(movBlob);
            const a = document.createElement('a'); a.href = url; a.download = `combo-material-${Date.now()}.mov`; a.click();
            URL.revokeObjectURL(url);
        } else {
            throw new Error('API return non-ok status');
        }
    } catch (err) {
        console.error('Server conversion failed or unavailable, downloading side-by-side WebM:', err);
        
        const url = URL.createObjectURL(webmBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transparent-source-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    btnRecord.innerHTML = '<span class="icon">⏺</span>开始<br>录制';
  };

  recorderWebM.start();
  document.getElementById('btn-record')!.innerHTML = '<span class="icon">⏹</span>停止<br>录制';
}

function stopRecording() { 
  if (isRecording) {
    if (recorderWebM && recorderWebM.state !== 'inactive') recorderWebM.stop();
    cancelAnimationFrame(recordingRafId);
    gridGraphics.visible = true;
  }
}

init().catch(console.error);
