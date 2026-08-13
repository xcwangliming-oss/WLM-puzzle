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
  /const headerIconSize = useRecordingBackground \? 34 : iconRect\.width \* dpr;/,
  'collect mode recording HUD should use deterministic template coordinates in background mode'
);
assert.match(
  source,
  /headerBox\.x \+ headerBox\.w \* 0\.73/,
  'collect mode recording HUD icon should stay in the right side of the master header'
);

console.log('recording collect coordinate regression checks passed');
