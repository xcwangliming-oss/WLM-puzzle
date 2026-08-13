const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const match = source.match(/function syncGridAspectToPhoneScreen\(source\?: EventTarget \| null\) \{([\s\S]*?)\n  \}/);

assert.ok(match, 'grid aspect sync function should exist');
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
