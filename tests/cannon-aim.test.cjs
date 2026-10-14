const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/cannonAim.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('exports', compiled)(mod.exports);
const { getCannonMuzzle } = mod.exports;
for (const angle of [-Math.PI + 0.15, -2.4, -Math.PI / 2, -0.6, -0.15]) {
  const muzzle = getCannonMuzzle(250, 920, angle, 48);
  const dx = muzzle.x - 250, dy = muzzle.y - 920;
  assert.ok(Math.abs(Math.hypot(dx, dy) - 48) < 1e-9);
  assert.ok(Math.abs(Math.atan2(dy, dx) - angle) < 1e-9);
  assert.ok(muzzle.y < 920, 'muzzle stays above its pivot for all allowed aim angles');
}
const straight = getCannonMuzzle(250, 920, -Math.PI / 2, 48);
assert.equal(straight.x, 250);
assert.equal(straight.y, 872);
console.log('Cannon muzzle follows left / upright / right aim angles');
