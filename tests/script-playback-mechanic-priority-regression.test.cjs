const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const match = source.match(/function getActiveBoardMechanic\(\): BoardMechanic \{([\s\S]*?)\n\}/);

assert.ok(match, 'active board mechanic resolver should exist');

const body = match[1];
const playbackPriorityIndex = body.indexOf('if (scriptPlaybackAdvanceMode) return scriptPlaybackAdvanceMode;');
const fallingIndex = body.indexOf("if (isFallingMode) return 'falling';");

assert.notEqual(playbackPriorityIndex, -1, 'script playback mode should explicitly override the editor mechanic');
assert.notEqual(fallingIndex, -1, 'falling editor mode should still be preserved outside script playback');
assert.ok(
  playbackPriorityIndex < fallingIndex,
  'rising and scroll script playback must not be shadowed by the current falling editor mode'
);

console.log('script playback mechanic priority regression checks passed');
