const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const mod = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/ballShooterLayout.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(mod.exports);
const { planBallShooterLayout } = mod.exports;
// The user's funnel + winding passage, painted red to mean EMPTY.
const painted = [[0,9],[0,9],[1,8],[2,7],[3,6],[5,5],[5,5],[5,5],[2,5],[2,2],[2,2],[2,5],[5,5],[5,5],[5,5]];
const mask = Array.from({ length: 17 }, (_, row) => Array.from({ length: 10 }, (_, col) => painted[row] && col >= painted[row][0] && col <= painted[row][1]));
let seed = 1;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function checkShape(mask, plan) {
  assert.equal(plan.invalidRow, null);
  const coverage = Array.from({ length: 17 }, () => Array(10).fill(0));
  for (const b of plan.blocks) {
    assert.ok(b.length >= 1 && b.length <= 4 && b.row < 15);
    for (let c = b.col; c < b.col + b.length; c++) coverage[b.row][c]++;
    assert.ok(b.row === 14 || plan.blocks.some(s => s.row === b.row + 1 && b.col < s.col + s.length && s.col < b.col + b.length), 'partitioned brick must have support without moving');
  }
  for (let row = 0; row < 17; row++) for (let col = 0; col < 10; col++) {
    assert.equal(coverage[row][col], row >= 15 || mask[row]?.[col] ? 0 : 1, `painted silhouette changed at ${row},${col}`);
  }
}
for (let i = 0; i < 200; i++) checkShape(mask, planBallShooterLayout(mask, 10, 17, { 1: 20, 2: 40, 3: 30, 4: 10 }, random));
checkShape([], planBallShooterLayout([], 10, 17, { 1: 0, 2: 0, 3: 0, 4: 0 }, random));
const impossible = Array.from({ length: 17 }, () => Array(10).fill(true));
impossible[5][5] = false;
const rejected = planBallShooterLayout(impossible, 10, 17, {}, random);
assert.equal(rejected.invalidRow, 5);
assert.equal(rejected.blocks.length, 0, 'impossible shape must not be replaced with a preset or partially built');
console.log('200 weighted partitions preserve the exact painted funnel/winding passage and support; empty and impossible masks handled');
