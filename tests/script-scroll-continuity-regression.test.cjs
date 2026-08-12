const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const match = source.match(/function advanceContinuousScroll\(deltaSec: number\) \{([\s\S]*?)\n\}/);

assert.ok(match, 'continuous scroll advance function should exist');
assert.doesNotMatch(
  match[1],
  /isPlayingStepTransition/,
  'scroll playback must continue while a scripted block slide is in progress'
);

console.log('script scroll continuity regression checks passed');
