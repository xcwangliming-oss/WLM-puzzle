const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /function animatePropShrink\([\s\S]*?useAttackFrames = false[\s\S]*?new PIXI\.AnimatedSprite\(getPropAnimationTextures\(1, dir, animationState\)\)/,
  'prop shrink must use the attack frame sequence for direct hits',
);
assert.match(
  source,
  /const lockMachineHeadSize = \(\) => \{[\s\S]*?machineSprite\.scale\.set\(machineW \/ frameW, cellSz \/ frameH\);/,
  'the machine head must keep a fixed size during the body shrink',
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
