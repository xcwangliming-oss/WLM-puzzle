const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');

assert.match(source, /const EDITOR_STAGE_BASE_WIDTH = 2020;/, 'editor stage should preserve the full 4K-designed workbench width including side panels');
assert.match(source, /const EDITOR_STAGE_BASE_HEIGHT = 1180;/, 'editor stage should include the full unscaled height of the tallest control panels');
assert.match(source, /const EDITOR_GAME_UI_HEIGHT = 987;/, 'phone preview should retain its original editor height while surrounding controls scale down');
assert.match(source, /function syncEditorStageScale\(\): void[\s\S]*?--editor-stage-scale[\s\S]*?scale\.toFixed\(4\)/, 'editor should compute one parent scale for the whole workbench');
assert.match(source, /setupDOMUI\(\);[\s\S]*?syncEditorStageScale\(\);/, 'editor stage scale should be initialized after DOM setup');
assert.match(source, /window\.addEventListener\('resize', \(\) => \{[\s\S]*?syncEditorStageScale\(\);[\s\S]*?applyGridConfig\(\);/, 'editor stage scale should refresh on resize');
assert.match(css, /body:not\(\.is-playable\) #tab-level\s*\{[\s\S]*?transform:\s*scale\(var\(--editor-stage-scale, 1\)\)/, 'the full editor workbench should scale as one parent surface');
assert.match(css, /body:not\(\.is-playable\) #game-ui\s*\{[\s\S]*?height:\s*var\(--editor-game-ui-height, 987px\)/, 'phone preview height should stay independent from the taller editor control stage');
assert.match(css, /body:not\(\.is-playable\) #script-panel\s*\{[\s\S]*?max-height:\s*calc\(var\(--editor-stage-height, 1180px\) - 8px\)/, 'script controls should scale with the full editor stage instead of an unscaled viewport height');
assert.match(css, /body:not\(\.is-playable\) #script-steps-panel\s*\{[\s\S]*?max-height:\s*calc\(var\(--editor-stage-height, 1180px\) - 8px\)/, 'script steps should scale with the full editor stage instead of an unscaled viewport height');

console.log('editor stage responsive regression checks passed');
