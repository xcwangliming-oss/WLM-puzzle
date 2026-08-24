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
assert.match(source, /comboCount \+= Math\.max\(1, fullRows\.length\);[\s\S]*?triggerHeartClearHud\(\);/, 'eliminations should trigger the heart clear animation');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?heart-score-burst[\s\S]*?drawRecordingVideoContained\(context, heartBurstImage, burstBox\)[\s\S]*?drawRecordingVideoContained\(context, heartImage, heartBox\)/, 'recording should draw the expanding burst behind the base heart HUD without stretching either video layer');
assert.match(source, /function drawRecordingVideoContained\([\s\S]*?const scale = Math\.min\(box\.w \/ sourceWidth, box\.h \/ sourceHeight\);[\s\S]*?drawWidth[\s\S]*?drawHeight/, 'recording should contain-fit heart videos instead of stretching the square source into a wide box');
assert.match(source, /const cssFontSize = scoreEl \? parseFloat\(getComputedStyle\(scoreEl\)\.fontSize\) : 58;[\s\S]*?const fontSize = Math\.round\(cssFontSize \* wrapperScaleX\);/, 'recording should keep the heart score size matched to the live CSS font size');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?context\.strokeStyle = '#9a155f';[\s\S]*?context\.shadowBlur = 0;[\s\S]*?context\.strokeText\(scoreText, centerX, centerY\);/, 'recording heart score should use the dark pink outline without glow');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?mapBoardWrapperRectToRecordingRect\(hudRect, boardRect, \{ x: 0, y: 0, w: width, h: height \}\)[\s\S]*?mapBoardWrapperRectToRecordingRect\(heartRect, boardRect, \{ x: 0, y: 0, w: width, h: height \}\)/, 'recording heart HUD should map the live DOM rectangles so exports match the editor preview');
assert.match(source, /const boardClipBox = getRecordingBoardClipRect\(boardWrapper \|\| null, width, height\);[\s\S]*?const boardCanvasBox = getRecordingPixiCanvasRect\(pixiCanvas, boardWrapper \|\| null, width, height\);/, 'recording should draw and clip the board from the live preview DOM rectangles instead of compressing the full canvas into the fixed template');
assert.match(source, /if \(isSolidRecordingBackgroundActive\(\) && topUiMode === 'heart'\) \{[\s\S]*?drawSolidRecordingBoardFrame\(recordingCtx!, boardClipBox, width\);/, 'heart top UI recordings should keep the board frame while omitting the classic header frame');
assert.match(html, /id="heart-score-hud"[\s\S]*?<video id="heart-score-burst"[\s\S]*?heart-clear\.webm[\s\S]*?<video id="heart-score-gif"[\s\S]*?heart-idle\.webm[\s\S]*?id="heart-score-val"/, 'editor DOM should include separate base and burst heart video layers');
assert.match(html, /#game-header\.heart-header-mode \{[\s\S]*?background:\s*transparent !important;[\s\S]*?border:\s*0 !important;[\s\S]*?box-shadow:\s*none !important;/, 'heart top UI should remove the classic header frame');
assert.doesNotMatch(html, /#board-wrapper\.heart-top-ui-live #board-clip \{[\s\S]*?background:\s*transparent !important;[\s\S]*?border-radius:\s*0 !important;[\s\S]*?box-shadow:\s*none !important;/, 'heart top UI should keep the solid board clip frame under the grid');
assert.match(html, /#heart-score-hud\s*\{[\s\S]*?top:\s*50%;[\s\S]*?width:\s*210px;[\s\S]*?height:\s*150px;/, 'heart score text container should keep its original centered position and size');
assert.match(html, /#heart-score-gif\s*\{[\s\S]*?top:\s*calc\(50% \+ 10px\);[\s\S]*?width:\s*120%;[\s\S]*?height:\s*120%;/, 'only the base heart layer should move down and scale up');
assert.match(html, /#heart-score-val\s*\{[\s\S]*?-webkit-text-stroke:\s*4px #9a155f;[\s\S]*?paint-order:\s*stroke fill;[\s\S]*?text-shadow:\s*none;/, 'live heart score should use a dark pink outline instead of glow');

assert.match(source, /shatterMode:\s*1,/, 'shatter mode should default to the first option');
assert.match(html, /data-top-ui-mode="classic"[\s\S]*?data-top-ui-mode="heart"/, 'editor should expose top UI mode buttons');

assert.match(source, /let marqueeBorderEnabled = localStorage\.getItem\('marqueeBorderEnabled'\) === 'true';/, 'marquee border setting should persist');
assert.match(source, /function triggerMarqueeClearEffect\(\)[\s\S]*?marqueeClearStartedAt = performance\.now\(\)[\s\S]*?classList\.add\('clearing'\)/, 'eliminations should replay the marquee clear effect');
assert.match(source, /comboCount \+= Math\.max\(1, fullRows\.length\);[\s\S]*?triggerHeartClearHud\(\);[\s\S]*?triggerMarqueeClearEffect\(\);/, 'eliminations should trigger the marquee clear animation alongside the heart HUD');
assert.match(source, /function drawRecordingMarqueeBorder\([\s\S]*?if \(!marqueeBorderEnabled\) return;[\s\S]*?if \(!marqueeClearStartedAt\) return;[\s\S]*?createConicGradient/, 'recording should only render the animated marquee border during an elimination');
assert.match(source, /const borderWidth = Math\.max\(12, Math\.min\(20, boardBox\.w \* 0\.021\)\);[\s\S]*?const outward = borderWidth \* 0\.9;/, 'recording marquee border should match the live outside ring scale instead of drawing an oversized frame');
assert.match(source, /maybeConicGradient\.call\(context, -Math\.PI \/ 2 \+ Math\.PI \* 0\.28 - phase \* Math\.PI \* 2, centerX, centerY\)/, 'recording marquee gradient should use the adjusted top-origin clockwise phase that matches the live CSS ring visually');
assert.doesNotMatch(source, /bevelGradient|lineWidth = borderWidth;[\s\S]*?lineWidth = borderWidth;[\s\S]*?drawRoundedRectPath\(context, strokeX, strokeY, strokeW, strokeH, radius\);[\s\S]*?context\.stroke\(\);[\s\S]*?drawRoundedRectPath\(context, strokeX, strokeY, strokeW, strokeH, radius\);[\s\S]*?context\.stroke\(\);/, 'recording marquee border should not stack multiple full-width colored strokes');
assert.doesNotMatch(source, /rgba\(12, 28, 90, 0\.82\)/, 'recording marquee border should not add a separate dark inner frame that changes the live look');
assert.doesNotMatch(source, /drawRecordingMarqueeClearEffect|marquee-clear-band|marquee-clear-particles/, 'marquee clear should not add a separate bottom band or particle effect');
assert.match(html, /id="input-marquee-border"/, 'solid background panel should expose the marquee toggle');
assert.match(html, /#board-wrapper\.marquee-border-live #marquee-border[\s\S]*?display:\s*block/, 'live board should show marquee border when enabled');
assert.match(html, /@property --marquee-angle[\s\S]*?syntax:\s*"<angle>"/, 'marquee angle should be registered so the conic gradient rotates continuously');
assert.match(html, /#marquee-border\.clearing::before[\s\S]*?marquee-border-spin 0\.58s linear infinite/, 'live board should rotate the whole conic border during an elimination');
assert.match(html, /\.marquee-flow\s*\{[\s\S]*?display:\s*none;/, 'live board should not use four separate side bands that create visible seams');
assert.match(html, /#marquee-border::after[\s\S]*?box-shadow:[\s\S]*?filter:\s*blur\(7px\)[\s\S]*?#marquee-border\.clearing::after/, 'live board should include a soft glow layer for the marquee border');

console.log('heart and marquee UI regression checks passed');
