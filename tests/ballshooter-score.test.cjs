const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const main = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', main, ts.ScriptTarget.Latest, true);
const functions = ['setScoreTextEverywhere', 'awardBallShooterBlockScore', 'cancelBallShooterScoreAnimation'];
const functionText = functions.map(name => ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name).getText(ast)).join('\n');
const counterDeclaration = ast.statements.find(n => ts.isVariableStatement(n)
  && n.declarationList.declarations.some(d => d.name.getText(ast) === 'ballShooterScoreCounter')).getText(ast);
let initCall;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'ballShooterSystem.init') initCall = node;
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(initCall, 'test the actual destruction callback passed to the system');
const destroyText = initCall.arguments[4].getText(ast);
const elements = {
  'score-val': { innerText: '854,682' },
  'heart-score-val': { innerText: '854,682' },
  'input-score': { value: '854682' },
};
const effects = [];
const sounds = [];
// Controlled GSAP clock: verify linear interpolation and retargeting, not just
// the presence of a tween call in source.
let now = 0;
const tweens = new Map();
const gsap = {
  killTweensOf: counter => tweens.delete(counter),
  to(counter, options) {
    assert.equal(options.duration, 0.5);
    assert.equal(options.ease, 'none', 'score rolls at a constant rate');
    tweens.set(counter, { start: counter.value, startedAt: now, options });
  },
};
function advance(ms) {
  now += ms;
  for (const [counter, tween] of [...tweens]) {
    const progress = Math.min(1, (now - tween.startedAt) / 500);
    counter.value = tween.start + (tween.options.value - tween.start) * progress;
    tween.options.onUpdate();
    if (progress === 1) {
      tweens.delete(counter);
      tween.options.onComplete();
    }
  }
}
const sandbox = {
  gsap,
  document: { getElementById: id => elements[id] || null },
  isBallShooterMode: true, blocks: [],
  playRowShatterEffect: (...args) => effects.push(args),
  playSound: sound => sounds.push(sound), ballShooterShatterSound: {},
  blocksContainer: { removeChild() {} },
};
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(`${counterDeclaration}\n${functionText}\nglobalThis.destroy = ${destroyText};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, sandbox);
const mode = fs.readFileSync(path.join(__dirname, '../src/ballShooterMode.ts'), 'utf8');
const modeAst = ts.createSourceFile('mode.ts', mode, ts.ScriptTarget.Latest, true);
const modeClass = modeAst.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'BallShooterSystem');
const hitText = modeClass.members.find(n => n.name?.getText(modeAst) === 'handleBlockHit').getText(modeAst);
vm.runInContext(ts.transpileModule(`class TestSystem { ${hitText} } globalThis.system = new TestSystem();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, sandbox);
const system = sandbox.system;
system.playImpactSound = () => {};
system.triggerBlockHighlight = () => {};
system.createSparks = () => {};
system.onBlockDestroyedCallback = sandbox.destroy;
function brick(hp, maxHP, length = 1) {
  const b = { hitPoints: hp, maxHitPoints: maxHP, length, col: 0, row: 1, color: 'blue', sprite: {} };
  sandbox.blocks.push(b);
  return b;
}
const first = brick(2, 45);
system.handleBlockHit(first, 1, 1);
assert.equal(elements['score-val'].innerText, '854,682', 'non-fatal hits do not score');
assert.equal(effects.length, 0);
system.handleBlockHit(first, 1, 1);
assert.equal(elements['score-val'].innerText, '854,682', 'destruction starts an animation, not an instant jump');
advance(250);
assert.equal(elements['score-val'].innerText, '854,705', 'halfway through 0.5s awards half the points');
advance(250);
assert.equal(elements['score-val'].innerText, '854,727', 'destruction awards the initial HP, not remaining 0 HP');
assert.equal(elements['heart-score-val'].innerText, '854,727', 'both HUD variants update');
assert.equal(elements['input-score'].value, '854682', 'configured reset baseline is preserved');
sandbox.destroy(first);
assert.equal(elements['score-val'].innerText, '854,727', 'repeated destruction callback cannot score twice');
system.handleBlockHit(brick(1, 333, 4), 1, 1);
assert.equal(elements['score-val'].innerText, '854,727');
advance(500);
assert.equal(elements['score-val'].innerText, '855,060', 'simultaneous kills accumulate without counter tween races');
assert.equal(effects.length, 2, 'scoring preserves shatter animation');
assert.equal(sounds.length, 2, 'scoring preserves shatter sound');
assert.equal(sandbox.blocks.length, 0);
sandbox.setScoreTextEverywhere('0');
system.handleBlockHit(brick(1, 60), 1, 1);
advance(125);
assert.equal(elements['score-val'].innerText, '15');
advance(125);
assert.equal(elements['score-val'].innerText, '30');
advance(250);
assert.equal(elements['score-val'].innerText, '60', 'a zero starting score is valid');
system.handleBlockHit(brick(1, undefined, 2), 1, 1);
advance(500);
assert.equal(elements['score-val'].innerText, '260', 'legacy bricks have a positive fallback reward');

// Retargeting during an unfinished count-up preserves its FULL pending reward.
sandbox.setScoreTextEverywhere('0');
system.handleBlockHit(brick(1, 100), 1, 1);
advance(200);
assert.equal(elements['score-val'].innerText, '40');
system.handleBlockHit(brick(1, 200), 1, 1);
assert.equal(tweens.size, 1, 'only one shared counter tween may write the HUD');
assert.equal(elements['score-val'].innerText, '40', 'new kills do not jump the displayed score');
advance(250);
assert.equal(elements['score-val'].innerText, '170', 'remaining points roll at a constant rate');
advance(250);
assert.equal(elements['score-val'].innerText, '300', 'full 100+200 reward, not partially shown 40+200');

// Dense simultaneous kills accumulate all rewards on that one counter.
sandbox.setScoreTextEverywhere('0');
for (let i = 0; i < 50; i++) system.handleBlockHit(brick(1, 25), 1, 1);
assert.equal(tweens.size, 1);
advance(250);
assert.equal(elements['score-val'].innerText, '625');
advance(250);
assert.equal(elements['score-val'].innerText, '1,250');

// Reset/manual edits cancel pending progress, including stale callbacks.
system.handleBlockHit(brick(1, 100), 1, 1);
advance(100);
const staleTween = [...tweens.values()][0];
sandbox.setScoreTextEverywhere('0');
assert.equal(tweens.size, 0);
advance(1000);
staleTween.options.onUpdate();
staleTween.options.onComplete();
assert.equal(elements['score-val'].innerText, '0', 'old animation cannot overwrite a reset or manual score');
const clearAllBlocks = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'clearAllBlocks').getText(ast);
const setMode = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'setBallShooterMode').getText(ast);
assert.match(clearAllBlocks, /cancelBallShooterScoreAnimation\(\);/, 'reset/rebuild cancels animation before removing blocks');
assert.match(setMode, /cancelBallShooterScoreAnimation\(\);/, 'leaving Ball Shooter cancels its animation');
sandbox.isBallShooterMode = false;
sandbox.destroy(brick(0, 120));
assert.equal(elements['score-val'].innerText, '0', 'other modes do not use the ball scoring callback');
assert.match(main, /const rightText = `SCORE: \$\{document\.getElementById\('score-val'\)!\.innerText\}`/, 'recording reads the updated live score');
console.log('Ball Shooter 0.5s linear score roll, pending rewards, dense kills, HUD/recording and reset/manual/mode cancellation passed');
