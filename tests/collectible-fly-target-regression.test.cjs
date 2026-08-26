const fs = require('fs');
const path = require('path');
const assert = require('assert');

const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
const body = fs.readFileSync(mainPath, 'utf8');

const fnMatch = body.match(/function playCollectibleFlyAnimation\(b: Block\) \{[\s\S]*?\n\}/);
assert(fnMatch, 'playCollectibleFlyAnimation should exist');
const fn = fnMatch[0];

assert.match(
  fn,
  /if \(targetEl\) \{[\s\S]*?targetEl\.getBoundingClientRect\(\)[\s\S]*?\} else if \(isRecordingBackgroundActive\(\)\)/,
  'live collect animation should fly to the actual header icon before falling back to recording-coordinate mapping'
);

assert.match(
  fn,
  /\(cellCanvasY \+ PADDING\) \* \(canvasRect\.height \/ app\.renderer\.screen\.height\)/,
  'collectible fly start Y should use renderer-to-DOM scaling, not logical viewport height'
);

assert.doesNotMatch(
  fn,
  /canvasRect\.height \/ getViewportGameHeight\(\)/,
  'collectible fly coordinates must not use logical viewport height after preview renderer height is extended'
);

assert.match(
  fn,
  /const boardScaleX = boardWrapper\.offsetWidth > 0 \? boardRect\.width \/ boardWrapper\.offsetWidth : 1;/,
  'collectible flight should account for the scaled board wrapper'
);

assert.match(
  fn,
  /const startLeft = toBoardLocalX\(globalX\);[\s\S]*?const startTop = toBoardLocalY\(globalY\);/,
  'collectible flight start should be converted from viewport pixels to board-local pixels'
);

assert.match(
  fn,
  /const targetWidth = targetRect\.width \/ Math\.max\(boardScaleX, 0\.0001\);[\s\S]*?targetSize = Math\.max\(1, Math\.min\(targetWidth, targetHeight\)\);/,
  'multi-collectible target size should be converted to board-local pixels before tweening'
);

console.log('collectible fly target regression passed');
