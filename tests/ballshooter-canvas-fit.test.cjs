const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/boardCanvasFit.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', compiled)(mod, mod.exports);
const { fitCompleteBoard } = mod.exports;
const portraitBoard = { x: 39, y: 160, w: 642, h: 1088 };
const portraitFit = fitCompleteBoard(portraitBoard, 500, 850);
assert.ok(Math.abs(portraitFit.w - portraitBoard.w) < 2.1, '17 square rows fit the fixed 720x1280 template without visible side bands');
const main = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
assert.doesNotMatch(main, /fitBallShooterFrame|const masterHeight =/, 'grid dimensions must not change portrait or recording aspect');
assert.match(main, /container\.clientWidth \* 0\.98, container\.clientHeight \* 0\.98 \* 9 \/ 16/, 'width constraints must reduce height as well to preserve 9:16');
const clip = { x: 17, y: 30, w: 539, h: 970 };
// Actual failing canvas: width-only CSS fitting expanded its height to 1078px.
const ten = fitCompleteBoard(clip, 470, 940);
assert.equal(ten.h, 970);
assert.equal(ten.w, 485);
assert.equal(ten.x, 44);
for (const rows of [17, 19, 20]) {
for (const cols of [4, 9, 10, 11, 12, 30]) {
  const height = rows * 50;
  const fitted = fitCompleteBoard(clip, cols * 50, height);
  const scale = fitted.h / height;
  assert.ok(Math.abs(fitted.w / (cols * 50) - scale) < 1e-9, 'single cells remain square');
  assert.ok(Math.abs(fitted.x + fitted.w / 2 - (clip.x + clip.w / 2)) < 1e-9, 'board stays centered');
  assert.ok(fitted.x >= clip.x - 1e-9 && fitted.y >= clip.y - 1e-9);
  assert.ok(fitted.x + fitted.w <= clip.x + clip.w + 1e-9);
  assert.ok(fitted.y + fitted.h <= clip.y + clip.h + 1e-9);
  assert.ok(Math.abs(fitted.y + fitted.h - (clip.y + clip.h)) < 1e-9, 'launcher stays at bottom');
  assert.ok(fitted.y + (height - 64) * scale >= clip.y, 'entire cannon stays visible');
}
}
console.log('Ball Shooter fixed-portrait square-cell fitting passed (17/19/20 rows, 4/9/10/11/12/30 columns)');
