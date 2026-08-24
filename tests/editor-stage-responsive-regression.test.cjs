const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');

assert.match(source, /const EDITOR_STAGE_BASE_WIDTH = 2020;/, 'editor stage should preserve the full 4K-designed workbench width including side panels');
assert.match(source, /const EDITOR_STAGE_BASE_HEIGHT = 995;/, 'editor stage should preserve the 4K-designed workbench height');
assert.match(source, /function syncEditorStageScale\(\): void[\s\S]*?--editor-stage-scale[\s\S]*?scale\.toFixed\(4\)/, 'editor should compute one parent scale for the whole workbench');
assert.match(source, /setupDOMUI\(\);[\s\S]*?syncEditorStageScale\(\);/, 'editor stage scale should be initialized after DOM setup');
assert.match(source, /window\.addEventListener\('resize', \(\) => \{[\s\S]*?syncEditorStageScale\(\);[\s\S]*?applyGridConfig\(\);/, 'editor stage scale should refresh on resize');
assert.match(css, /body:not\(\.is-playable\) #tab-level\s*\{[\s\S]*?transform:\s*scale\(var\(--editor-stage-scale, 1\)\)/, 'the full editor workbench should scale as one parent surface');
assert.match(css, /body:not\(\.is-playable\) #game-ui\s*\{[\s\S]*?height:\s*calc\(var\(--editor-stage-height, 995px\) - 8px\)/, 'phone preview height should be based on the unscaled stage height');

console.log('editor stage responsive regression checks passed');
