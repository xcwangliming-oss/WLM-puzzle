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
  /const recordingBoardBox = useRecordingBackground \? \{ x: 0, y: 0, w: width, h: height \} : null;/,
  'recorded collectible flight should use the full phone template so header avatar targets map correctly'
);
assert.match(
  source,
  /mapBoardWrapperRectToRecordingRect\(flyRect, boardRect, recordingBoardBox\)/,
  'collectible flight overlay should not draw browser DOM coordinates directly into the 720x1280 recording canvas'
);
assert.match(
  source,
  /const RECORDING_COLLECT_ICON_SIZE = 88;/,
  'collect mode recording HUD icon should be doubled for 720x1280 output'
);
assert.match(
  source,
  /function getRecordingCollectIconRect\(width: number, height: number\)/,
  'collect mode recording HUD should use deterministic template coordinates in background mode'
);
assert.match(
  source,
  /const recordingBoardBox = \{ x: 0, y: 0, w: MASTER_UI\.width, h: MASTER_UI\.height \};[\s\S]*?const mappedTarget = mapRecordingRectToBoardWrapperRect\(recordingIconBox, boardRect, recordingBoardBox\);/,
  'collectible DOM flight fallback target should be derived from the same full-template HUD position used by recording'
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

assert.match(
  source,
  /const boardCanvasBox = getRecordingPixiCanvasRect\(pixiCanvas, boardWrapper \|\| null, width, height\);[\s\S]*?drawRecordingVerticalGrid\(recordingCtx!, boardCanvasBox\);[\s\S]*?boardCanvasBox\.x,[\s\S]*?boardCanvasBox\.y,[\s\S]*?boardCanvasBox\.w,[\s\S]*?boardCanvasBox\.h/,
  'recording should draw the Pixi canvas into the live editor preview rect so blocks are not compressed or enlarged'
);

console.log('recording collect coordinate regression checks passed');
