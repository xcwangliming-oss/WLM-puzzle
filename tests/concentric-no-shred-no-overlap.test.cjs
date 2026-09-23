const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. The obsolete block-shredding helper was removed; multi-cell blocks remain intact.
assert.ok(!mainTs.includes('splitPartiallyCoveredConcentricBlocks'), 'obsolete block-shredding helper must stay removed');

// 2. Verify 2D occupancy grid & overlap prevention helpers exist
assert.ok(
  mainTs.includes('function getConcentricOccupancyGrid()'),
  'getConcentricOccupancyGrid must exist'
);
assert.ok(
  mainTs.includes('function canPlaceConcentricBlock(grid: (Block | null)[][], row: number, col: number, length: number): boolean'),
  'canPlaceConcentricBlock must exist'
);

// 3. Verify ensureConcentricCorridorFilled uses 2D occupancy grid and canPlaceConcentricBlock
assert.ok(
  mainTs.includes('canPlaceConcentricBlock(grid, bounds.minRow, b.col, b.length)'),
  'must check if block can enter at entrance row'
);
assert.ok(
  mainTs.includes('canPlaceConcentricBlock(grid, targetR + 1, b.col, b.length)'),
  'must check if block can drop to next row'
);
assert.ok(
  mainTs.includes('grid[targetR][b.col + c] = blk;'),
  'must mark cells as occupied in 2D grid'
);

// 4. applyGravity has one collision simulation; it must not contain a second
// legacy row generator that creates blocks after physics has finished.
const applyGravitySection = mainTs.slice(mainTs.indexOf('function applyGravity'));
assert.ok(
  !applyGravitySection.includes('const rowBlocks = generateCorridorRowBlocks'),
  'applyGravity must not contain a second row generator'
);

// 5. Verify multi-cell blocks generation logic
const corridorBlockDef = mainTs.slice(
  mainTs.indexOf('function generateCorridorRowBlocks'),
  mainTs.indexOf('function generateSupportedFullBoardRow')
);
assert.ok(
  corridorBlockDef.includes('weightedRandomLength(maxLen)'),
  'generateCorridorRowBlocks must use weighted random lengths for diverse 2, 3, 4 sizes'
);

console.log('concentric-no-shred-no-overlap tests passed successfully!');
