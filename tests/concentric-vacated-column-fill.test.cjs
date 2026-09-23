const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. Ensure fillConcentricVacatedColumns exists and is wired up to prop completion and bounds sync
assert.ok(
  mainTs.includes('function fillConcentricVacatedColumns(): void {'),
  'fillConcentricVacatedColumns must be declared'
);

assert.ok(
  mainTs.includes('fillConcentricVacatedColumns();') &&
  mainTs.includes('ensureConcentricTopBuffer();'),
  'fillConcentricVacatedColumns must be called when bounds expand or props shrink'
);

// 2. Ensure ensureConcentricTopBuffer synchronizes existing buffer rows with newly opened columns
assert.ok(
  mainTs.includes('const missingCols: number[] = [];') &&
  mainTs.includes('if (missingCols.length > 0) {'),
  'ensureConcentricTopBuffer must fill missing opened columns into existing buffer rows'
);

// 3. Ensure fillConcentricVacatedColumns prevents full-row creations (strictly maintains gaps)
assert.ok(
  mainTs.includes('alreadyFilledCount >= openCols.length - 1') &&
  mainTs.includes('continue;'),
  'fillConcentricVacatedColumns must keep at least one gap in every row to prevent instant auto-elimination'
);

// 4. Ensure script playback safety guard exists
assert.ok(
  mainTs.includes('if (!isConcentricObstacleMode || isPlayingScript) return;'),
  'fillConcentricVacatedColumns must exit immediately during script playback'
);

console.log('concentric vacated column fill regression checks passed');
