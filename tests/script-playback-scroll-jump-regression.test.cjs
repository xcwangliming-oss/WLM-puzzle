const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const start = source.indexOf('async function playScript(');
const end = source.indexOf('function playScriptFromButton', start);
const body = source.slice(start, end);

assert.notEqual(start, -1, 'script playback function should exist');
assert.notEqual(end, -1, 'script playback button wrapper should exist');
assert.match(
  body,
  /const useRecordedScrollTrack = autoScroll && hasMeaningfulRecordedScrollTrack\(\);/,
  'normal fixed playback should not treat recorded scroll metadata as a camera track'
);
assert.match(
  body,
  /const shouldAlignToStepScroll = isResuming \|\| useRecordedScrollTrack;/,
  'playback should only jump to a recorded scroll position when resuming or using scroll playback'
);
assert.match(
  body,
  /const shouldAlignEachStepScroll = isResuming && !useRecordedScrollTrack;/,
  'normal playback should not realign the camera at every scripted step'
);
assert.doesNotMatch(
  body,
  /const shouldAlignToStepScroll = useRecordedScrollTrack \|\| \(!autoScroll && !rising\);/,
  'normal playback must not force-align to the first step scroll position'
);

console.log('script playback scroll jump regression checks passed');
