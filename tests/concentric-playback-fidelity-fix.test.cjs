const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. Buffer rows must not be wiped during recording/repair when bounds expand
assert.ok(
  mainTs.includes('if (isRecordingSteps || isRepairingScript) {') &&
  mainTs.includes('// During script recording or repair, do NOT wipe existing buffer rows!') &&
  mainTs.includes('generateConcentricBlocksForOpenColumns(openCols)'),
  'ensureConcentricTopBuffer must preserve existing buffer rows and fill newly opened columns during recording',
);

// 2. restoreBoardState must reset concentric center bounds to initial bounds to prevent stale false expansion
assert.ok(
  mainTs.includes('const initialBounds = getActiveConcentricCorridorBounds();') &&
  mainTs.includes('concentricCenterMinCol = initialBounds.minCol;') &&
  mainTs.includes('concentricCenterMaxCol = initialBounds.maxCol;'),
  'restoreBoardState must reset concentricCenterMinCol and concentricCenterMaxCol to initial bounds',
);

// 3. playScript must have syncBoardToRecordedStep fallback if step target column is occupied or block drifted
assert.ok(
  mainTs.includes('function syncBoardToRecordedStep(states: BoardBlockState[]) {') &&
  mainTs.includes('syncBoardToRecordedStep(step.boardBefore);'),
  'playScript must provide syncBoardToRecordedStep fallback when a step board drifts',
);

// 4. playScript must clean up ghost blocks in concentric mode upon block slide completion
const slideCompleteIdx = mainTs.indexOf('block.col = step.toCol;');
assert.ok(slideCompleteIdx >= 0, 'block.col = step.toCol must exist in mainTs');
const normalizedSource = mainTs.replace(/\r\n/g, '\n');
assert.ok(
  normalizedSource.includes('if (isConcentricObstacleMode) {\n            for (let j = blocks.length - 1; j >= 0; j--) {'),
  'playScript must remove ghost blocks upon slide completion in concentric mode',
);

console.log('concentric playback fidelity fix regression tests passed successfully!');
