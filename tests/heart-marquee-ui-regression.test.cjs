const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'heart-idle.gif')), 'idle heart gif should be bundled as a public asset');
assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'ui', 'heart-clear.gif')), 'clear heart gif should be bundled as a public asset');

assert.match(source, /type TopUiMode = 'classic' \| 'heart';/, 'top UI should have classic and heart modes');
assert.match(source, /function triggerHeartClearHud\(\)[\s\S]*?HEART_CLEAR_URL[\s\S]*?HEART_IDLE_URL/, 'heart HUD should switch to the clear gif during eliminations');
assert.match(source, /comboCount \+= 1;[\s\S]*?triggerHeartClearHud\(\);/, 'eliminations should trigger the heart clear animation');
assert.match(source, /function drawRecordingHeartHud\([\s\S]*?heart-score-val[\s\S]*?drawImage\(heartImage/, 'recording should draw the heart HUD in heart top UI mode');
assert.match(html, /id="heart-score-hud"[\s\S]*?id="heart-score-gif"[\s\S]*?id="heart-score-val"/, 'editor DOM should include the heart score HUD');
assert.match(html, /data-top-ui-mode="classic"[\s\S]*?data-top-ui-mode="heart"/, 'editor should expose top UI mode buttons');

assert.match(source, /let marqueeBorderEnabled = localStorage\.getItem\('marqueeBorderEnabled'\) === 'true';/, 'marquee border setting should persist');
assert.match(source, /function drawRecordingMarqueeBorder\([\s\S]*?if \(!marqueeBorderEnabled\) return;[\s\S]*?strokeRect/, 'recording should render the marquee border');
assert.match(html, /id="input-marquee-border"/, 'solid background panel should expose the marquee toggle');
assert.match(html, /#board-wrapper\.marquee-border-live #marquee-border[\s\S]*?display:\s*block/, 'live board should show marquee border when enabled');

console.log('heart and marquee UI regression checks passed');
