const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'heart-idle.webm')), 'transparent idle heart video should be bundled as a public asset');
assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'heart-clear.webm')), 'transparent clear heart video should be bundled as a public asset');

assert.match(source, /type TopUiMode = 'classic' \| 'heart';/, 'top UI should have classic and heart modes');
assert.match(source, /function triggerHeartClearHud\(\)[\s\S]*?heart-score-burst[\s\S]*?currentTime = 0[\s\S]*?classList\.add\('clearing'\)[\s\S]*?heartBurstEl\.play/, 'heart HUD should replay the clear video as an expanding burst layer');
assert.match(source, /comboCount \+= 1;[\s\S]*?triggerHeartClearHud\(\);/, 'eliminations should trigger the heart clear animation');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?heart-score-burst[\s\S]*?drawImage\(heartBurstImage[\s\S]*?drawImage\(heartImage/, 'recording should draw the expanding burst behind the base heart HUD');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?mapBoardWrapperRectToRecordingRect\(hudRect, boardRect, \{ x: 0, y: 0, w: width, h: height \}\)[\s\S]*?mapBoardWrapperRectToRecordingRect\(heartRect, boardRect, \{ x: 0, y: 0, w: width, h: height \}\)/, 'recording heart HUD should map the live DOM rectangles so exports match the editor preview');
assert.match(source, /const boardClipBox = getRecordingBoardClipRect\(boardWrapper \|\| null, width, height\);[\s\S]*?const boardCanvasBox = getRecordingPixiCanvasRect\(pixiCanvas, boardWrapper \|\| null, width, height\);/, 'recording should draw and clip the board from the live preview DOM rectangles instead of compressing the full canvas into the fixed template');
assert.match(source, /if \(isSolidRecordingBackgroundActive\(\) && topUiMode !== 'heart'\) \{[\s\S]*?drawSolidRecordingFrame/, 'heart top UI recordings should not draw the classic solid background frames');
assert.match(html, /id="heart-score-hud"[\s\S]*?<video id="heart-score-burst"[\s\S]*?heart-clear\.webm[\s\S]*?<video id="heart-score-gif"[\s\S]*?heart-idle\.webm[\s\S]*?id="heart-score-val"/, 'editor DOM should include separate base and burst heart video layers');
assert.match(html, /#game-header\.heart-header-mode \{[\s\S]*?background:\s*transparent !important;[\s\S]*?border:\s*0 !important;[\s\S]*?box-shadow:\s*none !important;/, 'heart top UI should remove the classic header frame');
assert.match(html, /#heart-score-hud\s*\{[\s\S]*?top:\s*50%;[\s\S]*?width:\s*210px;[\s\S]*?height:\s*150px;/, 'heart score text container should keep its original centered position and size');
assert.match(html, /#heart-score-gif\s*\{[\s\S]*?top:\s*calc\(50% \+ 10px\);[\s\S]*?width:\s*120%;[\s\S]*?height:\s*120%;/, 'only the base heart layer should move down and scale up');

assert.match(source, /shatterMode:\s*1,/, 'shatter mode should default to the first option');
assert.match(html, /data-top-ui-mode="classic"[\s\S]*?data-top-ui-mode="heart"/, 'editor should expose top UI mode buttons');

assert.match(source, /let marqueeBorderEnabled = localStorage\.getItem\('marqueeBorderEnabled'\) === 'true';/, 'marquee border setting should persist');
assert.match(source, /function drawRecordingMarqueeBorder\([\s\S]*?if \(!marqueeBorderEnabled\) return;[\s\S]*?strokeRect/, 'recording should render the marquee border');
assert.match(html, /id="input-marquee-border"/, 'solid background panel should expose the marquee toggle');
assert.match(html, /#board-wrapper\.marquee-border-live #marquee-border[\s\S]*?display:\s*block/, 'live board should show marquee border when enabled');

console.log('heart and marquee UI regression checks passed');
