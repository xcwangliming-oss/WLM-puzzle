const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainTsPath = path.join(root, 'src', 'main.ts');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');

// 1. playScript must never allow a block to slide through other blocks
const playStart = mainTs.indexOf('async function playScript(');
assert.ok(playStart >= 0, 'playScript must exist in main.ts');
const playEnd = mainTs.indexOf('function playScriptFromButton', playStart);
assert.ok(playEnd > playStart, 'playScriptFromButton must follow playScript');
const playBody = mainTs.slice(playStart, playEnd);

assert.ok(
  !playBody.includes('bounds check was strict; proceeding with recorded move'),
  'playScript must not bypass horizontal bounds check to slide through other blocks',
);

assert.ok(
  playBody.includes('if (!canMoveBlockHorizontallyTo(block, step.toCol)) {'),
  'playScript must check canMoveBlockHorizontallyTo before moving a block',
);

// 2. playScript block lookup must not search across rows or teleport blocks across rows
assert.ok(
  !playBody.includes('block.row = step.row;'),
  'playScript must not teleport blocks from another row into step.row',
);

// 3. getGridOccupancy must ignore invisible and destroyed blocks
const occStart = mainTs.indexOf('function getGridOccupancy(');
assert.ok(occStart >= 0, 'getGridOccupancy must exist');
const occEnd = mainTs.indexOf('function getHorizontalMoveBounds(', occStart);
assert.ok(occEnd > occStart, 'getHorizontalMoveBounds must follow getGridOccupancy');
const occBody = mainTs.slice(occStart, occEnd);

assert.ok(
  occBody.includes('b.sprite.visible === false'),
  'getGridOccupancy must ignore blocks with invisible sprites',
);

// 4. drawFrame must call app.renderer.render to avoid black/flickering frames in video recording
const drawStart = mainTs.indexOf('const drawFrame = () =>');
assert.ok(drawStart >= 0, 'drawFrame must exist');
const drawEnd = mainTs.indexOf('function stopRecording()', drawStart);
assert.ok(drawEnd > drawStart, 'stopRecording must follow drawFrame');
const drawBody = mainTs.slice(drawStart, drawEnd);

assert.ok(
  drawBody.includes('app.renderer.render(app.stage)'),
  'drawFrame must call app.renderer.render before copying Pixi canvas to prevent flickering',
);

console.log('playback-no-penetration-no-flicker regression tests passed successfully!');
