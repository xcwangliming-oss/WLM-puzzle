const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const rulesPath = path.join(__dirname, '..', 'src', 'playbackRowRules.ts');
const source = fs.readFileSync(rulesPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const moduleShim = { exports: {} };
new Function('module', 'exports', 'require', compiled)(moduleShim, moduleShim.exports, require);

const { getTriggeredVisibleFullRows } = moduleShim.exports;

assert.deepEqual(
  getTriggeredVisibleFullRows([12], [12]),
  [],
  'a pending offscreen row must not trigger when it merely enters the viewport'
);

assert.deepEqual(
  getTriggeredVisibleFullRows([12, 13], [12]),
  [12, 13],
  'a newly completed visible row should clear together with an already visible pending row'
);

assert.deepEqual(
  getTriggeredVisibleFullRows([13], [12]),
  [13],
  'a pending row that is still offscreen must not clear with a visible trigger'
);

assert.deepEqual(
  getTriggeredVisibleFullRows([12, 13, 14], [12], [14]),
  [12, 14],
  'recorded playback should use only its eligible visible trigger and visible pending rows'
);

console.log('playback row trigger rules passed');
