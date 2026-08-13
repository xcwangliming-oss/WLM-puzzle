const fs = require('fs');
const path = require('path');
const assert = require('assert');

const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
const body = fs.readFileSync(mainPath, 'utf8');

assert.match(
  body,
  /const BOARD_FRAME_VERTICAL_SCALE = 1\.04;/,
  'phone-style board frame should keep its lower safe-area extension'
);

assert.match(
  body,
  /let h = w \* \(contentH \/ contentW\);/,
  'preview canvas height should be derived from renderer aspect, not stretched to the clip height'
);

assert.match(
  body,
  /if \(h > target\.h\) \{[\s\S]*?w = h \* \(contentW \/ contentH\);[\s\S]*?\}/,
  'preview canvas should fall back to height fitting while preserving aspect'
);

assert.match(
  body,
  /x: target\.x \+ \(target\.w - w\) \/ 2,/,
  'preview canvas should be centered after aspect-preserving scaling'
);

assert.match(
  body,
  /fitRectToWidthPreserveAspect\([\s\S]*?'bottom'[\s\S]*?\);/,
  'preview canvas should be bottom-aligned inside the extended phone frame'
);

assert.doesNotMatch(
  body,
  /const h = target\.h;/,
  'preview canvas must not use independent target height because that makes square blocks look stretched'
);

console.log('preview canvas aspect regression passed');
