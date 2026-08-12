const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const gameOverCondition = source.match(/const isGameOver\s*=\s*([^;]+);/);

assert.ok(gameOverCondition, 'game-over condition should exist');
assert.match(
  gameOverCondition[1],
  /!isPlayingScript/,
  'script playback must not be interrupted by the live-game top boundary check'
);

console.log('script playback game-over regression checks passed');
