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
  'combo/color/0.png',
  'combo/color/1.png',
  'combo/color/2.png',
  'combo/color/3.png',
  'combo/color/4.png',
  'combo/color/5.png',
  'combo/color/6.png',
  'combo/color/7.png',
  'combo/color/8.png',
  'combo/color/9.png',
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
assert.match(html, /combo-word[\s\S]*?clear-text-pop 900ms[\s\S]*?combo-digit[\s\S]*?clear-text-pop 840ms/, 'combo text should stay visible longer in the live preview');
assert.match(html, /@keyframes clear-text-pop[\s\S]*?scale\(1\.28\)/, 'combo text should use an instant pop animation');
assert.match(html, /@keyframes praise-text-pop[\s\S]*?opacity:\s*0;/, 'praise text should pop and fade out');
assert.match(html, /clear-text-spark[\s\S]*?radial-gradient[\s\S]*?@keyframes clear-text-spark/, 'clear text should include matching glow spark particles');

assert.match(source, /let comboTextEffectEnabled = localStorage\.getItem\('comboTextEffectEnabled'\) === 'true';/, 'combo text toggle should persist');
assert.match(source, /let praiseTextEffectEnabled = localStorage\.getItem\('praiseTextEffectEnabled'\) === 'true';/, 'praise text toggle should persist');
assert.match(source, /function getComboWordUrl\(combo: number\)[\s\S]*?combo <= 1[\s\S]*?combo1\.png[\s\S]*?combo <= 3[\s\S]*?combo2\.png[\s\S]*?combo <= 5[\s\S]*?combo3\.png[\s\S]*?combo <= 7[\s\S]*?combo4\.png[\s\S]*?combo5\.png/, 'combo word image should follow the configured combo-count ranges');
assert.match(source, /const COMBO_COLOR_DIGIT_URLS = Array\.from\(\{ length: 10 \}[\s\S]*?\/color\/\$\{index\}\.png/, 'combo text should define a separate colored digit set');
assert.match(source, /const COMBO_TEXT_EFFECT_DURATION_MS = 1050;/, 'combo text should remain visible longer than the original short pop');
assert.match(source, /function getComboDigitUrls\(combo: number\)[\s\S]*?combo >= 8 \? COMBO_COLOR_DIGIT_URLS : COMBO_DIGIT_URLS[\s\S]*?String\(Math\.max\(1, combo\)\)\.split\(''\)/, 'combo 8 and above should use colored digit images');
assert.match(source, /function triggerComboTextEffect\(rows: number\[\], combo: number\)[\s\S]*?const comboValue = Math\.max\(1, combo\);[\s\S]*?const comboWordUrl = getComboWordUrl\(comboValue\);[\s\S]*?const digitUrls = getComboDigitUrls\(comboValue\);[\s\S]*?pushClearTextEffect\(\{ type: 'combo'[\s\S]*?comboCount: comboValue \}\);[\s\S]*?appendComboTextEffectAtPoint/, 'combo text should create one effect per elimination wave and show the continuous elimination combo count');
assert.match(source, /type ClearTextEffect = \{[\s\S]*?boardYRatio\?: number;/, 'combo text effects should remember their trigger-time board position');
assert.match(source, /pushClearTextEffect\(\{ type: 'combo'[\s\S]*?boardYRatio: point\.yRatio[\s\S]*?comboCount: comboValue \}\)/, 'combo text should store the fixed trigger position before recording redraws');
assert.match(source, /function appendClearTextImage\([\s\S]*?heightPx\?: number[\s\S]*?img\.style\.height = `\$\{heightPx\}px`;[\s\S]*?img\.style\.objectFit = 'contain'/, 'live clear text images should support a fixed contain box');
assert.match(source, /function appendComboTextEffectAtPoint\([\s\S]*?const wordWidth = Math\.min\(205, boardWidth \* 0\.3\);[\s\S]*?const digitWidth = Math\.min\(47, boardWidth \* 0\.075\);[\s\S]*?const digitHeight = digitWidth \* 1\.24;[\s\S]*?const digitGap = digitWidth \* 1\.05;[\s\S]*?appendClearTextImage\('combo-word'[\s\S]*?appendClearTextImage\('combo-digit'[\s\S]*?160, digitWidth, digitHeight/, 'combo text should render slightly larger digits in a fixed-size contain box with non-overlapping delayed digits');
assert.match(source, /function getBoardFixedPraisePoint\(\)[\s\S]*?clipRect\.top - wrapperRect\.top \+ 50/, 'praise text should use a fixed visible position inside the board');
assert.match(source, /function triggerPraiseTextEffect\(word: PraiseWord\)[\s\S]*?getBoardFixedPraisePoint\(\)[\s\S]*?boardWidth \* 0\.62[\s\S]*?appendClearTextSparks/, 'praise text should render at the fixed board-top praise position with sparks');
assert.match(source, /comboCount \+= Math\.max\(1, fullRows\.length\);[\s\S]*?triggerComboTextEffect\(fullRows, comboCount\);/, 'multi-row eliminations should add the cleared row count before triggering combo text');
assert.match(source, /const praiseWord = getPraiseWordForCombo\(comboCount\);[\s\S]*?playSound\(sounds\.vocals\[praiseWord\]\);[\s\S]*?triggerPraiseTextEffect\(praiseWord\);/, 'praise text should follow the actual vocal word');
assert.match(source, /function drawRecordingClearTextEffects\([\s\S]*?effect\.type === 'combo'[\s\S]*?effect\.type === 'praise'/, 'recording should draw combo and praise text effects');
assert.match(source, /function drawRecordingClearTextSparks\([\s\S]*?globalCompositeOperation = 'lighter'[\s\S]*?createRadialGradient/, 'recording should draw matching spark particles around clear text');
assert.match(source, /function drawRecordingImageContainedCentered\([\s\S]*?const fit = Math\.min\(boxW \/ sourceWidth, boxH \/ sourceHeight\)/, 'recording should support fixed contain boxes for variable digit artwork');
assert.match(source, /const digitHeight = digitWidth \* 1\.24;[\s\S]*?const digitUrls = getComboDigitUrls\(effect\.comboCount\);[\s\S]*?const digitElapsed = elapsed - 160;[\s\S]*?digitUrls\.forEach\(\(url, index\) => \{[\s\S]*?drawRecordingImageContainedCentered\(context, image, firstDigitX \+ index \* digitGap, rowY \+ 3 \+ digitMotion\.yShift, digitWidth, digitHeight/, 'recording combo digits should use the same fixed-size digit box and appear after the Combo word with extra spacing');
assert.match(source, /const fixedBoardYRatio = typeof effect\.boardYRatio === 'number'[\s\S]*?boardBox\.y \+ boardBox\.h \* fixedBoardYRatio[\s\S]*?: boardBox\.y \+ \(\(effect\.row \* PARAMS\.cellSize\) \+ \(worldContainer\?\.y \|\| 0\)\) \* scaleY - 20/, 'recording combo text should prefer the fixed trigger position instead of drifting with later board scroll');
assert.match(source, /praiseY \+ motion\.yShift, boardBox\.w \* 0\.62[\s\S]*?drawRecordingClearTextSparks\(context, centerX, praiseY/, 'recording praise text should use the same fixed board-top position with sparks');
assert.match(source, /drawRecordingMarqueeBorder\(recordingCtx!, boardClipBox, performance\.now\(\)\);[\s\S]*?drawRecordingClearTextEffects\(recordingCtx!, boardClipBox, performance\.now\(\)\);/, 'recording should draw clear text over the board after the marquee border');

console.log('clear text effects regression checks passed');
