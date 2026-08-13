const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');

assert.match(
  mainSource,
  /customPropStyle:\s*getExportableCustomPropStyle\(\)/,
  'exported playable state must embed uploaded prop style images',
);

assert.match(
  mainSource,
  /queueCustomPropStyle\(saveData\.customPropStyle\)/,
  'loading playable state must import embedded prop style images',
);

assert.match(
  mainSource,
  /customPropStyleSystemReady\s*=\s*true;\s*[\s\S]*loadCustomPropImages\(\);\s*[\s\S]*applyPendingCustomPropStyle\(\);/,
  'embedded prop style must be applied after the prop texture system is initialized',
);

assert.match(
  mainSource,
  /localStorage\.setItem\(PROP_STORAGE_CANDY,\s*style\.candy!\)/,
  'embedded prop candy images must hydrate the same storage path as manual uploads',
);

console.log('custom prop style export regression checks passed');
