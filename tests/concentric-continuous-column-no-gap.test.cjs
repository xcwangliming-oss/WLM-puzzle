const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. Ensure ensureConcentricCorridorFilled fills row-by-row bound to targetR < r without plugging lower rows
assert.ok(
  mainTs.includes('targetR < r && canPlaceConcentricBlock(grid, targetR + 1, b.col, b.length)') &&
  mainTs.includes('if (!canPlaceConcentricBlock(grid, bounds.minRow, blk.col, blk.length)) return;'),
  'ensureConcentricCorridorFilled must check entrance occupancy'
);

// 2. Gravity has one collision simulation; it must not contain the removed
// legacy row-by-row spawn pass.
const applyGravitySection = mainTs.slice(mainTs.indexOf('function applyGravity'));
assert.ok(
  !applyGravitySection.includes('generateCorridorRowBlocks'),
  'applyGravity must not spawn a second row wave'
);

// 3. Ensure checkEliminations and simulatedOcc restrict row checks to active corridor bounds
assert.ok(
  mainTs.includes('for (let r = bounds.minRow; r <= bounds.maxRow; r++)'),
  'Elimination detection must be strictly bounded to active corridor bounds to prevent premature obstacle shattering'
);

// 4. Ensure onOnePropCompleted calls ensureConcentricCorridorFilled
const onPropCompletedSection = mainTs.slice(mainTs.indexOf('const onOnePropCompleted = () => {'), mainTs.indexOf('function triggerConcentricVictory'));
assert.ok(
  onPropCompletedSection.includes('ensureConcentricCorridorFilled();'),
  'onOnePropCompleted must refill corridor immediately when obstacle shrinks/opens'
);

console.log('concentric-continuous-column-no-gap tests passed successfully!');
