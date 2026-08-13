const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const start = source.indexOf('function generateRandomLayout() {');
const end = source.indexOf('function pickColorForCurrentMode', start);
const generatorSource = source.slice(start, end);
const generateFromHolesStart = source.indexOf('function generateFromHoles() {');
const generateFromHolesEnd = source.indexOf('function preventFullRows()', generateFromHolesStart);
const generateFromHolesSource = source.slice(generateFromHolesStart, generateFromHolesEnd);

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
assert.match(
  source,
  /btnRandom\.onclick = \(\) => \{[\s\S]*?generateRandomLayout\(\);[\s\S]*?settleLayoutWithoutEliminations\(\);/,
  'random layout button should settle and break full rows after generation'
);
assert.match(
  source,
  /function buildGeneratedLayoutMaskFromTemplate\(mask: boolean\[\]\[\]\)/,
  'drawn layout template expansion helper should exist'
);
assert.match(
  source,
  /function getPaintedLayoutTemplateRows\(mask: boolean\[\]\[\]\): \{ rowIndex: number; cells: boolean\[\] \}\[\]/,
  'drawn layout template rows should be extracted from painted rows'
);
assert.match(
  source,
  /for \(let r = lastTemplateRow \+ 1; r < PARAMS\.totalRows; r\+\+\)/,
  'drawn layout template should only repeat below the painted rows'
);
assert.match(
  generateFromHolesSource,
  /const generatedLayoutMask = buildGeneratedLayoutMaskFromTemplate\(layoutDrawMask\);/,
  'generate-from-drawing should expand the painted template before spawning'
);
assert.match(
  generateFromHolesSource,
  /getValidPartitions\(remaining, c, r, generatedLayoutMask\)/,
  'generate-from-drawing should use the expanded mask for support-aware partitions'
);
assert.doesNotMatch(
  generateFromHolesSource,
  /Fallback for floating\/unsupported shapes/,
  'generate-from-drawing should not create unsupported fallback blocks'
);
assert.match(
  generateFromHolesSource,
  /c = endCol \+ 1;[\s\S]*?continue;/,
  'generate-from-drawing should skip unsupported segments instead of making floating blocks'
);

console.log('random layout rules regression checks passed');
