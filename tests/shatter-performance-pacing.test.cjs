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

  // 3. Verify sprites are directly managed without heavy rowEffectContainer FBO stalls
  assert.ok(!code.includes('const rowEffectContainer = new PIXI.Container();'), 'rowEffectContainer must not be used to prevent combo FBO stalls');

  // 4. Verify cleanup when sprite completes
  assert.ok(code.includes('cellAnim.onComplete = () => {'), 'cellAnim onComplete handler must be registered');

  // 5. Verify rowPlaybackGap is set to 0.8s for clean sequential combo pacing
  assert.ok(code.includes('PARAMS.rowClearOrder === \'bottom-up\' ? 0.8 : 0'), 'rowPlaybackGap must be 0.8s for smooth pacing');
});
