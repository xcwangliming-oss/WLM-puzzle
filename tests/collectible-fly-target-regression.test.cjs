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

console.log('collectible fly target regression passed');
