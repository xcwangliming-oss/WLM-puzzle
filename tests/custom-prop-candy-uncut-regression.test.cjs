const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const start = source.indexOf('function getPropTexture(');
const end = source.indexOf('function spawnBlock(', start);
assert.notEqual(start, -1, 'getPropTexture must exist');
assert.notEqual(end, -1, 'spawnBlock must follow getPropTexture');
const body = source.slice(start, end);

assert.doesNotMatch(
  body,
  /tileCanvas|for \(let dx = [\s\S]*?ctx\.drawImage\(tileCanvas/,
  'custom obstacle body images must not be sliced into repeated tiles',
);
assert.match(
  body,
  /const candyW = Math\.max\(0, machineImg \? w - cellSize \/ 2 : w - cellSize\);[\s\S]*?const candyStartX = machineImg[\s\S]*?\? \(dir === 'left' \? 0 : cellSize \/ 2\)[\s\S]*?: \(dir === 'left' \? 0 : cellSize\);[\s\S]*?ctx\.rect\(candyStartX, 0, candyW, h\);[\s\S]*?const bodyScale = h \/ customPropCandyImg\.naturalHeight;[\s\S]*?const bodyW = customPropCandyImg\.naturalWidth \* bodyScale;[\s\S]*?ctx\.drawImage\(customPropCandyImg, candyStartX, 0, bodyW, h\);/,
  'custom obstacle body must keep aspect ratio and clip to the machine-head midpoint',
);
assert.match(
  body,
  /ctx\.translate\(candyStartX \+ candyW, 0\);[\s\S]*?ctx\.scale\(-1, 1\);[\s\S]*?ctx\.drawImage\(customPropCandyImg, 0, 0, bodyW, h\);/,
  'right-facing custom obstacle body must mirror and clip the aspect-ratio-correct image',
);
assert.doesNotMatch(
  body,
  /ctx\.drawImage\(customPropCandyImg, (?:0|candyStartX), 0, candyW, h\);/,
  'custom obstacle body must not be horizontally compressed to the current obstacle length',
);
assert.match(
  body,
  /const machineCellX = dir === 'left' \? w - cellSize : 0;[\s\S]*?ctx\.rect\(machineCellX, 0, cellSize, h\);[\s\S]*?const scale = Math\.min\(cellSize \/ machineImg\.naturalWidth, h \/ machineImg\.naturalHeight\);/,
  'custom machine head must be clipped and scaled to exactly one grid cell',
);
assert.match(
  body,
  /ctx\.drawImage\(customPropCandyImg, candyStartX, 0, bodyW, h\);[\s\S]*?if \(machineImg && machineImg\.naturalWidth > 0 && machineImg\.naturalHeight > 0\)/,
  'custom obstacle body must be drawn before the machine head so the body sits underneath it',
);

console.log('custom prop candy uncut regression checks passed');
