const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /\(scriptPlaybackMechanic !== 'scroll' \|\| !scriptPlaybackUsesRecordedScrollTrack\)[\s\S]*?\(isPlayingStepTransition \|\| liveClearChainActive \|\| hasAnyEliminationThisStep\)[\s\S]*?continuingVisibleRows\.length > 0/,
  'playback should continue live clear chain for multi-combo waves in non-scroll modes'
);

assert.match(
  source,
  /activeEliminationWaveIndex >= waves\.length && hasAnyEliminationThisStep[\s\S]*?return true;/,
  'shouldContinuePlaybackClearChain must allow combo cascades to continue in all modes'
);

assert.match(
  source,
  /\(scriptPlaybackMechanic !== 'scroll' \|\| !scriptPlaybackUsesRecordedScrollTrack\)[\s\S]*?rowsToClear\.length === 0[\s\S]*?visibleFullRows\.length > 0[\s\S]*?rowsToClear = visibleFullRows;/,
  'playback should clear visible full rows if rowsToClear is empty in non-scroll modes'
);

assert.match(
  source,
  /if \(scriptPlaybackMechanic !== 'scroll' \|\| !scriptPlaybackUsesRecordedScrollTrack\) \{[\s\S]*?pendingOffscreenFullRowBlockIds = \[\];/,
  'pending offscreen full rows must reset between steps in non-scroll modes'
);

console.log('playback combo elimination regression tests passed');
