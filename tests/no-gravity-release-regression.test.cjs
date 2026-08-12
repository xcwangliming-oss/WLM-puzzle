const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const rulesPath = path.join(__dirname, '..', 'src', 'noGravityRules.ts');
assert.ok(fs.existsSync(rulesPath), 'shared no-gravity rule module should exist');

const source = fs.readFileSync(rulesPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const moduleShim = { exports: {} };
new Function('module', 'exports', 'require', compiled)(moduleShim, moduleShim.exports, require);

const { releaseNoGravityBlocksInRange, getNoGravityPlaybackMaxRow } = moduleShim.exports;
const blocks = [
  { id: 1, row: 2, noGravity: true },
  { id: 2, row: 22, noGravity: true },
  { id: 3, row: 49, noGravity: true }
];

releaseNoGravityBlocksInRange(blocks, 2, 22);
assert.deepEqual(
  blocks.map(block => block.noGravity),
  [false, false, true],
  'one move must release the active physics range without changing future offscreen rows'
);

assert.equal(
  getNoGravityPlaybackMaxRow('scroll', 36, 44),
  44,
  'scroll playback must keep extending the gravity floor while a recorded combo is still resolving'
);
assert.equal(
  getNoGravityPlaybackMaxRow('fixed', 36, 44),
  36,
  'fixed playback must keep using the boundary captured by the recorded step'
);

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
assert.doesNotMatch(mainSource, /releaseAllNoGravityBlocks\(blocks\)/);
assert.ok(
  (mainSource.match(/releaseNoGravityBlocksInCurrentBoard\(/g) || []).length >= 5,
  'manual movement, repair, jump, and playback should share the bounded release rule'
);
assert.match(
  mainSource,
  /if \(isNoGravityMode\) return getVisibleBottomRowForWorldY\(worldY\);/,
  'no-gravity recording must use the current viewport bottom in every advance mode'
);
assert.match(
  mainSource,
  /function applySimGravity\(simBlocks: SimBlock\[], maxGravityRow: number = PARAMS\.totalRows - 1\)/,
  'auto-generation gravity must accept the current physical bottom row'
);
assert.match(
  mainSource,
  /simulateSimMove\([\s\S]{0,180}?nextBlocks,[\s\S]{0,180}?move\.blockId,[\s\S]{0,180}?move\.toCol,[\s\S]{0,180}?params\.minVisibleRow,[\s\S]{0,180}?getSimGravityMaxRow\(params\.maxVisibleRow\)[\s\S]{0,40}?\)/,
  'auto-generation must simulate each move with the same no-gravity viewport bound'
);
assert.match(
  mainSource,
  /gravityMaxRow: getSimGravityMaxRow\(params\.maxVisibleRow\)/,
  'generated steps must record the physical bottom row used by their simulation'
);
assert.match(
  mainSource,
  /getNoGravityPlaybackMaxRow\([\s\S]{0,180}?scriptPlaybackAdvanceMode,[\s\S]{0,180}?savedMaxRow,[\s\S]{0,180}?getRuntimeGravityMaxRow\(\)/,
  'scroll playback must use its live moving viewport while fixed playback keeps the recorded boundary'
);
assert.doesNotMatch(
  mainSource,
  /function scriptNeedsPlaybackRepair\(\)[\s\S]{0,900}?savedMaxRow\s*[<>]/,
  'a complete recorded step must not be repaired only because its saved physics boundary differs from a derived value'
);
assert.match(
  mainSource,
  /const maxVisibleRow = Math\.min\([\s\S]{0,180}?Number\.isFinite\(maxRowOverride\) \? Math\.floor\(maxRowOverride!\) : visibleMaxRow/,
  'recorded playback must release no-gravity blocks only through its exact saved physics boundary'
);
assert.match(
  mainSource,
  /function resolveNoGravityStates\(maxGravityRow: number = getActivePhysicsMaxRow\(\)\)/,
  'no-gravity propagation must share the active recorded physics boundary'
);
assert.match(
  mainSource,
  /while \(targetRow < maxGravityRow\)/,
  'no-gravity propagation must not simulate falling through future offscreen rows'
);

console.log('no-gravity release regression checks passed');
