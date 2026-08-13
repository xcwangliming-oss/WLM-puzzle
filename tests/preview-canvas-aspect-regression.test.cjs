const fs = require('fs');
const path = require('path');
const assert = require('assert');

const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
const body = fs.readFileSync(mainPath, 'utf8');

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

assert.doesNotMatch(
  body,
  /const h = target\.h;/,
  'preview canvas must not use independent target height because that makes square blocks look stretched'
);

console.log('preview canvas aspect regression passed');
