const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const start = source.indexOf('function generateRandomLayout() {');
const end = source.indexOf('function pickColorForCurrentMode', start);
const generatorSource = source.slice(start, end);

assert.notEqual(start, -1, 'random layout generator should exist');
assert.notEqual(end, -1, 'next generator helper should exist');
assert.match(
  source,
  /const RANDOM_LAYOUT_TOP_EMPTY_ROWS = 3;/,
  'random layout should leave exactly three top rows empty by default'
);
assert.match(
  generatorSource,
  /const startRow = Math\.min\(PARAMS\.totalRows, RANDOM_LAYOUT_TOP_EMPTY_ROWS\);/,
  'random layout should start filling after the configured top empty rows'
);
assert.match(
  generatorSource,
  /const maxFilledCellsInRow = Math\.max\(0, validCellsInRow - 1\);/,
  'random layout should reserve at least one playable cell per generated row'
);
assert.match(
  generatorSource,
  /const remainingFillSlots = maxFilledCellsInRow - filledCellsInRow;/,
  'random layout should track remaining safe fill slots per row'
);
assert.match(
  generatorSource,
  /weightedRandomLength\(Math\.min\(4, Math\.min\(maxLen, remaining, remainingFillSlots\)\)\)/,
  'random layout should cap block length so it cannot complete a full row'
);
assert.match(
  generatorSource,
  /filledCellsInRow \+= len;/,
  'random layout should update row fill count only after spawning a block'
);

console.log('random layout rules regression checks passed');
