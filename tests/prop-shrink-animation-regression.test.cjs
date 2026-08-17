const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /function animatePropShrink\([\s\S]*?const machineFrameTextures = animationState === 'attack'[\s\S]*?new PIXI\.AnimatedSprite\(machineFrameTextures\)/,
  'prop shrink must use the selected raw machine-head frame sequence',
);
assert.match(
  source,
  /const lockMachineHeadSize = \(\) => \{[\s\S]*?const frameScale = Math\.min\(machineW \/ frameW, cellSz \/ frameH\);[\s\S]*?machineSprite\.scale\.set\(frameScale\);/,
  'the machine head must keep its aspect ratio during the body shrink',
);
assert.match(
  source,
  /const fullPropTexture = getPropAnimationTextures\(oldLen, dir, animationState\)\[0\][\s\S]*?const candySprite = new PIXI\.Sprite\(fullPropTexture\);/,
  'the shrink animation must use the pre-damage full-length prop texture',
);
assert.match(
  source,
  /const initialBodyW = Math\.max\(0, startWw - machineW\)[\s\S]*?rightEdge - machineW - initialBodyW[\s\S]*?leftEdge \+ machineW, baseYy, initialBodyW/,
  'the initial mask must leave the machine head cell outside the candy body',
);
assert.match(
  source,
  /const bodyW = Math\.max\(0, curW - machineW\)[\s\S]*?candySprite\.x = leftEdge \+ shakeX[\s\S]*?rightEdge - machineW - bodyW \+ shakeX[\s\S]*?leftEdge \+ machineW \+ shakeX/,
  'the shrink must move the candy body mask toward the fixed machine head',
);
assert.match(
  source,
  /animatePropShrink\(b\.sprite,[\s\S]*?b\.length,\s*true,\s*\(\) =>/,
  'every obstacle damaged by a clear wave must receive the attack animation',
);
assert.match(
  source,
  /const animationDelay = hitDistance \* 100;/,
  'direct obstacle hits must start without an extra delay',
);
assert.match(
  source,
  /const animationLayer = sprite\.parent\.parent \|\| sprite\.parent;/,
  'shrink animation must live above the block layer while gravity reorders blocks',
);
assert.match(
  source,
  /if \(propAnimationStates\.get\(b\.sprite\) !== 'attack'\) return;/,
  'ordinary movement must not restart an already-idle obstacle sequence',
);

console.log('prop shrink animation regression checks passed');
