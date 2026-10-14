const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
const handlers = {};
function visit(node) {
  if (ts.isBinaryExpression(node) && ['btnFixedSave.onclick', 'btnFixedLoad.onclick'].includes(node.left.getText(ast))) {
    handlers[node.left.getText(ast)] = node.right.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(Object.keys(handlers).length, 2);
const store = new Map();
const alerts = [];
const calls = { clear: 0, physics: 0, prevent: 0, cannon: 0, mode: 0 };
let writes = 0;
const menu = { style: {}, classList: { add() {}, remove() {} } };
const sandbox = {
  assetsLoaded: true, currentMode: 'play', blocks: [],
  PARAMS: { gridCols: 10, totalRows: 20, viewportRows: 20, cellSize: 53 },
  isBallShooterMode: false, isConcentricObstacleMode: false, isNoGravityMode: false,
  isFixedBoardMode: true, isFallingMode: false, boardAdvanceMode: 'fixed',
  concentricConfig: {}, concentricLayers: [],
  fixedSlotSelect: { value: 'RMG-11427' }, inputFixedSaveName: { value: 'RMG-11427' },
  alert: message => alerts.push(message),
  console: { error() {} },
  document: { getElementById: () => menu },
  holeGraphics: { clear() {} },
  localStorage: {
    getItem: key => store.get(key) || null,
    setItem: (key, value) => { writes++; store.set(key, value); },
  },
  loadJsonFromStorage: key => store.has(key) ? JSON.parse(store.get(key)) : null,
  readSaveNameList: () => ['RMG-11427'],
  refreshFixedSaveList() {}, syncAllInputsFromParams() {}, syncModeButtonsUI() {},
  normalizeSavedParams: params => params || {}, normalizeBoardMechanic: data => data.boardMechanic || 'fixed',
  setBoardMechanic() {}, applyBoardAdvanceMode() {}, getActiveBoardMechanic: () => 'fixed',
  clearAllBlocks: () => { calls.clear++; sandbox.blocks = []; },
  applyGridConfig() {}, setWorldY() {}, resetAndApplyActiveModeStyle() {},
  captureBoardState() {}, positionPreviewCanvasInMaster() {},
  preventFullRows: () => calls.prevent++, runPhysicsInstant: () => calls.physics++,
  detectFloatingBlocks() {},
  setBallShooterMode: enabled => { calls.mode++; sandbox.isBallShooterMode = enabled; },
  ballShooterSystem: { updateCannonPosition: () => calls.cannon++ },
  spawnRecordedBlockState: state => sandbox.blocks.push({ ...state }),
};
for (const name of ['syncActiveConcentricCorridorBounds', 'ensureConcentricTopBuffer',
  'ensureConcentricCorridorFilled', 'finalizeConcentricPendingEntriesInstant',
  'updateConcentricBlockVisibility', 'updateConcentricPropTextures', 'syncConcentricSettingsUI']) sandbox[name] = () => {};
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(`globalThis.saveFixed = ${handlers['btnFixedSave.onclick']};\nglobalThis.loadFixed = ${handlers['btnFixedLoad.onclick']};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, sandbox);
const key = 'blockPuzzleFixedSave_RMG-11427';
const originalBoard = [{ col: 2, row: 3, length: 2, color: 'blue' }];
store.set(key, JSON.stringify({ params: { gridCols: 11 }, blocks: originalBoard }));
const existingSave = store.get(key);

// Prevent the actual reported failure: empty/drawing/resource-loading saves
// must never overwrite a previously valid named fixed-layout slot.
sandbox.saveFixed();
assert.equal(store.get(key), existingSave);
assert.equal(writes, 0);
assert.match(alerts.at(-1), /没有砖块/);
sandbox.currentMode = 'draw';
sandbox.saveFixed();
assert.match(alerts.at(-1), /完成画面/);
sandbox.currentMode = 'play';
sandbox.assetsLoaded = false;
sandbox.saveFixed();
assert.match(alerts.at(-1), /加载/);
assert.equal(writes, 0);
sandbox.assetsLoaded = true;

// A legacy empty save must be rejected BEFORE clearing the current board or
// changing dimensions; it must not report success or modify the saved bytes.
sandbox.blocks = originalBoard.map(b => ({ ...b }));
const liveBoard = sandbox.blocks;
store.set(key, JSON.stringify({ params: { gridCols: 11 }, blocks: [] }));
const emptyRaw = store.get(key);
const paramsBefore = JSON.stringify(sandbox.PARAMS);
sandbox.loadFixed();
assert.equal(sandbox.blocks, liveBoard);
assert.equal(JSON.stringify(sandbox.PARAMS), paramsBefore);
assert.equal(calls.clear, 0);
assert.equal(store.get(key), emptyRaw);
assert.match(alerts.at(-1), /RMG-11427.*没有砖块数据/);

// Existing non-empty pre-Ball-Shooter fixed saves retain their original path.
store.set(key, existingSave);
sandbox.loadFixed();
assert.equal(JSON.stringify(sandbox.blocks), JSON.stringify(originalBoard));
assert.equal(calls.physics, 1);
assert.equal(calls.prevent, 1);
assert.match(alerts.at(-1), /成功读取固定排面存档：RMG-11427/);

// New Ball Shooter fixed saves preserve mode, numbers and special block state.
sandbox.isBallShooterMode = true;
sandbox.inputFixedSaveName.value = 'RMG-11427';
sandbox.blocks = [{ col: 1, row: 5, length: 2, color: 'blue', isBallShooterBlock: true,
  hitPoints: 173, maxHitPoints: 240, isJewelryBox: false }];
sandbox.saveFixed();
const ballSave = JSON.parse(store.get(key));
assert.equal(ballSave.isBallShooterMode, true);
assert.equal(ballSave.blocks[0].hitPoints, 173);
assert.equal(ballSave.blocks[0].maxHitPoints, 240);
assert.equal(ballSave.blocks[0].isBallShooterBlock, true);
sandbox.isBallShooterMode = false;
sandbox.blocks = [];
const beforePhysics = calls.physics;
sandbox.loadFixed();
assert.equal(sandbox.isBallShooterMode, true, 'new save explicitly restores its mode');
assert.equal(calls.mode, 1);
assert.equal(calls.physics, beforePhysics, 'Ball Shooter fixed loads must not run gravity/elimination');
assert.equal(sandbox.blocks[0].row, 5, 'saved floating position is unchanged');
assert.equal(sandbox.blocks[0].hitPoints, 173);
assert.ok(calls.cannon > 0);

// A playable-export backup with initialBlocks can recover missing live blocks.
store.set(key, JSON.stringify({ params: {}, blocks: [], initialBlocks: originalBoard }));
sandbox.loadFixed();
assert.equal(JSON.stringify(sandbox.blocks), JSON.stringify(originalBoard));

// Concentric fixed boards retain their no-extra-physics load behavior too.
sandbox.isBallShooterMode = false;
store.set(key, JSON.stringify({ params: {}, blocks: originalBoard, isConcentricObstacleMode: true }));
sandbox.loadFixed();
assert.equal(calls.physics, beforePhysics);
assert.equal(JSON.stringify(sandbox.blocks), JSON.stringify(originalBoard));
console.log('Fixed-layout save/load guards protect existing data; non-empty legacy, Ball Shooter HP/mode and concentric loads passed');
