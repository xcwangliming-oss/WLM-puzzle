const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = source.match(/function syncGridAspectToPhoneScreen\(source\?: EventTarget \| null\) \{([\s\S]*?)\n  \}/);

assert.ok(match, 'grid aspect sync function should exist');
assert.match(
  source,
  /const DEFAULT_TOTAL_ROWS = 60;/,
  'editor default total rows should be 60'
);
assert.match(
  source,
  /totalRows: DEFAULT_TOTAL_ROWS,/,
  'runtime params should initialize total rows from the total row default'
);
assert.match(
  html,
  /id="slider-rows" min="10" max="200" value="60"/,
  'total row slider should default to 60'
);
assert.match(
  html,
  /id="input-rows" value="60"/,
  'hidden total row input should default to 60'
);
assert.match(
  match[1],
  /let totalRows = parseInt\(inputRows\?\.value \|\| String\(PARAMS\.totalRows\), 10\) \|\| PARAMS\.totalRows;/,
  'total rows must be read independently from the total row control'
);
assert.match(
  match[1],
  /sourceId === 'input-rows' \|\| sourceId === 'slider-rows'/,
  'total row controls should have their own branch'
);
assert.match(
  match[1],
  /totalRows = clamp\(totalRows, rows, 200\);/,
  'total rows should be independently clamped and only constrained by viewport rows'
);
assert.doesNotMatch(
  match[1],
  /PARAMS\.totalRows = rows;/,
  'changing visible rows must not blindly overwrite total rows'
);

console.log('total rows independence regression checks passed');
