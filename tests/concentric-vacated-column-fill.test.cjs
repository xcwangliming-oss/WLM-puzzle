const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. Ensure blocks NEVER pop up out of thin air on the live board
assert.ok(
  !mainTs.includes('function fillConcentricVacatedColumns(): void {'),
  'fillConcentricVacatedColumns must NOT exist; blocks must only drop in via gravity'
);

// 2. Ensure ensureConcentricTopBuffer supports forceRegenerate to recreate buffer across the full unified width
assert.ok(
  mainTs.includes('function ensureConcentricTopBuffer(forceRegenerate = false): void {'),
  'ensureConcentricTopBuffer must accept forceRegenerate parameter'
);

// 3. Ensure syncActiveConcentricCorridorBounds triggers forceRegenerate when bounds expand
assert.ok(
  mainTs.includes('ensureConcentricTopBuffer(true);'),
  'syncActiveConcentricCorridorBounds must trigger forceRegenerate on bounds expansion'
);

// 4. Ensure script playback safety guard exists during buffer regeneration
assert.ok(
  mainTs.includes('if (forceRegenerate && !isPlayingScript && existingRows.size > 0) {'),
  'ensureConcentricTopBuffer must guard forceRegenerate during script playback'
);

console.log('concentric unified buffer regeneration regression checks passed');
