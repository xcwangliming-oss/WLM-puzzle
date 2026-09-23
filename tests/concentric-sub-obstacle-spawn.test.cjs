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

// 1. getActiveConcentricCorridorBounds must evaluate minCol and maxCol across playable rows [minRow, maxRow]
const boundsFunc = bodyOf('getActiveConcentricCorridorBounds', 'getConcentricEliminationRowBounds');
assert.ok(
  boundsFunc.includes('for (let r = minRow; r <= maxRow; r++)') &&
  boundsFunc.includes('!isCellCoveredByProps(activeProps, c, r)'),
  'corridor bounds must check playable rows for open cells so sub-obstacle columns are not prematurely clamped',
);

// 2. stageConcentricSubObstacleBlocksForGravity must exist and detect portal cells directly above open playable rows
const stageFunc = bodyOf('stageConcentricSubObstacleBlocksForGravity', 'syncActiveConcentricCorridorBounds');
assert.ok(
  stageFunc.includes('isCellCoveredByProps(activeProps, c, r)') &&
  stageFunc.includes('isCellCoveredByProps(activeProps, c, r + 1)') &&
  stageFunc.includes('openCellCount > occupiedCount') &&
  stageFunc.includes('concentricEntryFromY = portalRow * PARAMS.cellSize'),
  'stageConcentricSubObstacleBlocksForGravity must stage blocks behind obstacles at portalRow with entry Y',
);

// 3. generateConcentricObstacleBoard must generate blocks across bounds.maxRow to bounds.minRow
const boardGenFunc = bodyOf('generateConcentricObstacleBoard', 'inferConcentricLayer');
assert.ok(
  boardGenFunc.includes('for (let r = bounds.maxRow; r >= bounds.minRow; r--)') &&
  boardGenFunc.includes('getOpenColumnsForRow(activePropsForInitialBoard, totalCols, r)') &&
  boardGenFunc.includes('generateSupportedConcentricRowBlocks'),
  'generateConcentricObstacleBoard must populate the entire playable corridor including sub-obstacle areas',
);

// 4. stageConcentricSubObstacleBlocksForGravity must be called in applyGravity and continueGravityAfterElimination
const gravityFunc = bodyOf('applyGravity', 'playRowShatterEffect');
assert.ok(
  gravityFunc.includes('stageConcentricSubObstacleBlocksForGravity()'),
  'applyGravity must stage sub-obstacle blocks before physics simulation',
);

const continueGravityFunc = bodyOf('continueGravityAfterElimination', 'scriptNeedsPlaybackRepair');
assert.ok(
  continueGravityFunc.includes('stageConcentricSubObstacleBlocksForGravity()'),
  'continueGravityAfterElimination must stage sub-obstacle blocks between elimination waves',
);

console.log('concentric-sub-obstacle-spawn regression tests passed successfully!');
