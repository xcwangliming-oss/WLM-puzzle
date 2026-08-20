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
assert.match(html, /clear-text-spark[\s\S]*?radial-gradient[\s\S]*?@keyframes clear-text-spark/, 'clear text should include matching glow spark particles');

assert.match(source, /let comboTextEffectEnabled = localStorage\.getItem\('comboTextEffectEnabled'\) === 'true';/, 'combo text toggle should persist');
assert.match(source, /let praiseTextEffectEnabled = localStorage\.getItem\('praiseTextEffectEnabled'\) === 'true';/, 'praise text toggle should persist');
assert.match(source, /function getComboWordUrl\(combo: number\)[\s\S]*?combo <= 1[\s\S]*?combo1\.png[\s\S]*?combo <= 3[\s\S]*?combo2\.png[\s\S]*?combo <= 5[\s\S]*?combo3\.png[\s\S]*?combo <= 7[\s\S]*?combo4\.png[\s\S]*?combo5\.png/, 'combo word image should follow the configured combo-count ranges');
assert.match(source, /function triggerComboTextEffect\(rows: number\[\], combo: number\)[\s\S]*?const comboValue = Math\.max\(1, combo\);[\s\S]*?const comboWordUrl = getComboWordUrl\(comboValue\);[\s\S]*?const digits = String\(comboValue\)\.split\(''\);[\s\S]*?pushClearTextEffect\(\{ type: 'combo'[\s\S]*?comboCount: comboValue \}\);[\s\S]*?appendComboTextEffectAtPoint/, 'combo text should create one effect per elimination wave and show the continuous elimination combo count');
assert.match(source, /function appendComboTextEffectAtPoint\([\s\S]*?const wordWidth = Math\.min\(178, boardWidth \* 0\.26\);[\s\S]*?const digitWidth = Math\.min\(41, boardWidth \* 0\.065\);[\s\S]*?const digitGap = digitWidth \* 1\.05;[\s\S]*?appendClearTextImage\('combo-word'[\s\S]*?appendClearTextImage\('combo-digit'[\s\S]*?160, digitWidth/, 'combo text should render a smaller centered horizontal group with non-overlapping delayed digits');
assert.match(source, /function getBoardFixedPraisePoint\(\)[\s\S]*?clipRect\.top - wrapperRect\.top \+ 50/, 'praise text should use a fixed visible position inside the board');
assert.match(source, /function triggerPraiseTextEffect\(word: PraiseWord\)[\s\S]*?getBoardFixedPraisePoint\(\)[\s\S]*?boardWidth \* 0\.62[\s\S]*?appendClearTextSparks/, 'praise text should render at the fixed board-top praise position with sparks');
assert.match(source, /comboCount \+= 1;[\s\S]*?triggerComboTextEffect\(fullRows, comboCount\);/, 'eliminations should trigger combo text after the combo count advances');
assert.match(source, /const praiseWord = getPraiseWordForCombo\(comboCount\);[\s\S]*?playSound\(sounds\.vocals\[praiseWord\]\);[\s\S]*?triggerPraiseTextEffect\(praiseWord\);/, 'praise text should follow the actual vocal word');
assert.match(source, /function drawRecordingClearTextEffects\([\s\S]*?effect\.type === 'combo'[\s\S]*?effect\.type === 'praise'/, 'recording should draw combo and praise text effects');
assert.match(source, /function drawRecordingClearTextSparks\([\s\S]*?globalCompositeOperation = 'lighter'[\s\S]*?createRadialGradient/, 'recording should draw matching spark particles around clear text');
assert.match(source, /const digitElapsed = elapsed - 160;[\s\S]*?drawRecordingImageCentered\(context, image, firstDigitX \+ index \* digitGap, rowY \+ 3 \+ digitMotion\.yShift/, 'recording combo digits should appear after the Combo word with extra spacing');
assert.match(source, /praiseY \+ motion\.yShift, boardBox\.w \* 0\.62[\s\S]*?drawRecordingClearTextSparks\(context, centerX, praiseY/, 'recording praise text should use the same fixed board-top position with sparks');
assert.match(source, /drawRecordingMarqueeBorder\(recordingCtx!, boardClipBox, performance\.now\(\)\);[\s\S]*?drawRecordingClearTextEffects\(recordingCtx!, boardClipBox, performance\.now\(\)\);/, 'recording should draw clear text over the board after the marquee border');

console.log('clear text effects regression checks passed');
