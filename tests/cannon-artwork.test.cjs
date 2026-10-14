const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sharp = require('sharp');
const source = fs.readFileSync(path.join(__dirname, '../src/cannonArtwork.ts'), 'utf8');
const mod = { exports: {} };
new Function('exports', ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(mod.exports);
const { REFERENCE_CANNON_ART: art, getReferenceCannonFit } = mod.exports;
const modeSource = fs.readFileSync(path.join(__dirname, '../src/ballShooterMode.ts'), 'utf8');
const modeAst = ts.createSourceFile('mode.ts', modeSource, ts.ScriptTarget.Latest, true);
let positionMethod;
function findPosition(node) {
  if (ts.isMethodDeclaration(node) && node.name.getText(modeAst) === 'updateCannonPosition') positionMethod = node;
  ts.forEachChild(node, findPosition);
}
findPosition(modeAst);
const updatePosition = new Function(ts.transpileModule(`return function () ${positionMethod.body.getText(modeAst)}`, {}).outputText)();

for (const cellSize of [20, 50, 53, 100]) {
  const fit = getReferenceCannonFit(cellSize);
  assert.ok(art.visibleWidth * fit.scale <= cellSize * 1.6 + 1e-9);
  assert.ok(art.visibleHeight * fit.scale <= cellSize * 1.55 + 1e-9);
  const height = 20 * cellSize;
  const pivotY = height - 26 + fit.pivotOffsetY;
  assert.ok(Math.abs(pivotY - (height - (art.bottomY - art.pivotY) * fit.scale)) < 1e-9);
  assert.ok(Math.abs(pivotY - fit.muzzleLength - (height - (art.bottomY - art.muzzleY) * fit.scale)) < 1e-9);
  assert.ok(pivotY - fit.muzzleLength > height - 2 * cellSize, 'muzzle stays in the reserved cannon rows');
  for (const cols of [4, 9, 10, 11, 12, 30]) {
    const dims = { width: cols * cellSize, height, cellSize };
    const positioned = {};
    const cannon = {
      getBoardDimensionsCallback: () => dims,
      container: {},
      cannonContainer: { position: { set: (x, y) => Object.assign(positioned, { x, y }) } },
      fitDefaultCannonArtwork() {},
    };
    updatePosition.call(cannon);
    assert.ok(cannon.container.zIndex > 20 && cannon.container.zIndex < 1000, 'highlights stay above bricks but below shatter effects after resize');
    const x = positioned.x;
    assert.equal(x, dims.width / 2, 'actual cannon positioning keeps the base and launch origin centred');
    assert.equal(cannon.cannonX, x);
    const halfWidth = art.visibleWidth * fit.scale / 2;
    assert.ok(x - halfWidth > 0 && x + halfWidth < cols * cellSize, 'base remains on board after column changes');
  }
}

(async () => {
  for (const filename of ['cannon-reference-v3.png', 'cannon-reference-barrel-v3.png', 'cannon-reference-base-v3.png']) {
    const metadata = await sharp(path.join(__dirname, '../assets/ballshooter', filename)).metadata();
    assert.equal(metadata.width, art.width);
    assert.equal(metadata.height, art.height);
    assert.equal(metadata.hasAlpha, true, 'PNG layer must be transparent');
  }
  console.log('Reference cannon layer registration, size, muzzle and resize checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
