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

// 1. ensureConcentricTopBuffer maintains FIFO buffer queue and pushes to initialBoardBlocks during recording
const bufferFn = bodyOf('ensureConcentricTopBuffer', 'getActiveConcentricCorridorBounds');
assert.ok(
  bufferFn.includes('targetBufferDepth = 50') &&
  bufferFn.includes('existingRows.size === 0') &&
  bufferFn.includes('minExistingRow - i') &&
  bufferFn.includes('!isPlayingScript'),
  'ensureConcentricTopBuffer must maintain a deep buffer and append only at the deep end',
);
assert.ok(
  bufferFn.includes('if (isRecordingSteps)') &&
  bufferFn.includes('initialBoardBlocks.push('),
  'dynamically created buffer rows during recording must be added to initialBoardBlocks for playback fidelity',
);

// 2. getConcentricMissingTopRowCount must align with getConcentricTopRowsNeedingSupply
const missingFn = bodyOf('getConcentricMissingTopRowCount', 'updateConcentricFallingVisibility');
assert.ok(
  missingFn.includes('return getConcentricTopRowsNeedingSupply()'),
  'getConcentricMissingTopRowCount must delegate to getConcentricTopRowsNeedingSupply',
);

// 3. playScript must initialize draggedBlockId and blocksThatFell before resolving playback rows
const playScriptStart = source.indexOf('async function playScript(');
assert.ok(playScriptStart >= 0, 'playScript must exist');
const playScriptEnd = source.indexOf('function playScriptFromButton', playScriptStart);
const playScriptBody = source.slice(playScriptStart, playScriptEnd);

const draggedIdx = playScriptBody.indexOf('draggedBlockId = block.id;');
const blocksFellIdx = playScriptBody.indexOf('blocksThatFell.add(block.id);');
const immIdx = playScriptBody.indexOf('const immediatePlaybackRows = getImmediatePlayableFullRows();');

assert.ok(draggedIdx >= 0, 'playScript must assign draggedBlockId');
assert.ok(blocksFellIdx >= 0, 'playScript must add block to blocksThatFell');
assert.ok(immIdx >= 0, 'playScript must query immediatePlaybackRows');
assert.ok(
  draggedIdx < immIdx && blocksFellIdx < immIdx,
  'draggedBlockId and blocksThatFell must be initialized before immediatePlaybackRows check',
);

// 4. getPlaybackFullRowsFromOccupancy must allow visible full rows in concentric mode when allowed is empty
const playbackOccFn = bodyOf('getPlaybackFullRowsFromOccupancy', 'getImmediatePlayableFullRows');
assert.ok(
  playbackOccFn.includes('if (isConcentricObstacleMode)') &&
  playbackOccFn.includes('if (visibleFullRows.length > 0) return visibleFullRows;'),
  'getPlaybackFullRowsFromOccupancy must clear visible full rows in concentric mode even when allowed is empty',
);

console.log('concentric script playback consistency regression tests passed successfully!');
