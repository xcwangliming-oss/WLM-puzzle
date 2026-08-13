const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /function mapBoardWrapperRectToRecordingRect\(/,
  'recording should have a shared mapper from editor board coordinates to recording canvas coordinates'
);
assert.match(
  source,
  /const recordingBoardBox = useRecordingBackground \? getMasterBoardContentRect\(width, height\) : null;/,
  'recorded collectible flight should use the master board box when rendering with a background template'
);
assert.match(
  source,
  /mapBoardWrapperRectToRecordingRect\(flyRect, boardRect, recordingBoardBox\)/,
  'collectible flight overlay should not draw browser DOM coordinates directly into the 720x1280 recording canvas'
);
assert.match(
  source,
  /const RECORDING_COLLECT_ICON_SIZE = 44;/,
  'collect mode recording HUD icon should be large enough for 720x1280 output'
);
assert.match(
  source,
  /function getRecordingCollectIconRect\(width: number, height: number\)/,
  'collect mode recording HUD should use deterministic template coordinates in background mode'
);
assert.match(
  source,
  /const mappedTarget = mapRecordingRectToBoardWrapperRect\(recordingIconBox, boardRect, recordingBoardBox\);/,
  'collectible DOM flight target should be derived from the same template HUD icon position used by recording'
);
assert.match(
  source,
  /targetSize = Math\.max\(36, mappedTarget\.w\);/,
  'collectible DOM flight should end at the recorded HUD icon size instead of shrinking too small'
);
assert.match(
  source,
  /const recordingIconBox = useRecordingBackground \? getRecordingCollectIconRect\(width, height\) : null;/,
  'collect mode recording HUD icon should stay in the right side of the master header'
);

console.log('recording collect coordinate regression checks passed');
