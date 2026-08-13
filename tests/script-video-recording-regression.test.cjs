const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const start = source.indexOf('async function playScriptFromButton');
const end = source.indexOf('function generateGameplayRow', start);
const body = source.slice(start, end);

assert.notEqual(start, -1, 'script playback button wrapper should exist');
assert.notEqual(end, -1, 'script playback wrapper should end before gameplay helpers');
assert.match(
  body,
  /if \(isRecordingArmedForPlayback\)[\s\S]*?recordingStartedForPlayback = await startRecording\(\);/,
  'armed script recording should start the real video recorder before autoplay'
);
assert.match(
  body,
  /if \(!recordingStartedForPlayback\) return;/,
  'autoplay should not proceed when the video recorder cannot start'
);
assert.match(
  body,
  /await playScript\(autoScroll, rising, \{ mechanic \}\);/,
  'autoplay should still use the normal script playback path'
);
assert.match(
  body,
  /if \(recordingStartedForPlayback && isRecording\) \{[\s\S]*?stopRecording\(\);/,
  'script video recording should stop after playback completes'
);

console.log('script video recording regression checks passed');
