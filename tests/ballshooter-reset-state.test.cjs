const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function read(file) { return fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'); }
function functionText(source, name) {
  const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, `${name} exists`);
  return node.getText(ast);
}
const modeSource = read('ballShooterMode.ts');
const modeAst = ts.createSourceFile('mode.ts', modeSource, ts.ScriptTarget.Latest, true);
const modeClass = modeAst.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'BallShooterSystem');
const methods = ['randomizeHPForBlocks', 'clearAllVisuals', 'updateBallsPhysics', 'handleBlockHit'];
const methodText = methods.map(name => modeClass.members.find(n => n.name?.getText(modeAst) === name).getText(modeAst)).join('\n');
const collision = { exports: {} };
vm.runInNewContext(ts.transpileModule(read('ballShooterCollision.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: collision.exports });
class Text {
  constructor(options) {
    Object.assign(this, options);
    this.anchor = { set() {} };
    this.position = { set: (x, y) => { this.x = x; this.y = y; } };
  }
}
function container() {
  return {
    children: [],
    addChild(text) { text.parent = this; this.children.push(text); },
    removeChild(text) { this.children = this.children.filter(t => t !== text); text.parent = null; },
    removeChildren() { for (const child of this.children) child.parent = null; this.children = []; },
  };
}
const mainSource = read('main.ts');
const sandbox = {
  PIXI: { Text }, ...collision.exports,
  blocks: [], initialBoardBlocks: [], initialScrollY: 0, initialScrollRow: 0, worldContainer: { y: 0 },
  isBallShooterMode: true, isConcentricObstacleMode: false, isCollectMode: false,
  multiCollectibleModeEnabled: false, isGameStarted: false,
  PARAMS: { cellSize: 50, gridCols: 10 },
  BALL_SHOOTER_FIXED_LAYOUT: [{ col: 1, row: 2, length: 2, color: 'blue' }],
  document: { getElementById: () => null },
  getScrollRowFromWorldY: y => Math.floor(-y / 50),
  setWorldY: y => { sandbox.worldContainer.y = y; },
  updateHeaderUI() {}, setButtonLabel() {},
  blocksContainer: { removeChild() {} },
  spawnBlock(col, row, length, color, id, noGravity, isCollectible, isProp, propType, propDir, collectibleId, pastureStage, isJewelryBox, jewelryBoxState) {
    const b = { col, row, length, color, id, noGravity, isCollectible, isProp, propType, propDir, collectibleId, pastureStage, isJewelryBox, jewelryBoxState,
      sprite: { x: col * 50, y: row * 50, visible: true, renderable: true } };
    sandbox.blocks.push(b);
    return b;
  },
};
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(`class TestSystem { ${methodText} } globalThis.ballShooterSystem = new TestSystem();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, sandbox);
const system = sandbox.ballShooterSystem;
system.blockTextsContainer = container();
system.blockHighlightsContainer = container();
system.getBlocksCallback = () => sandbox.blocks;
system.getBoardDimensionsCallback = () => ({ width: 500, height: 1000, cellSize: 50 });
system.resetCount = 0;
system.resetAllBalls = () => { system.balls = []; system.resetCount++; };
system.updateCannonPosition = () => {};
system.updateReadyBallCountText = () => {};
system.createSparks = () => {};
system.playImpactSound = () => { system.impactCount = (system.impactCount || 0) + 1; };
system.triggerBlockHighlight = () => { system.highlightCount = (system.highlightCount || 0) + 1; };
sandbox.clearAllBlocks = () => { system.clearAllVisuals(); sandbox.blocks = []; };
const functions = ['captureBoardState', 'captureCurrentBoardBlockStates', 'spawnRecordedBlockState', 'restoreBoardState', 'restoreBoardBlockStates', 'settleBallShooterLayout', 'generateBallShooterBoard'];
vm.runInContext(ts.transpileModule(functions.map(name => functionText(mainSource, name)).join('\n'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, sandbox);

// A generated/drawn starting layout must retain exact HP through repeated
// reset, including a destroyed block, without randomizing numbers or layout.
sandbox.spawnBlock(1, 2, 2, 'blue', 7);
sandbox.spawnBlock(5, 4, 1, 'pink', 8);
for (const [i, b] of sandbox.blocks.entries()) {
  b.isBallShooterBlock = true;
  b.hitPoints = i ? 45 : 240;
  b.maxHitPoints = b.hitPoints;
}
system.randomizeHPForBlocks(sandbox.blocks, true);
sandbox.captureBoardState();
const original = JSON.stringify(sandbox.initialBoardBlocks);
assert.equal(sandbox.initialBoardBlocks[0].hitPoints, 240);
assert.equal(sandbox.captureCurrentBoardBlockStates()[1].hitPoints, 45);
for (let repeat = 0; repeat < 3; repeat++) {
  sandbox.blocks[0].hitPoints = 1;
  sandbox.blocks.pop();
  sandbox.restoreBoardState();
  assert.equal(JSON.stringify(sandbox.initialBoardBlocks), original, 'valid captured HP is never randomized');
  assert.equal(sandbox.blocks.length, 2, 'destroyed starting bricks are restored');
  assert.equal(system.blockTextsContainer.children.length, 2, 'one visible label per restored brick, no duplicates');
  for (const [i, b] of sandbox.blocks.entries()) {
    assert.equal(b.hitPoints, i ? 45 : 240);
    assert.equal(b.maxHitPoints, b.hitPoints);
    assert.equal(b.isBallShooterBlock, true);
    assert.equal(b.hpTextSprite.text, String(b.hitPoints));
    assert.equal(b.hpTextSprite.parent, system.blockTextsContainer);
    assert.equal(b.hpTextSprite.style.dropShadow, false);
    assert.equal(b.sprite.eventMode, 'dynamic');
    assert.equal(b.sprite.cursor, 'grab');
  }
  // Exercise the actual new collision loop AND damage/audio/highlight handler
  // after reset, not merely the presence of metadata or labels.
  system.balls = [{ active: true, returning: false, x: 170, y: 125, vx: -30, vy: 0, radius: 6.5,
    sprite: { position: { set() {} } }, trailGraphics: { clear() {}, poly() {}, fill() {} } }];
  system.updateBallsPhysics(1);
  assert.equal(system.balls[0].vx, 30, 'restored block reflects the ball');
  assert.equal(sandbox.blocks[0].hitPoints, 239, 'restored block takes damage');
  assert.equal(sandbox.blocks[0].hpTextSprite.text, '239');
}
assert.equal(system.impactCount, 3, 'restored collisions play impact audio');
assert.equal(system.highlightCount, 3, 'restored collisions trigger hit effects');

// Generic snapshot restoration uses the same initialization.
const snapshot = sandbox.captureCurrentBoardBlockStates();
sandbox.restoreBoardBlockStates(snapshot);
assert.equal(sandbox.blocks[0].hitPoints, 239);
assert.equal(sandbox.blocks[0].maxHitPoints, 240);
assert.equal(sandbox.blocks[0].hpTextSprite.text, '239');

// Old snapshots with no HP are repaired once and remain stable on re-reset.
sandbox.initialBoardBlocks = [{ col: 1, row: 2, length: 2, color: 'blue' }];
sandbox.restoreBoardState();
const repairedHP = sandbox.blocks[0].hitPoints;
assert.ok(repairedHP > 0);
assert.equal(sandbox.initialBoardBlocks[0].hitPoints, repairedHP);
sandbox.restoreBoardState();
assert.equal(sandbox.blocks[0].hitPoints, repairedHP);

// Dedicated "reset level" captures its newly initialized starting board too.
sandbox.generateBallShooterBoard();
assert.equal(sandbox.initialBoardBlocks[0].hitPoints, sandbox.blocks[0].hitPoints);
assert.equal(sandbox.initialBoardBlocks[0].isBallShooterBlock, true);

// The generic reset stays inert for regular and prop blocks in other modes.
sandbox.isBallShooterMode = false;
const previousEffects = system.highlightCount;
sandbox.initialBoardBlocks = [{ col: 0, row: 1, length: 1, color: 'red' }];
sandbox.restoreBoardState();
assert.equal(sandbox.blocks[0].hpTextSprite, undefined);
assert.equal(sandbox.blocks[0].hitPoints, undefined);
assert.equal(sandbox.blocks[0].isBallShooterBlock, undefined);
assert.equal(system.highlightCount, previousEffects);
sandbox.isBallShooterMode = true;
const prop = sandbox.spawnRecordedBlockState({ col: 0, row: 1, length: 1, color: 'red', isProp: true });
assert.equal(prop.hpTextSprite, undefined);
console.log('Ball Shooter reset preserves layout/HP and restores labels, reflections, damage, audio and effects; legacy and regular-mode guards passed');
