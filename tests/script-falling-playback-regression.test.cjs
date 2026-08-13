const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /let scriptPlaybackMechanic: BoardMechanic \| null = null;/,
  'script playback must track the full board mechanic, including falling'
);
assert.match(
  source,
  /scriptPlaybackMechanic = options\.mechanic \|\| \(autoScroll \? 'scroll' : \(rising \? 'rising' : 'fixed'\)\);/,
  'script playback should accept an explicit mechanic override'
);
assert.match(
  source,
  /scriptPlaybackAdvanceMode = scriptPlaybackMechanic === 'falling' \? 'fixed' : scriptPlaybackMechanic;/,
  'falling playback should use fixed advance mode while exposing falling mechanic behavior'
);
assert.match(
  source,
  /playScriptFromButton\(false, false, 'falling'\);/,
  'the script panel should expose a falling playback action'
);

const refillMatch = source.match(/function maybeRefillFallingTopArea\(\): boolean \{([\s\S]*?)\n\}/);
assert.ok(refillMatch, 'falling refill function should exist');
assert.match(
  refillMatch[1],
  /const isFallingScriptPlayback = isPlayingScript && getActiveBoardMechanic\(\) === 'falling';/,
  'falling refill should recognize falling script playback'
);
assert.doesNotMatch(
  refillMatch[1],
  /isPlayingScript \|\|/,
  'falling refill must not be disabled for falling script playback'
);

const spawnMatch = source.match(/function maybeSpawnFallingTopPage\(\): boolean \{([\s\S]*?)\n\}/);
assert.ok(spawnMatch, 'falling top-page spawn function should exist');
assert.match(
  spawnMatch[1],
  /const isFallingScriptPlayback = isPlayingScript && getActiveBoardMechanic\(\) === 'falling';/,
  'falling top-page spawn should recognize falling script playback'
);
assert.doesNotMatch(
  spawnMatch[1],
  /isPlayingScript \|\|/,
  'falling top-page spawn must not be disabled for falling script playback'
);

console.log('script falling playback regression checks passed');
