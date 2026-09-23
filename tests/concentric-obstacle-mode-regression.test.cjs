const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const rulesPath = path.join(root, 'src', 'propRules.ts');
assert.ok(fs.existsSync(rulesPath), 'propRules.ts must exist');

const source = fs.readFileSync(rulesPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const rulesModule = new Module(rulesPath, module);
rulesModule.filename = rulesPath;
rulesModule.paths = Module._nodeModulePaths(path.dirname(rulesPath));
rulesModule._compile(compiled, rulesPath);

const {
  getPropMachineHeadCell,
  getPropOccupiedCells,
  damagePropOneUnit,
  isValidPropLength,
} = rulesModule.exports;

// 1. Machine head positions for all 4 directions
assert.deepEqual(
  getPropMachineHeadCell({ row: 0, col: 0, length: 7, propDir: 'right' }),
  { col: 0, row: 0 },
  'horizontal right bar head must be at col 0, row 0',
);
assert.deepEqual(
  getPropMachineHeadCell({ row: 0, col: 7, length: 9, propDir: 'down' }),
  { col: 7, row: 0 },
  'vertical down bar head must be at top (col 7, row 0)',
);
assert.deepEqual(
  getPropMachineHeadCell({ row: 9, col: 1, length: 7, propDir: 'left' }),
  { col: 7, row: 9 },
  'horizontal left bar head must be at right end (col 7, row 9)',
);
assert.deepEqual(
  getPropMachineHeadCell({ row: 1, col: 0, length: 9, propDir: 'up' }),
  { col: 0, row: 9 },
  'vertical up bar head must be at bottom end (col 0, row 9)',
);

// 2. Occupied cells (candy body vs all cells)
const horizCandyCells = getPropOccupiedCells({ row: 0, col: 0, length: 4, propDir: 'right' });
assert.deepEqual(
  horizCandyCells,
  [{ col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }],
  'horizontal right bar body must exclude head at col 0',
);

const vertCandyCells = getPropOccupiedCells({ row: 1, col: 6, length: 4, propDir: 'down' });
assert.deepEqual(
  vertCandyCells,
  [{ col: 6, row: 2 }, { col: 6, row: 3 }, { col: 6, row: 4 }],
  'vertical down bar body must exclude head at row 1',
);

const vertUpAllCells = getPropOccupiedCells({ row: 2, col: 1, length: 3, propDir: 'up' }, true);
assert.deepEqual(
  vertUpAllCells,
  [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 1, row: 4 }],
  'vertical bar with includeHead must return all spanned cells',
);

// 3. One unit damage shrinking
// Horizontal right (head fixed at col 0, shrinks from right)
const dmgRight = damagePropOneUnit({ row: 0, col: 0, length: 4, propDir: 'right' });
assert.deepEqual(
  dmgRight,
  { triggered: true, col: 0, row: 0, length: 3, destroyed: false },
  'right-facing prop must shrink length without changing col',
);

// Horizontal left (head fixed at col + length - 1, shrinks from left)
const dmgLeft = damagePropOneUnit({ row: 9, col: 1, length: 4, propDir: 'left' });
assert.deepEqual(
  dmgLeft,
  { triggered: true, col: 2, row: 9, length: 3, destroyed: false },
  'left-facing prop must shift col rightward by 1',
);

// Vertical down (head fixed at top row 0, shrinks from bottom)
const dmgDown = damagePropOneUnit({ row: 0, col: 7, length: 4, propDir: 'down' });
assert.deepEqual(
  dmgDown,
  { triggered: true, col: 7, row: 0, length: 3, destroyed: false },
  'down-facing prop must shrink length without changing row',
);

// Vertical up (head fixed at bottom row 9, shrinks from top)
const dmgUp = damagePropOneUnit({ row: 1, col: 0, length: 4, propDir: 'up' });
assert.deepEqual(
  dmgUp,
  { triggered: true, col: 0, row: 2, length: 3, destroyed: false },
  'up-facing prop must shift row downward by 1',
);

// Destruction when length drops to 1
const dmgDestruct = damagePropOneUnit({ row: 0, col: 0, length: 2, propDir: 'right' });
assert.deepEqual(
  dmgDestruct,
  { triggered: true, col: 0, row: 0, length: 0, destroyed: true },
  'prop must be destroyed when reduced below valid length',
);

// 4. Verification of 2 Concentric Layers coverage on 8x12 board (1 row top/bottom per layer, matching left/right)
function verifyConcentricTiling() {
  const grid = Array.from({ length: 12 }, () => Array(8).fill(0));
  
  // Layer 1 (Outer Ring, k=0)
  const layer1 = [
    { row: 0, col: 0, length: 11, propDir: 'down' },
    { row: 11, col: 0, length: 7, propDir: 'right' },
    { row: 1, col: 7, length: 11, propDir: 'up' },
    { row: 0, col: 1, length: 7, propDir: 'left' },
  ];

  // Layer 0 (Inner Ring, k=1)
  const layer0 = [
    { row: 1, col: 1, length: 9, propDir: 'down' },
    { row: 10, col: 1, length: 5, propDir: 'right' },
    { row: 2, col: 6, length: 9, propDir: 'up' },
    { row: 1, col: 2, length: 5, propDir: 'left' },
  ];

  // The 4 corners of Outer Ring must strictly be the 4 machine heads
  assert.deepEqual(getPropMachineHeadCell(layer1[0]), { col: 0, row: 0 }, 'Top-Left corner is Left bar head');
  assert.deepEqual(getPropMachineHeadCell(layer1[1]), { col: 0, row: 11 }, 'Bottom-Left corner is Bottom outer bar head');
  assert.deepEqual(getPropMachineHeadCell(layer1[2]), { col: 7, row: 11 }, 'Bottom-Right corner is Right bar head');
  assert.deepEqual(getPropMachineHeadCell(layer1[3]), { col: 7, row: 0 }, 'Top-Right corner is Top outer bar head');

  for (const prop of [...layer1, ...layer0]) {
    const cells = getPropOccupiedCells(prop, true);
    for (const cell of cells) {
      assert.equal(grid[cell.row][cell.col], 0, `Cell (${cell.row}, ${cell.col}) overlapped!`);
      grid[cell.row][cell.col] = 1;
    }
  }

  // The center must be completely free: cols 2..5, rows 2..9
  for (let r = 2; r <= 9; r++) {
    for (let c = 2; c <= 5; c++) {
      assert.equal(grid[r][c], 0, `Center cell (${r}, ${c}) must be unblocked`);
    }
  }

  // Outer border cells must be occupied by Layer 1:
  for (let c = 0; c < 8; c++) {
    assert.equal(grid[0][c], 1, `Row 0 Col ${c} must be occupied by Layer 1`);
    assert.equal(grid[11][c], 1, `Row 11 Col ${c} must be occupied by Layer 1`);
  }
  for (let r = 0; r < 12; r++) {
    assert.equal(grid[r][0], 1, `Row ${r} Col 0 must be occupied by Layer 1`);
    assert.equal(grid[r][7], 1, `Row ${r} Col 7 must be occupied by Layer 1`);
  }

  // Inner ring border cells must be occupied by Layer 0:
  for (let c = 1; c <= 6; c++) {
    assert.equal(grid[1][c], 1, `Row 1 Col ${c} must be occupied by Layer 0`);
    assert.equal(grid[10][c], 1, `Row 10 Col ${c} must be occupied by Layer 0`);
  }
  for (let r = 1; r <= 10; r++) {
    assert.equal(grid[r][1], 1, `Row ${r} Col 1 must be occupied by Layer 0`);
    assert.equal(grid[r][6], 1, `Row ${r} Col 6 must be occupied by Layer 0`);
  }
}

verifyConcentricTiling();

// 5. Test dynamic multi-layer concentric layout generation
const { generateConcentricLayout, isCellCoveredByProps, getOpenColumnsForRow } = rulesModule.exports;

// 1-layer layout on 10x6 board (1 col on left/right, 1 row on top/bottom)
const layout1 = generateConcentricLayout(10, 6, 1);
assert.equal(layout1.isValid, true, '1-layer layout on 10x6 must be valid');
assert.equal(layout1.layers.length, 1, 'Should have 1 layer');
assert.deepEqual(layout1.centerBounds, { minRow: 1, maxRow: 8, minCol: 1, maxCol: 4, width: 4, height: 8 });

// 3-layer layout on 20x12 board (3 cols on left/right, 3 rows on top/bottom)
const layout3 = generateConcentricLayout(20, 12, 3);
assert.equal(layout3.isValid, true, '3-layer layout on 20x12 must be valid');
assert.equal(layout3.layers.length, 3, 'Should have 3 layers');
assert.deepEqual(layout3.centerBounds, { minRow: 3, maxRow: 16, minCol: 3, maxCol: 8, width: 6, height: 14 });

// Test cell coverage and open columns
const testProps = [
  { row: 0, col: 0, length: 5, propDir: 'right' },
  { row: 0, col: 5, length: 5, propDir: 'down' },
];
assert.equal(isCellCoveredByProps(testProps, 0, 0), true, '(0,0) covered');
assert.equal(isCellCoveredByProps(testProps, 4, 0), true, '(4,0) covered');
assert.equal(isCellCoveredByProps(testProps, 5, 2), true, '(5,2) covered');
assert.equal(isCellCoveredByProps(testProps, 2, 2), false, '(2,2) not covered');

const openColsRow2 = getOpenColumnsForRow(testProps, 8, 2);
assert.equal(openColsRow2.includes(5), false, 'Col 5 is covered by down prop in row 2');
assert.equal(openColsRow2.includes(2), true, 'Col 2 is open in row 2');

// 6. Check index.html and main.ts integration
const indexHtmlPath = path.join(root, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
assert.ok(indexHtml.includes('id="btn-concentric-mode"'), 'index.html must have btn-concentric-mode button');
assert.ok(indexHtml.includes('id="concentric-obstacle-settings-section"'), 'index.html must have concentric settings section');
assert.ok(indexHtml.includes('id="slider-concentric-layers"'), 'index.html must have concentric layers slider');
assert.ok(indexHtml.includes('id="btn-concentric-regenerate"'), 'index.html must have concentric regenerate button');

const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');
assert.ok(mainTs.includes('btn-concentric-mode'), 'main.ts must attach handler to btn-concentric-mode');
assert.ok(mainTs.includes('isConcentricObstacleMode'), 'main.ts must define isConcentricObstacleMode');
assert.ok(mainTs.includes('concentricConfig'), 'main.ts must define concentricConfig');
assert.ok(mainTs.includes('generateSupportedFullBoardRow'), 'main.ts must define the supported initial-row generator');
assert.ok(mainTs.includes('updateConcentricBlockVisibility'), 'main.ts must define updateConcentricBlockVisibility');
assert.ok(mainTs.includes('damageConcentricActiveLayer'), 'main.ts must define damageConcentricActiveLayer');
assert.ok(mainTs.includes('generateConcentricObstacleBoard'), 'main.ts must define generateConcentricObstacleBoard');
assert.ok(mainTs.includes('ensureConcentricTopBuffer'), 'main.ts must define ensureConcentricTopBuffer');
assert.ok(mainTs.includes('targetBufferTop = -30'), 'main.ts must maintain a deep buffer of at least -30 rows');
assert.ok(mainTs.includes('if (isConcentricObstacleMode && other.isProp && other.concentricLayer !== undefined)'), 'applyGravity must bypass concentric props');
assert.ok(mainTs.includes('centralMinRow'), 'ensureConcentricTopBuffer must check centralMinRow so central corridor never runs out of falling blocks');
// 7. Script recording and playback integration for concentric mode
assert.ok(mainTs.includes('initialConcentricLayerIndex'), 'main.ts must persist initialConcentricLayerIndex for playback restore');
assert.ok(mainTs.includes('concentricLayer: b.concentricLayer'), 'captureCurrentBoardBlockStates must capture concentricLayer');
assert.ok(mainTs.includes('concentricLayers.forEach(l => { if (l) l.propIds = []; });'), 'restoreBoardBlockStates must reset concentric layer prop IDs');
assert.ok(mainTs.includes('isConcentricObstacleMode = !!modes.isConcentricObstacleMode'), 'saveData loader must restore isConcentricObstacleMode');

// 8. Concentric obstacle mode fixed mechanics & autoplay immunity
assert.ok(mainTs.includes("if (isConcentricObstacleMode) return 'fixed';"), 'getActiveBoardMechanic and getActiveBoardAdvanceMode must force fixed mechanic');
assert.ok(mainTs.includes("if (isConcentricObstacleMode && (reason === 'continuous-scroll-top' || reason.includes('scroll') || reason.includes('rising')))"), 'triggerGameOver must be immune to scroll/rising collision in concentric mode');
assert.ok(mainTs.includes('if (isConcentricObstacleMode) return;'), 'advanceContinuousScroll must return early in concentric mode');
assert.ok(mainTs.includes('captureBoardState();'), 'generateConcentricObstacleBoard must capture initial board state');
// 9. Concentric obstacle mode instant physics & victory guards
assert.ok(mainTs.includes('damageConcentricActiveLayerInstant'), 'main.ts must define damageConcentricActiveLayerInstant');
assert.ok(mainTs.includes('damageConcentricActiveLayerInstant()'), 'runPhysicsInstant must call damageConcentricActiveLayerInstant without visual animations/timeouts');
assert.ok(mainTs.includes('if (remainingProps.length > 0) return;'), 'triggerConcentricVictory must never trigger if props remain on board');
assert.ok(mainTs.includes('if (isRepairingScript) return;'), 'triggerConcentricVictory must never trigger while repairing script');
assert.ok(mainTs.includes('if (isConcentricObstacleMode) return false;'), 'hasMeaningfulRecordedScrollTrack must return false in concentric mode');
// 10. 2D Block cells & Overlap precision for concentric mode and vertical props
assert.ok(mainTs.includes('getBlockCells'), 'main.ts must define getBlockCells for accurate 2D cell occupation');
assert.ok(mainTs.includes('syncCurrentConcentricLayerFromBlocks'), 'main.ts must define syncCurrentConcentricLayerFromBlocks');
// 11. Visual effect layer order & runaway elimination prevention
assert.ok(mainTs.includes('worldContainer.sortableChildren = true'), 'worldContainer must have sortableChildren enabled');
assert.ok(mainTs.includes('blocksContainer.sortableChildren = true'), 'blocksContainer must have sortableChildren enabled');
assert.ok(mainTs.includes('cellAnim.zIndex = 1000'), 'cell elimination animation must have zIndex = 1000');
assert.ok(mainTs.includes('anim.zIndex = 1000'), 'elimination laser beam and gem shatter must have zIndex = 1000');
// 12. Floating block prevention during gravity & replenishment
assert.ok(mainTs.includes('function stageConcentricReserveRowsForGravity'), 'replenished blocks must be staged through the reserve-row pipeline');
assert.ok(!mainTs.includes('if (isConcentricObstacleMode && !other.isProp && other.sprite && !other.sprite.visible)'), 'gravity must not ignore physical hidden blocks');
// 13. Dynamic corridor expansion & unified multi-cell replenishment from top when obstacles shrink
assert.ok(mainTs.includes('getActiveConcentricCorridorBounds'), 'main.ts must define getActiveConcentricCorridorBounds for dynamic corridor expansion');
assert.ok(mainTs.includes('generateCorridorRowBlocks(minC, maxC)'), 'main.ts must generate unified multi-cell row blocks across expanded corridor bounds');

console.log('concentric obstacle mode regression tests passed');
