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
  /function playObstacleEatAnimation\([\s\S]*?getPropMachineHeadColumn\(\{ col: oldCol, length: oldLen, propDir: dir \}\)[\s\S]*?const startCol = dir === 'left' \? oldCol - 1 : oldCol \+ oldLen[\s\S]*?const targetCol = dir === 'left' \? oldCol : oldCol \+ oldLen - 1/,
  'the eater must start one cell before the obstacle body and advance into it',
);
assert.match(
  source,
  /const normalScale = Math\.min\(cellSz \/ frameW, cellSz \/ frameH\);[\s\S]*?const startScale = normalScale \* 3;[\s\S]*?anim\.scale\.set\(approachSign \* startScale, startScale\)/,
  'the eater must start three times larger while preserving aspect ratio and mirroring with obstacle direction',
);
assert.match(
  source,
  /const approachSign = dir === 'left' \? 1 : -1;[\s\S]*?const targetX = \(targetCol \+ 0\.5\) \* cellSz;/,
  'the eater mouth must face the obstacle body and align with its next cell',
);
assert.match(
  source,
  /const movementDuration = Math\.max\(300, duration - 80\);/,
  'the eater must remain in motion for the obstacle shrink window',
);
assert.match(
  source,
  /anim\.y = baseY;[\s\S]*?const scale = startScale \+ \(normalScale - startScale\) \* eased;/,
  'the eater must move horizontally without the previous airborne arc while shrinking toward normal size',
);
assert.match(
  source,
  /const lingerDuration = 260;[\s\S]*?Math\.max\(movementDuration, duration\) \+ lingerDuration/,
  'the eater must linger briefly after the obstacle finishes shrinking',
);
assert.match(
  source,
  /playObstacleEatAnimation\(b\.row, oldCol, oldLen, dir, b\.length <= 0 \? 650 : 500\)/,
  'each damaged obstacle must independently trigger the eater animation',
);

console.log('obstacle eat animation regression checks passed');
