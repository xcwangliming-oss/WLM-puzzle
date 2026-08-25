const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /function getPlaybackFullRowsFromOccupancy\(occ: number\[\]\[\], step: ScriptStep\): number\[\]/,
  'script playback should resolve full rows through a dedicated playback helper'
);
assert.match(
  source,
  /const visualWorldY = worldContainer \? worldContainer\.y : getStepScrollY\(step\);[\s\S]*?const visualRange = getFullyVisibleRowRangeForWorldY\(visualWorldY\);/,
  'script playback fallback should use only fully visible rows in the current viewport'
);
assert.match(
  source,
  /const playbackMaxRow = Math\.min\(visualRange\.maxRow, recordedRange\.maxRow, getRecordedStepPhysicsMaxRow\(step\)\);/,
  'script playback fallback should cap scanning at the recorded visible bottom row'
);
assert.match(
  source,
  /const visibleFullRows = getFullRowsFromOccupancy\(occ, playbackMinRow, playbackMaxRow\);/,
  'script playback should identify a fully visible trigger row'
);
assert.match(
  source,
  /const allFullRows = getFullRowsFromOccupancy\(occ\);[\s\S]*?const allowedFullRows = allFullRows\.filter\(row => allowed\.includes\(row\)\);/,
  'playback should retain recorded full rows even before they enter the viewport'
);
assert.match(
  source,
  /const newVisibleAllowedRows = visibleFullRows\.filter\([\s\S]*?!pendingRows\.includes\(row\)[\s\S]*?if \(newVisibleAllowedRows\.length === 0\) \{[\s\S]*?pendingOffscreenFullRowBlockIds\.push\(ids\);[\s\S]*?return \[\];/,
  'an offscreen recorded wave should remain pending instead of clearing when it scrolls into view'
);
assert.match(
  source,
  /const recordedChainFinished = recordedWaves\.length > 0[\s\S]*?const liveClearChainActive = hasAnyEliminationThisStep[\s\S]*?isPlayingStepTransition \|\| liveClearChainActive[\s\S]*?const continuingVisibleRows = getFullRowsFromOccupancy\([\s\S]*?visualRange\.minRow[\s\S]*?getStepGravityMaxRow\(step\)[\s\S]*?pendingOffscreenFullRowBlockIds = pendingOffscreenFullRowBlockIds\.filter/,
  'gravity-created visible rows should continue a recorded scrolling clear after authored waves end'
);
assert.match(
  source,
  /const rowsToClear = normalizeEliminatedRows\(\[[\s\S]*?\.\.\.allowedFullRows,[\s\S]*?\.\.\.refreshPendingOffscreenFullRows\(occ\)[\s\S]*?const clearedRows = new Set\(rowsToClear\);[\s\S]*?return rowsToClear;/,
  'a later visible recorded trigger should clear its wave and every still-full pending row together'
);
assert.match(
  source,
  /willEliminate = getPlaybackFullRowsFromOccupancy\(simulatedOcc, step\)\.length > 0;/,
  'gravity timing should use the same playback full-row fallback before choosing the non-elimination branch'
);
assert.match(
  source,
  /if \(waves\.length === 0\) \{[\s\S]*?hasAnyEliminationThisStep[\s\S]*?return getPlaybackAllowedRows\(step\)\.length > 0;/,
  'legacy flat eliminatedRows should keep checking after gravity creates later rows in the same chain'
);
assert.match(
  source,
  /scriptPlaybackMechanic === 'scroll'[\s\S]*?scriptPlaybackUsesRecordedScrollTrack[\s\S]*?activeEliminationWaveIndex >= waves\.length[\s\S]*?hasAnyEliminationThisStep[\s\S]*?return true;/,
  'scroll playback should run one more gravity check after its recorded waves are exhausted'
);
assert.match(
  source,
  /function getFullyVisibleRowRangeForWorldY\([\s\S]*?Math\.ceil\(viewportTop \/ PARAMS\.cellSize\)[\s\S]*?Math\.floor\(viewportBottom \/ PARAMS\.cellSize\) - 1/,
  'partially clipped rows must never be eligible for playback elimination'
);
assert.match(
  source,
  /let pendingOffscreenFullRowBlockIds: number\[\]\[\] = \[\];[\s\S]*?function refreshPendingOffscreenFullRows\([\s\S]*?members\.every\(block => block\.row === row\)[\s\S]*?getFullRowsFromOccupancy\(occ, row, row\)\.includes\(row\)/,
  'pending rows should be tracked by stable block identities and discarded if they break'
);
assert.match(
  source,
  /function rememberOffscreenFullRows\([\s\S]*?row < minVisibleRow \|\| row > maxVisibleRow[\s\S]*?pendingOffscreenFullRowBlockIds\.push\(ids\)[\s\S]*?return refreshPendingOffscreenFullRows\(occ\);/,
  'every offscreen full row should enter the pending queue before a playback trigger is evaluated'
);
assert.match(
  source,
  /function getTriggeredFullRowsFromOccupancy\([\s\S]*?rememberOffscreenFullRows\(occ, minVisibleRow, maxVisibleRow\)[\s\S]*?newlyCompletedVisibleRows[\s\S]*?if \(newlyCompletedVisibleRows\.length === 0\) return \[\];[\s\S]*?refreshPendingOffscreenFullRows\(occ\)/,
  'pending offscreen rows should clear only when another visible row is newly completed'
);
assert.match(
  source,
  /function getPlaybackFullRowsFromOccupancy\([\s\S]*?const visualRange = getFullyVisibleRowRangeForWorldY\(visualWorldY\);[\s\S]*?getFullyVisibleRowRangeForWorldY\(getStepScrollY\(step\)\)[\s\S]*?const playbackMinRow = Math\.max\(visualRange\.minRow, recordedRange\.minRow\);[\s\S]*?Math\.min\(visualRange\.maxRow, recordedRange\.maxRow, getRecordedStepPhysicsMaxRow\(step\)\)/,
  'continuous camera playback should eliminate only rows visible both now and at the recorded step boundary'
);
assert.match(
  source,
  /const visibleRange = getFullyVisibleRowRangeForWorldY\(worldContainer\.y\);[\s\S]*?const minRow = visibleRange\.minRow;[\s\S]*?const maxRow = Math\.min\(visibleRange\.maxRow, getActivePhysicsMaxRow\(\)\);/,
  'instant repair must use a fully visible trigger boundary'
);
assert.match(
  source,
  /function getImmediatePlayableFullRows\(\): number\[\] \{[\s\S]*?activeSimulatingStepIndex !== null && !isRepairingScript[\s\S]*?getPlaybackFullRowsFromOccupancy\(occ, step\)[\s\S]*?getFullyVisibleRowRangeForWorldY\(worldContainer\.y\)/,
  'immediate playback elimination must use the same recorded and visible trigger boundary'
);

const checkStart = source.indexOf('function checkEliminations()');
const checkEnd = source.indexOf('const btnSingleColorMode', checkStart + 1);
const checkBody = source.slice(checkStart, checkEnd === -1 ? source.length : checkEnd);

assert.match(
  checkBody,
  /fullRows\.push\(\.\.\.getPlaybackFullRowsFromOccupancy\(occ, step\)\);/,
  'visible elimination playback should not skip effects when recorded rows are stale'
);

console.log('script playback elimination fallback regression checks passed');
