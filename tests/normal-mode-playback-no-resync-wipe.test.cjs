const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

const playStart = mainTs.indexOf('async function playScript(');
assert.ok(playStart >= 0, 'playScript must exist in main.ts');
const playEnd = mainTs.indexOf('function playScriptFromButton', playStart);
assert.ok(playEnd > playStart, 'playScriptFromButton must follow playScript');
const playBody = mainTs.slice(playStart, playEnd);

// 1. In playScript, syncBoardToRecordedStep at step start must be guarded by isConcentricObstacleMode
const resyncIdx = playBody.indexOf('syncBoardToRecordedStep(step.boardBefore);');
assert.ok(resyncIdx >= 0, 'syncBoardToRecordedStep(step.boardBefore) must exist for concentric mode');
const resyncContext = playBody.slice(Math.max(0, resyncIdx - 400), resyncIdx);
assert.ok(
  resyncContext.includes('if (isConcentricObstacleMode)'),
  'syncBoardToRecordedStep before step move must be strictly scoped to concentric obstacle mode',
);

// 2. In normal mode playback, drifted block col and row must align without wiping the board
assert.ok(
  playBody.includes('if (block && block.col !== step.fromCol) {') &&
  playBody.includes('block.col = step.fromCol;') &&
  playBody.includes('if (block && block.row !== step.row) {') &&
  playBody.includes('block.row = step.row;'),
  'playScript must align block row and column coordinates in normal mode without destructive sync',
);

// 3. In playScript, overlap recovery must only call syncBoardToRecordedStep in concentric obstacle mode
const overlapIdx = playBody.indexOf('if (overlaps.length > 0)');
assert.ok(overlapIdx >= 0, 'overlaps check must exist');
const overlapBody = playBody.slice(overlapIdx, overlapIdx + 600);
assert.ok(
  overlapBody.includes('if (isConcentricObstacleMode && nextStep && nextStep.boardBefore && nextStep.boardBefore.length > 0) {') &&
  overlapBody.includes('syncBoardToRecordedStep(nextStep.boardBefore);'),
  'overlap snapshot recovery must only run in concentric obstacle mode',
);

console.log('normal mode playback no resync wipe regression tests passed successfully!');
