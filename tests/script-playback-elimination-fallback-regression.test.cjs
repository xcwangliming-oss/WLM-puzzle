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
  /const recordedRange = getVisibleRowRangeForWorldY\(getStepScrollY\(step\)\);/,
  'script playback fallback should use the recorded step viewport'
);
assert.match(
  source,
  /const playbackMaxRow = Math\.min\(recordedRange\.maxRow, getRecordedStepPhysicsMaxRow\(step\)\);/,
  'script playback fallback should cap scanning at the recorded visible bottom row'
);
assert.match(
  source,
  /const actualFullRows = getFullRowsFromOccupancy\(occ, recordedRange\.minRow, playbackMaxRow\);/,
  'script playback fallback must not clear rows outside the recorded visible viewport'
);
assert.match(
  source,
  /const recordedRowsStillFull = actualFullRows\.filter\(r => allowed\.includes\(r\)\);/,
  'script playback should still prefer recorded elimination rows when they match'
);
assert.match(
  source,
  /return actualFullRows;/,
  'script playback should fall back to actual full rows when recorded rows no longer match'
);
assert.match(
  source,
  /willEliminate = getPlaybackFullRowsFromOccupancy\(simulatedOcc, step\)\.length > 0;/,
  'gravity timing should use the same playback full-row fallback before choosing the non-elimination branch'
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
