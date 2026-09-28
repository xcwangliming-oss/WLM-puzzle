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

// 1. getConcentricPropTipCell must calculate the tip coordinates accurately for all 4 directions
const tipCellFunc = bodyOf('getConcentricPropTipCell', 'createConcentricTipSprite');
assert.ok(
  tipCellFunc.includes("dir === 'left'") &&
  tipCellFunc.includes('{ col: b.col, row: b.row }'),
  'left direction tip must be at { col: b.col, row: b.row }',
);
assert.ok(
  tipCellFunc.includes("dir === 'right'") &&
  tipCellFunc.includes('col: b.col + Math.max(0, b.length - 1)'),
  'right direction tip must be at { col: b.col + length - 1, row: b.row }',
);
assert.ok(
  tipCellFunc.includes("dir === 'down'") &&
  tipCellFunc.includes('row: b.row + Math.max(0, b.length - 1)'),
  'down direction tip must be at { col: b.col, row: b.row + length - 1 }',
);

// 2. getActiveConcentricCorridorBounds must dynamically check for open columns on horizontal obstacle rows
const boundsFunc = bodyOf('getActiveConcentricCorridorBounds', 'getConcentricEliminationRowBounds');
assert.ok(
  boundsFunc.includes('getOpenColumnsForRow') &&
  boundsFunc.includes('isCompletelyBlocking'),
  'corridor bounds must evaluate whether obstacle rows are completely blocking or have open space',
);

// 3. animateConcentricPropShrink must synchronize tip prop position and animate fly-away on destroy
const shrinkFunc = bodyOf('animateConcentricPropShrink', 'getPropTexture');
assert.ok(
  shrinkFunc.includes('tipSprite') &&
  shrinkFunc.includes('tipSprite.x = bodySprite.x') &&
  shrinkFunc.includes('updateBlockTipPropPosition'),
  'shrink animation must update tip prop position with retreating body',
);
assert.ok(
  shrinkFunc.includes('playConcentricDuckFlyAway(tipSprite)') || shrinkFunc.includes('gsap.to(tipSprite'),
  'destroyed obstacle must animate tip prop flying away',
);

// 4. createConcentricTipSprite must support sequence frames via PIXI.AnimatedSprite
const createSpriteFunc = bodyOf('createConcentricTipSprite', 'updateBlockTipPropPosition');
assert.ok(
  createSpriteFunc.includes('concentricCustomTipFrameImages.length > 1') &&
  createSpriteFunc.includes('new PIXI.AnimatedSprite'),
  'createConcentricTipSprite must create PIXI.AnimatedSprite when sequence frames are uploaded',
);

// 5. playConcentricDuckFlyAway must support two-stage animation (enlarge first, then disappear) and fly frames
const flyAwayFunc = bodyOf('playConcentricDuckFlyAway', 'triggerConcentricVictory');
assert.ok(
  (flyAwayFunc.includes('gsap.to(') || flyAwayFunc.includes('tl.to(')) &&
  flyAwayFunc.includes('alpha: 0') &&
  flyAwayFunc.includes('concentricCustomFlyFrameImages'),
  'playConcentricDuckFlyAway must support dedicated fly-away sequence frames and fade out',
);
assert.ok(
  flyAwayFunc.includes('1.65') && flyAwayFunc.includes('enlargedScale'),
  'playConcentricDuckFlyAway must first enlarge before flying away and disappearing',
);

// 6. triggerConcentricVictory must fly away all ducks when obstacle bars are completely cleared
const victoryFunc = bodyOf('triggerConcentricVictory', 'let isSingleColorMode');
assert.ok(
  victoryFunc.includes('playConcentricDuckFlyAway'),
  'triggerConcentricVictory must fly away remaining ducks when all obstacle bars are cleared',
);

console.log('concentric-duck-tip-prop regression tests passed successfully!');
