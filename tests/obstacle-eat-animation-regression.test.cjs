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
  /function playObstacleEatAnimation\([\s\S]*?getPropMachineHeadColumn\(\{ col: oldCol, length: oldLen, propDir: dir \}\)[\s\S]*?const startCol = dir === 'left' \? oldCol \+ oldLen : oldCol - 1/,
  'the eater must target the machine-head side and enter from one cell in front of the obstacle',
);
assert.match(
  source,
  /anim\.scale\.set\(dir === 'left' \? -frameScale : frameScale, frameScale\)/,
  'the eater must preserve aspect ratio while mirroring with obstacle direction',
);
assert.match(
  source,
  /playObstacleEatAnimation\(b\.row, oldCol, oldLen, dir, b\.length <= 0 \? 650 : 500\)/,
  'each damaged obstacle must independently trigger the eater animation',
);

console.log('obstacle eat animation regression checks passed');
