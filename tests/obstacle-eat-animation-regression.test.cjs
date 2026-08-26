const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /eatFrames\?: string\[\];[\s\S]*?PROP_STORAGE_EAT_FRAMES/,
  'the eater frame sequence must be part of the export and persistent asset model',
);
assert.match(
  source,
  /type PropImageRole = 'machine' \| 'machine_attack' \| 'eat' \| 'candy'/,
  'the eater uploader must use its own frame role',
);
assert.match(
  source,
  /id='prop-eat-slot'[\s\S]*?id='input-prop-eat'[\s\S]*?bindFrameInput\('eat', 'input-prop-eat', 'prop-eat-count'\)/,
  'the eater slot must accept a single image or a multi-frame upload',
);
assert.match(
  source,
  /const eaterW = cellSz \* 2;[\s\S]*?const eaterH = cellSz \* 2;[\s\S]*?const startScale = normalScale \* 0\.2;/,
  'the eater must reserve a fixed four-cell display area and grow into it',
);
assert.match(
  source,
  /const normalScale = Math\.min\(eaterW \/ frameW, eaterH \/ frameH\);[\s\S]*?anim\.scale\.set\(approachSign \* scale, scale\)/,
  'the eater must preserve aspect ratio while growing and mirroring with obstacle direction',
);
assert.match(
  source,
  /const getFreeEndCenterX = \(col: number, length: number\) => dir === 'left'[\s\S]*?\(col - 1\) \* cellSz[\s\S]*?\(col \+ length \+ 1\) \* cellSz;[\s\S]*?const startX = getFreeEndCenterX\(oldCol, oldLen\);[\s\S]*?const targetX = getFreeEndCenterX\(newCol, newLen\);/,
  'the eater must start outside the obstacle free end and follow it toward the machine head',
);
assert.match(
  source,
  /const growDuration = Math\.min\(260, Math\.max\(160, duration \* 0\.35\)\);[\s\S]*?const movementDuration = Math\.max\(300, duration - growDuration\);/,
  'the eater must grow first and then remain in motion for the obstacle shrink window',
);
assert.match(
  source,
  /anim\.y = baseY;[\s\S]*?anim\.scale\.set\(approachSign \* scale, scale\);/,
  'the eater must move horizontally without the previous airborne arc after growing to its fixed size',
);
assert.match(
  source,
  /const lingerDuration = 260;[\s\S]*?Math\.max\(movementDuration, duration\) \+ lingerDuration/,
  'the eater must linger briefly after the obstacle finishes shrinking',
);
assert.match(
  source,
  /playObstacleEatAnimation\(\s*b\.row,\s*oldCol,\s*oldLen,\s*newCol,\s*newLen,\s*dir,\s*newLen <= 0 \? 650 : 500,\s*\)/,
  'each damaged obstacle must independently trigger the eater animation',
);

console.log('obstacle eat animation regression checks passed');
