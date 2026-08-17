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

assert.match(
  mainSource,
  /localStorage\.getItem\(PROP_STORAGE_MACHINE_FRAMES\)/,
  'export must fall back to the original uploaded machine-head frame data',
);

assert.match(
  mainSource,
  /localStorage\.getItem\(PROP_STORAGE_MACHINE_ATTACK_FRAMES\)/,
  'export must fall back to the original uploaded machine attack frame data',
);

assert.match(
  mainSource,
  /IndexedDB is the source of truth for uploaded frame sequences[\s\S]*?idleFrames\.length !== customPropMachineFrames\.length[\s\S]*?attackFrames\.length !== customPropMachineAttackFrames\.length/,
  'refresh must prefer the complete IndexedDB frame sequences over legacy localStorage fallbacks',
);

console.log('custom prop style export regression checks passed');
