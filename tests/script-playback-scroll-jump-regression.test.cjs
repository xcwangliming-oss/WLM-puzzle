const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const start = source.indexOf('async function playScript(');
const end = source.indexOf('function playScriptFromButton', start);
const body = source.slice(start, end);
const resetStart = source.indexOf('btnScriptReset.onclick = async () => {');
const resetEnd = source.indexOf('};', resetStart);
const resetBody = source.slice(resetStart, resetEnd);

assert.notEqual(start, -1, 'script playback function should exist');
assert.notEqual(end, -1, 'script playback button wrapper should exist');
assert.match(
  body,
  /const useRecordedScrollTrack = hasMeaningfulRecordedScrollTrack\(\);/,
  'playback should preserve viewport movement that was part of the recording'
);
assert.match(
  body,
  /if \(!autoScroll \|\| scriptPlaybackStopRequested\) return;[\s\S]*?isGameStarted = true;/,
  'orange scrolling playback should start moving immediately'
);
assert.match(
  source,
  /if \(isPlayingScript && scriptPlaybackUsesRecordedScrollTrack\) \{[\s\S]*?continuousScrollOffset \+= Math\.max\(1, PARAMS\.scrollSpeed \|\| 1\) \* deltaSec;[\s\S]*?setWorldY\(-continuousScrollOffset\);[\s\S]*?return;[\s\S]*?ensureContinuousScrollSupplyRow\(\);/,
  'recorded orange playback should scroll the camera continuously without spawning or shifting rows'
);
assert.match(
  body,
  /const shouldAlignToStepScroll = isResuming \|\| useRecordedScrollTrack;/,
  'playback should only jump to a recorded scroll position when resuming or using scroll playback'
);
assert.match(
  body,
  /const shouldAlignEachStepScroll = isResuming && !useRecordedScrollTrack;/,
  'legacy resume alignment should remain separate from recorded viewport playback'
);
assert.match(
  body,
  /if \(useRecordedScrollTrack && !autoScroll\) \{[\s\S]*?const targetY = getStepScrollY\(step\);[\s\S]*?await animateRecordedScrollTo\(/,
  'normal playback may animate directly to authored viewports'
);
assert.match(
  source,
  /async function waitForRecordedScrollStepPosition\(step: ScriptStep\)[\s\S]*?while \(!scriptPlaybackStopRequested\)[\s\S]*?getImmediatePlayableFullRows\(\)[\s\S]*?checkEliminations\(\)[\s\S]*?!isAnimating && worldContainer\.y <= targetY \+ 1[\s\S]*?waitForScriptPlaybackDelay\(20\)/,
  'sparse recorded keyframes should wait for their camera position while resolving visible clear chains'
);
assert.match(
  source,
  /if \(!isAnimating\) \{[\s\S]*?const targetBlock = step\.blockId[\s\S]*?getFullyVisibleRowRangeForWorldY\(worldContainer\.y\)[\s\S]*?targetBlock\.row >= visibleRange\.minRow[\s\S]*?targetBlock\.row <= visibleRange\.maxRow[\s\S]*?return;/,
  'every next move should start as soon as its actual block is fully visible'
);
assert.match(
  body,
  /if \(autoScroll && useRecordedScrollTrack\) \{[\s\S]*?await waitForRecordedScrollStepPosition\(step\);[\s\S]*?selectedStepIndex = i;/,
  'a recorded operation must not execute before continuous scrolling reaches its authored viewport'
);
assert.doesNotMatch(
  body,
  /void animateRecordedScrollTo\(/,
  'recorded camera movement must not outlive the step that owns it'
);
assert.match(
  body,
  /if \(\(!useRecordedScrollTrack \|\| autoScroll\) && stepDelay > 0\) \{[\s\S]*?waitForScriptPlaybackDelay\(stepDelay \* 1000\)/,
  'orange playback should preserve the configured pause after each completed operation'
);
assert.match(
  body,
  /if \(scriptPlaybackAdvanceMode === 'scroll' && !useRecordedScrollTrack\) \{[\s\S]*?snapWorldYToGrid\(\);/,
  'recorded camera playback must not jump to a grid boundary when playback ends'
);
assert.match(
  body,
  /restoreBoardState\(\{ preserveWorldY: !autoScroll && !rising && !options\.mechanic \}\);/,
  'normal playback should restore blocks without forcing the camera back to the saved start scroll'
);
assert.match(
  body,
  /if \(scriptPlaybackMechanic === 'scroll'\) \{[\s\S]*?continuousScrollOffset = Math\.max\(0, -\(worldContainer \? worldContainer\.y : virtualScrollY\)\);/,
  'scroll playback should synchronize its continuous offset after restoring or resetting the camera'
);
assert.doesNotMatch(
  body,
  /const shouldAlignToStepScroll = useRecordedScrollTrack \|\| \(!autoScroll && !rising\);/,
  'normal playback must not force-align to the first step scroll position'
);
assert.match(
  source,
  /function getNextPlaybackWaveWorldY\([\s\S]*?eliminationWaveScrollYs\?\.\[activeEliminationWaveIndex\][\s\S]*?waveCenter[\s\S]*?getWorldYFromScrollRow\(targetTopRow\)/,
  'a recorded elimination wave should use its recorded camera position or a centered legacy fallback'
);
assert.match(
  source,
  /function continueGravityAfterElimination\(\)[\s\S]*?hasVisibleFullRows[\s\S]*?nextWaveWorldY = shouldCheckNextClear && !hasVisibleFullRows[\s\S]*?animateRecordedScrollTo\([\s\S]*?\.then\(applyNextGravity\)/,
  'post-clear gravity should clear visible rows before moving to a later recorded wave'
);
assert.match(
  resetBody,
  /stopWorldAdvanceTweens\(true\);[\s\S]*?restoreBoardState\(\);/,
  'resetting the script start should stop stale camera motion before restoring the board'
);

console.log('script playback scroll jump regression checks passed');
