const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
const mode = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'setBallShooterMode');
const nodes = new Map();
const state = {
  isBallShooterMode: false, boardBeforeBallShooter: null,
  PARAMS: { gridCols: 11, viewportRows: 18, totalRows: 60, cellSize: 50 },
  DEFAULT_BOARD_COLS: 10, previewRenderRows: 18, assetsLoaded: true,
  blocks: [{ col: 2, row: 57, length: 2, color: 'blue' }], worldContainer: { y: -2100 },
  isConcentricObstacleMode: false, isPastureLayerMode: false, isJewelryBoxMode: false,
  isColorChangingMode: false, isSingleColorMode: false, isCustomTwoColorMode: false,
  isRainbowMode: false, isRainbowFixedMode: false, isMaterialChangingMode: false,
  isCollectMode: false, multiCollectibleModeEnabled: false, isNoGravityMode: false,
  document: { getElementById: id => {
    if (!nodes.has(id)) nodes.set(id, { style: {}, classList: { toggle() {} } });
    return nodes.get(id);
  } },
  window: { applyGridConfig() {} },
  cancelBallShooterScoreAnimation() {}, drawGrid() {}, syncModeButtonsUI() {}, syncAllInputsFromParams() {},
  captureBoardState() {},
  captureCurrentBoardBlockStates: () => state.blocks.map(b => ({ ...b })),
  clearAllBlocks: () => { state.blocks = []; },
  spawnRecordedBlockState: b => state.blocks.push({ ...b }),
  setWorldY: y => { state.worldContainer.y = y; },
  generateBallShooterBoard: () => { state.blocks = [{ col: 0, row: 0, isBallShooterBlock: true }]; },
  generateRandomLayout: () => { state.blocks = [{ col: 1, row: 59, length: 1, color: 'red' }]; },
  ballShooterSystem: { setEnabled() {} },
};
vm.createContext(state);
vm.runInContext(ts.transpileModule(mode.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, state);
const before = JSON.stringify({ params: state.PARAMS, blocks: state.blocks, y: state.worldContainer.y });
state.setBallShooterMode(true);
assert.equal(state.PARAMS.viewportRows, 17);
state.setBallShooterMode(true); // Repeated clicks must not replace the original snapshot.
state.setBallShooterMode(false);
assert.equal(JSON.stringify({ params: state.PARAMS, blocks: state.blocks, y: state.worldContainer.y }), before);
state.setBallShooterMode(false); // Other mode buttons also dispatch disable.
assert.equal(JSON.stringify({ params: state.PARAMS, blocks: state.blocks, y: state.worldContainer.y }), before);
state.blocks = [];
state.setBallShooterMode(true);
state.setBallShooterMode(false);
assert.ok(state.blocks.length > 0, 'direct Ball Shooter startup must leave a usable ordinary board on exit');
assert.ok(!state.blocks.some(b => b.isBallShooterBlock));
console.log('Ball Shooter mode round trip restores ordinary dimensions, blocks and scroll; repeated disable cannot clear the board');
