const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
const normalize = ast.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'normalizeBooleanMask');
const start = source.indexOf('let layoutDrawBackupMask: boolean[][]');
const end = source.indexOf('// ---- Board Shape Editor ----', start);
assert.ok(start > 0 && end > start);
const PARAMS = { gridCols: 10, totalRows: 20, viewportRows: 20 };
const planner = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/ballShooterLayout.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(planner.exports);
const menu = { classList: { add() {}, remove() {} } };
const sandbox = {
  PARAMS, assetsLoaded: true, currentMode: 'play', isBallShooterMode: true,
  PROBS: { 1: 20, 2: 40, 3: 30, 4: 10 }, planBallShooterLayout: planner.exports.planBallShooterLayout,
  isFallingMode: false, isNoGravityMode: false, boardAdvanceMode: 'fixed',
  comboCount: 0, hasAnyEliminationThisStep: false,
  blocks: [], layoutDrawMask: [], bottomMenu: menu, drawMenu: menu,
  btnDraw: {}, btnGenerate: {}, btnCancel: {}, holeGraphics: { clear() {} },
  ballShooterSystem: { cancelAim() {}, resetAllBalls() {}, clearAllVisuals() {},
    randomizeHPForBlocks() {}, updateCannonPosition() {} },
  document: { getElementById: () => ({ style: {} }) },
  clearAllBlocks() { sandbox.blocks = []; },
  spawnBlock(col, row, length, color) {
    const b = { col, row, length, color, sprite: {} }; sandbox.blocks.push(b); return b;
  },
  weightedRandomLength: max => Math.min(2, max), getRandomColor: () => 0,
};
for (const name of ['drawGrid', 'drawHoles', 'setWorldY', 'positionPreviewCanvasInMaster',
  'applyBoardAdvanceMode', 'syncModeButtonsUI', 'captureBoardState', 'scrollToBoardBottom',
  'drawBoardShapeBg', 'generateBallShooterBoard', 'generateFromHoles', 'preventFullRows',
  'detectFloatingBlocks', 'settleBallShooterLayout', 'settleLayoutWithoutEliminations', 'resetAndApplyActiveModeStyle']) sandbox[name] = () => {};
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(normalize.getText(ast) + '\n' + source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, sandbox);
sandbox.btnDraw.onclick();
sandbox.layoutDrawMask[0][4] = true;
sandbox.layoutDrawMask[17][5] = true;
sandbox.btnGenerate.onclick();
const completed = JSON.stringify(sandbox.layoutDrawMask);
assert.ok(sandbox.blocks.length > 0);
assert.ok(sandbox.blocks.every(b => b.row < 18), 'bottom two rows remain clear');
assert.ok(!sandbox.blocks.some(b => b.row === 0 && b.col <= 4 && b.col + b.length > 4), 'painted cell is empty');
for (let i = 0; i < 3; i++) {
  sandbox.btnDraw.onclick();
  assert.equal(JSON.stringify(sandbox.layoutDrawMask), completed, 'completed drawing survives re-entry');
  sandbox.btnGenerate.onclick();
}
sandbox.btnDraw.onclick();
sandbox.layoutDrawMask[2][2] = true;
sandbox.btnCancel.onclick();
sandbox.btnDraw.onclick();
assert.equal(JSON.stringify(sandbox.layoutDrawMask), completed, 'cancel must not erase the completed mask');
sandbox.btnGenerate.onclick();
PARAMS.gridCols = 11;
sandbox.btnDraw.onclick();
assert.equal(sandbox.layoutDrawMask[0].length, 11);
assert.equal(sandbox.layoutDrawMask[0][4], true, 'resize preserves overlapping painted cells');
console.log('Layout drawing survives finish/re-entry/cancel and safely normalizes resized boards');
