const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

test('shatter effect performance optimization and pacing verification', () => {
  const code = fs.readFileSync('src/main.ts', 'utf8');

  // 1. Verify defaultShatterColorParams and getDefaultShatterColorFilter are defined
  assert.ok(code.includes('const defaultShatterColorParams'), 'defaultShatterColorParams must be defined');
  assert.ok(code.includes('defaultShatterColorParams: Record<string, { hue: number; saturate: number }> = {'), 'defaultShatterColorParams signature correct');
  assert.ok(code.includes('function getDefaultShatterColorFilter(cellColor: string): PIXI.ColorMatrixFilter | null'), 'getDefaultShatterColorFilter helper defined');

  // 2. Verify pink / zero-adjustment returns null to eliminate identity FBO passes
  assert.ok(code.includes('params.hue === 0 && params.saturate === 0'), 'zero hue/saturate checks must return null filter');

  // 3. Verify rowEffectContainer groups row cells for single FBO pass
  assert.ok(code.includes('const rowEffectContainer = new PIXI.Container();'), 'rowEffectContainer must group row cells');
  assert.ok(code.includes('rowEffectContainer.filters = [rowFilter];'), 'filter applied once to row container when single color');

  // 4. Verify cleanup when remaining cells complete
  assert.ok(code.includes('remainingCells--;'), 'remainingCells decremented on each complete');
  assert.ok(code.includes('if (remainingCells <= 0)'), 'rowEffectContainer cleaned up when all cells complete');

  // 5. Verify rowPlaybackGap is optimized from 0.8s down to 0.22s for smooth cascading
  assert.ok(code.includes('PARAMS.rowClearOrder === \'bottom-up\' ? 0.22 : 0'), 'rowPlaybackGap must be 0.22s to prevent 800ms dead pause');
  assert.ok(!code.includes('PARAMS.rowClearOrder === \'bottom-up\' ? 0.8 : 0'), 'old 0.8s gap must be removed');
});
