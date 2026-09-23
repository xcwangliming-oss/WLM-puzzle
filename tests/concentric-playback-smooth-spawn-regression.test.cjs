const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. syncBoardToRecordedStep must not wipe the entire board with clearAllBlocks
const syncStepStart = mainTs.indexOf('function syncBoardToRecordedStep(states: BoardBlockState[]) {');
assert.ok(syncStepStart >= 0, 'syncBoardToRecordedStep must exist');
const syncStepEnd = mainTs.indexOf('\nlet scriptSteps', syncStepStart);
const syncStepBody = mainTs.slice(syncStepStart, syncStepEnd > 0 ? syncStepEnd : syncStepStart + 2000);

assert.ok(
  !syncStepBody.includes('clearAllBlocks()'),
  'syncBoardToRecordedStep must not wipe all blocks with clearAllBlocks to prevent sudden board flashes',
);
assert.ok(
  syncStepBody.includes('areBoardBlockStatesEquivalent') &&
  syncStepBody.includes('currentById') &&
  syncStepBody.includes('blocksContainer.removeChild'),
  'syncBoardToRecordedStep must perform smooth in-place delta reconciliation',
);

// 2. waitForPhysics must ensure all GSAP tweens (blocks & worldContainer) are complete
assert.ok(
  mainTs.includes('function isPhysicsActuallyBusy(): boolean') &&
  mainTs.includes('gsap.isTweening(b.sprite)') &&
  mainTs.includes('gsap.isTweening(worldContainer)'),
  'waitForPhysics must check GSAP tween states on blocks and worldContainer so it does not resolve mid-flight',
);

// 3. getGridOccupancy must ignore concentric buffer blocks and blocks outside corridor bounds
const occStart = mainTs.indexOf('function getGridOccupancy(');
assert.ok(occStart >= 0, 'getGridOccupancy must exist');
const occEnd = mainTs.indexOf('function getHorizontalMoveBounds(', occStart);
const occBody = mainTs.slice(occStart, occEnd > 0 ? occEnd : occStart + 2000);

assert.ok(
  occBody.includes('b.concentricBuffer') &&
  occBody.includes('b.row < concentricBounds.minRow || b.row > concentricBounds.maxRow'),
  'getGridOccupancy must ignore buffer blocks and blocks outside corridor bounds',
);

// 4. ensureConcentricTopBuffer must replenish buffer whenever low without being blocked by isPlayingScript
assert.ok(
  mainTs.includes('} else if (existingRows.size < 35) {'),
  'ensureConcentricTopBuffer must replenish buffer rows whenever below threshold to prevent running out during playback',
);

console.log('concentric playback smooth spawn regression tests passed successfully!');
