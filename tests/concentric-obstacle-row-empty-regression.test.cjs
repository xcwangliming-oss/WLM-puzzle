const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'main.ts'),
  'utf8',
);

function bodyOf(name, nextName) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} must exist`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start) : source.length;
  return source.slice(start, end < 0 ? source.length : end);
}

// 1. Elimination row bounds must be restricted to active corridor bounds
const elimBounds = bodyOf('getConcentricEliminationRowBounds', 'getConcentricOccupancyGrid');
assert.ok(
  elimBounds.includes('getActiveConcentricCorridorBounds()') &&
  elimBounds.includes('return { minRow: bounds.minRow, maxRow: bounds.maxRow }'),
  'elimination bounds must only cover rows within bounds.minRow and bounds.maxRow',
);

// 2. Occupancy grid must not include normal blocks on obstacle rows
const occGrid = bodyOf('getConcentricOccupancyGrid', 'canPlaceConcentricBlock');
assert.ok(
  occGrid.includes('b.row < bounds.minRow || b.row > bounds.maxRow') &&
  occGrid.includes('b.concentricBuffer'),
  'concentric occupancy grid must ignore normal blocks outside corridor bounds',
);

// 3. Visibility updater must keep normal blocks on or above obstacle rows hidden
const visibility = bodyOf('updateConcentricBlockVisibility', 'getConcentricTopRowsNeedingSupply');
assert.ok(
  visibility.includes('b.row < bounds.minRow') &&
  visibility.includes('b.row = -1'),
  'blocks above corridor bounds must be hidden and reset off-board',
);

// 4. afterGravityComplete must reset any block above corridor bounds back to buffer
const afterGravity = bodyOf('afterGravityComplete', 'applyGravity');
assert.ok(
  afterGravity.includes('b.row < bounds.minRow') &&
  afterGravity.includes('b.row = -1'),
  'afterGravityComplete must reset blocks with row < bounds.minRow back to buffer row -1',
);

// 5. applyGravity must not allow undropped staged blocks to remain at obstacle row
const gravity = bodyOf('applyGravity', 'playRowShatterEffect');
assert.ok(
  gravity.includes('targetR < bounds.minRow') &&
  gravity.includes('b.concentricBuffer = true') &&
  gravity.includes('b.row = -1'),
  'applyGravity must keep undropped staged blocks strictly in buffer without sitting at obstacle row',
);

console.log('concentric obstacle row empty regression tests passed successfully!');
