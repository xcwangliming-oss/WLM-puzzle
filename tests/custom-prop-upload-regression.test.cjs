const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(
  source,
  /function importPropImage\(role: PropImageRole\): void \{[\s\S]*?document\.body\.appendChild\(input\);/,
  'the custom prop file input must be attached before its picker opens',
);
assert.match(
  source,
  /input\.value = '';[\s\S]*?input\.click\(\);/,
  'each picker invocation must clear its previous value before opening',
);
assert.match(
  source,
  /input\.addEventListener\('cancel', cleanup, \{ once: true \}\);/,
  'cancelling the picker must clean up the temporary input',
);
assert.match(
  source,
  /el\.onclick = event => \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?importPropImage\(role\);/,
  'each prop slot click must open exactly its own uploader without bubbling',
);
assert.doesNotMatch(
  source,
  /id='prop-(?:candy|machine)-slot'[^>]*onclick=/,
  'prop slots must not retain a second inline upload handler',
);

console.log('custom prop upload regression checks passed');
