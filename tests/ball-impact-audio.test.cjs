const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;
function decode(file) {
  return cp.execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-ac', '1', '-ar', '44100', '-f', 'f32le', 'pipe:1']);
}
function peak(bytes, seconds) {
  let result = 0;
  for (let i = 0; i < Math.min(bytes.length / 4, seconds * 44100); i++) {
    result = Math.max(result, Math.abs(bytes.readFloatLE(i * 4)));
  }
  return result;
}
const root = path.join(__dirname, '..', 'assets', 'playable-audio');
const original = decode(path.join(root, 'ball-impact.mp3'));
const tight = decode(path.join(root, 'ball-impact-tight.wav'));
assert.ok(peak(original, 0.02) < 0.01, 'original has a quiet leading section');
assert.ok(peak(tight, 0.02) > 0.1, 'trimmed impact becomes audible within the first 20ms');
assert.ok(Math.abs((original.length - tight.length) / 4 / 44100 - 0.028) < 1 / 44100);
assert.ok(Math.abs(peak(original, 1) - peak(tight, 1)) < 0.002, 'trim must retain the main impact peak');
console.log('Impact onset moved forward 28ms without cutting the main transient');
