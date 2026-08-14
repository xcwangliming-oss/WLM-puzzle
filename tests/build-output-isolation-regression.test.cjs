const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = fs.readFileSync(path.join(__dirname, '..', 'vite.config.ts'), 'utf8');

assert.match(
  config,
  /build:\s*\{[\s\S]*?outDir:\s*['"]dist['"]/,
  'the recovered editor must build into its own dist directory',
);
assert.doesNotMatch(
  config,
  /outDir:[^\n]*(?:个人Blog|playables[\\/]block-puzzle|\.\.[\\/])/,
  'the recovered editor build must not target another project',
);

console.log('build output isolation regression checks passed');
