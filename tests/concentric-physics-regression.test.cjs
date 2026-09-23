const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'main.ts'),
  'utf8',
);

function bodyOf(name, nextName) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} must exist`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start) : source.length;
  return source.slice(start, end < 0 ? source.length : end);
}

const visibility = bodyOf('updateConcentricBlockVisibility', 'getConcentricTopRowsNeedingSupply');
assert.ok(
  !visibility.includes('if (isCovered || isAboveBoard)'),
  'an obstacle-covered cell must not hide the whole block',
);

const fallingVisibility = bodyOf('updateConcentricFallingVisibility', 'ensureConcentricTopBuffer');
assert.ok(
  fallingVisibility.includes('visualRow < 0') &&
  !fallingVisibility.includes('isCellCoveredByProps(activeProps, block.col + c, visualRow)'),
  'falling blocks must only be hidden outside the board; obstacle sprites cover their cells',
);

const occupancy = bodyOf('getGridOccupancy', 'getHorizontalMoveBounds');
assert.ok(
  !occupancy.includes('!b.sprite.visible'),
  'hidden concentric blocks must remain physical occupancy anchors',
);

const gravity = bodyOf('applyGravity', 'playRowShatterEffect');
assert.ok(
  !gravity.includes('if (isCovered) return'),
  'gravity occupancy must keep exposed cells of a multi-cell block when another cell is behind an obstacle',
);

const placement = bodyOf('canPlaceBlock', 'initOrUpdateManualPreviewSprite');
assert.ok(
  !placement.includes('b.sprite.visible'),
  'placement must reject overlap with hidden physical blocks too',
);

const topSupply = bodyOf('getConcentricTopRowsNeedingSupply', 'updateConcentricFallingVisibility');
assert.ok(
  topSupply.includes('openCols.every') &&
  !topSupply.includes('some(c => openCols.includes(c))'),
  'a top row is present only when every exposed column is occupied',
);

const shrink = bodyOf('animateConcentricPropShrink', 'getPropTexture');
assert.ok(
  shrink.indexOf('animation.addChild(bodySprite, headSprite)') < shrink.indexOf('sprite.visible = false') &&
  shrink.includes('bodyTexture.frame.x =') && shrink.includes('bodyTexture.frame.y =') &&
  shrink.includes('bodyTexture.updateUvs()') &&
  !shrink.includes('candySprite.mask') && !shrink.includes('new PIXI.Graphics()'),
  'a damaged obstacle must slide into its visible head at constant scale without an opaque mask',
);
assert.ok(!source.includes('updateConcentricObstacleOcclusionMask'), 'opaque obstacle cover must stay removed');

console.log('concentric physics regression tests passed');
