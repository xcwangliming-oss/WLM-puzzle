const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /function animatePropShrink\([\s\S]*?const machineFrameTextures = animationImages\.map\(image => PIXI\.Texture\.from\(image\)\)[\s\S]*?new PIXI\.AnimatedSprite\(machineFrameTextures\)/,
  'prop shrink must use the selected raw machine-head frame sequence',
);
assert.match(
  source,
  /const frameScale = Math\.min\(machineW \/ frameW, cellSz \/ frameH\);[\s\S]*?const lockMachineHeadSize = \(\) => \{[\s\S]*?machineSprite\.scale\.set\(frameScale\);/,
  'the machine head must keep a fixed aspect ratio during the body shrink',
);
assert.match(
  source,
  /const initialCandyX = dir === 'left' \? rightEdge - startWw : leftEdge;[\s\S]*?const bodyWindowX = dir === 'left' \? leftEdge : leftEdge \+ machineW;[\s\S]*?const candySprite = new PIXI\.Sprite\(sprite\.texture\);[\s\S]*?mask\.drawRect\(bodyWindowX, baseYy, bodyWindowW, cellSz\)/,
  'the initial mask must be fixed at the machine-head boundary',
);
assert.match(
  source,
  /const removedW = Math\.max\(0, startWw - targetWw\)[\s\S]*?candySprite\.x = dir === 'left'[\s\S]*?initialCandyX \+ removedW \* ease \+ shakeX[\s\S]*?initialCandyX - removedW \* ease \+ shakeX[\s\S]*?mask\.drawRect\(bodyWindowX \+ shakeX, baseYy \+ shakeY - 20, bodyWindowW, cellSz \+ 40\)/,
  'the shrink must move the full-size candy body toward the fixed machine head mask',
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
assert.match(
  source,
  /if \(sprite instanceof PIXI\.AnimatedSprite && customPropMachineFrameImages\.length > 0\)[\s\S]*?getPropAnimationTextures\(newLen, dir, 'idle'\)[\s\S]*?sprite\.scale\.set\(1\);/,
  'completed shrink must restore idle animation frames and reset the live sprite transform',
);

console.log('prop shrink animation regression checks passed');
