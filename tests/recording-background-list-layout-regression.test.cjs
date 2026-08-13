const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.css'), 'utf8');
const match = css.match(/\.record-bg-list\s*\{([\s\S]*?)\n\}/);

assert.ok(match, 'recording background list style should exist');
assert.match(match[1], /display:\s*flex;/, 'background cards should use the same flex layout style as material cards');
assert.match(match[1], /flex-wrap:\s*wrap;/, 'background cards should wrap to new rows instead of clipping horizontally');
assert.match(match[1], /max-height:\s*none;/, 'background list should expand to show all uploaded backgrounds');
assert.match(match[1], /overflow-y:\s*visible;/, 'background list should not hide the upload card behind internal scrolling');
assert.doesNotMatch(match[1], /grid-template-columns/, 'background list should not use a fixed five-column grid');

console.log('recording background list layout regression checks passed');
