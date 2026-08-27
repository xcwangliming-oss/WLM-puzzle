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
assert.match(source, /const DIRECT_OUTPUT_RECORDING_FPS = 60;/, 'direct MP4 recording should export at 60fps');
assert.match(source, /const TRANSPARENT_RECORDING_FPS = 60;/, 'transparent source recording should export at 60fps');
assert.match(
  source,
  /const frameIntervalMs = 1000 \/ encoderSettings\.fps;/,
  'recording draw cadence should use the configured fps'
);
assert.match(
  source,
  /captureStream\(encoderSettings\.fps\)/,
  'recording capture fallback should use the configured fps'
);
assert.match(
  source,
  /const RECORDING_CHUNK_MS = 1000 \/ DIRECT_OUTPUT_RECORDING_FPS;/,
  'recording should slice WebM chunks at the target frame interval'
);
assert.match(
  source,
  /recorderWebM\.start\(RECORDING_CHUNK_MS\);[\s\S]*?recordingVideoTrack\?\.requestFrame\?\.\(\);/,
  'recording should push an explicit stable frame as soon as MediaRecorder starts'
);
assert.match(
  source,
  /fps=\$\{encoderSettings\.fps\}/,
  'server conversion should use the configured fps'
);

const viteConfig = fs.readFileSync(path.join(__dirname, '..', 'vite.config.ts'), 'utf8');
assert.match(
  viteConfig,
  /const keyframeInterval = Math\.max\(1, fps \* 2\);/,
  'MP4 conversion should use a deterministic 2-second keyframe interval'
);
assert.match(
  viteConfig,
  /'-vf', `fps=\$\{fps\}:round=near,format=yuv420p`[\s\S]*?'-fps_mode', 'cfr'/,
  'MP4 conversion should force constant frame-rate output'
);
assert.match(
  viteConfig,
  /'-g', String\(keyframeInterval\)[\s\S]*?'-keyint_min', String\(keyframeInterval\)[\s\S]*?'-sc_threshold', '0'/,
  'MP4 conversion should prevent scene-cut-generated keyframes'
);

console.log('script video recording regression checks passed');
