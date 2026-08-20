const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'heart-idle-transparent.gif')), 'transparent idle heart gif should be bundled as a public asset');
assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'heart-clear-transparent.gif')), 'transparent clear heart gif should be bundled as a public asset');

assert.match(source, /type TopUiMode = 'classic' \| 'heart';/, 'top UI should have classic and heart modes');
assert.match(source, /function triggerHeartClearHud\(\)[\s\S]*?heart-score-burst[\s\S]*?classList\.add\('clearing'\)/, 'heart HUD should play the clear gif as an expanding burst layer');
assert.match(source, /comboCount \+= 1;[\s\S]*?triggerHeartClearHud\(\);/, 'eliminations should trigger the heart clear animation');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?heart-score-burst[\s\S]*?drawImage\(heartBurstImage[\s\S]*?drawImage\(heartImage/, 'recording should draw the expanding burst behind the base heart HUD');
assert.match(html, /id="heart-score-hud"[\s\S]*?id="heart-score-burst"[\s\S]*?id="heart-score-gif"[\s\S]*?id="heart-score-val"/, 'editor DOM should include separate base and burst heart layers');
assert.match(html, /#game-header\.heart-header-mode \{[\s\S]*?background:\s*transparent !important;[\s\S]*?border:\s*0 !important;[\s\S]*?box-shadow:\s*none !important;/, 'heart top UI should remove the classic header frame');
assert.match(html, /data-top-ui-mode="classic"[\s\S]*?data-top-ui-mode="heart"/, 'editor should expose top UI mode buttons');

assert.match(source, /let marqueeBorderEnabled = localStorage\.getItem\('marqueeBorderEnabled'\) === 'true';/, 'marquee border setting should persist');
assert.match(source, /function drawRecordingMarqueeBorder\([\s\S]*?if \(!marqueeBorderEnabled\) return;[\s\S]*?strokeRect/, 'recording should render the marquee border');
assert.match(html, /id="input-marquee-border"/, 'solid background panel should expose the marquee toggle');
assert.match(html, /#board-wrapper\.marquee-border-live #marquee-border[\s\S]*?display:\s*block/, 'live board should show marquee border when enabled');

console.log('heart and marquee UI regression checks passed');
