const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

[
  'combo/0.png',
  'combo/1.png',
  'combo/2.png',
  'combo/3.png',
  'combo/4.png',
  'combo/5.png',
  'combo/6.png',
  'combo/7.png',
  'combo/8.png',
  'combo/9.png',
  'combo/combo1.png',
  'combo/combo5.png',
  'praise/good.png',
  'praise/great.png',
  'praise/amazing.png',
  'praise/Excellent.png',
  'praise/unbelievable.png',
].forEach(asset => {
  assert.ok(
    fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'clear-text', asset)),
    `clear text asset should exist: ${asset}`
  );
});

assert.match(html, /id="clear-text-effects"/, 'board wrapper should include a live clear-text effect layer');
assert.match(html, /id="input-combo-text-effect"/, 'editor should expose an independent combo text toggle');
assert.match(html, /id="input-praise-text-effect"/, 'editor should expose an independent praise text toggle');
assert.match(html, /@keyframes clear-text-pop[\s\S]*?scale\(1\.28\)/, 'combo text should use an instant pop animation');
assert.match(html, /@keyframes praise-text-pop[\s\S]*?opacity:\s*0;/, 'praise text should pop and fade out');

assert.match(source, /let comboTextEffectEnabled = localStorage\.getItem\('comboTextEffectEnabled'\) === 'true';/, 'combo text toggle should persist');
assert.match(source, /let praiseTextEffectEnabled = localStorage\.getItem\('praiseTextEffectEnabled'\) === 'true';/, 'praise text toggle should persist');
assert.match(source, /function triggerComboTextEffect\(rows: number\[\], combo: number\)[\s\S]*?getBoardRowEffectPoint\(row, 20\)[\s\S]*?combo-word[\s\S]*?combo-digit/, 'combo text should appear 20px above each cleared row with delayed digits');
assert.match(source, /function triggerPraiseTextEffect\(word: PraiseWord\)[\s\S]*?getBoardRowEffectPoint\(0, -30\)[\s\S]*?praise-word/, 'praise text should appear 30px below the board top');
assert.match(source, /comboCount \+= 1;[\s\S]*?triggerComboTextEffect\(fullRows, comboCount\);/, 'eliminations should trigger combo text after the combo count advances');
assert.match(source, /const praiseWord = getPraiseWordForCombo\(comboCount\);[\s\S]*?playSound\(sounds\.vocals\[praiseWord\]\);[\s\S]*?triggerPraiseTextEffect\(praiseWord\);/, 'praise text should follow the actual vocal word');
assert.match(source, /function drawRecordingClearTextEffects\([\s\S]*?effect\.type === 'combo'[\s\S]*?effect\.type === 'praise'/, 'recording should draw combo and praise text effects');
assert.match(source, /drawRecordingMarqueeBorder\(recordingCtx!, boardClipBox, performance\.now\(\)\);[\s\S]*?drawRecordingClearTextEffects\(recordingCtx!, boardClipBox, performance\.now\(\)\);/, 'recording should draw clear text over the board after the marquee border');

console.log('clear text effects regression checks passed');
