const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');

test('multi collectible mode exposes independent controls and top header HUD', () => {
  assert.match(html, /id="btn-multi-collect-mode"/);
  assert.match(html, /id="input-multi-collectible-mode"/);
  assert.match(html, /id="select-multi-collectible-count"/);
  assert.match(html, /id="multi-collectible-slots"/);
  assert.match(html, /id="multi-collectible-hud"/);
  assert.match(html, /id="collectible-manager-section"/);

  assert.match(css, /#multi-collectible-hud\s*\{[\s\S]*?position:\s*static/);
  assert.match(css, /#multi-collectible-hud\s*\{[\s\S]*?flex-direction:\s*row/);
  assert.match(css, /\.multi-collectible-target\s*\{[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /\.multi-collectible-target-count/);
  assert.match(css, /\.multi-collectible-upload/);
  assert.match(source, /const collectibleManagerSection = document\.getElementById\('collectible-manager-section'\)/);
  assert.match(source, /panel\.appendChild\(collectibleManagerSection\)/);
});

test('multi collectible mode persists item identity through blocks and saves', () => {
  assert.match(source, /collectibleId\?: string/);
  assert.match(source, /multiCollectibleSlotIds/);
  assert.match(source, /function getNextMultiCollectibleItem\(\)/);
  assert.match(source, /function renderMultiCollectibleHud\(\)/);
  assert.match(source, /function refreshExistingMultiCollectibleBlocks\(\)/);
  assert.match(source, /function normalizeMultiCollectibleSlotIds\(\)/);
  assert.match(source, /header\.appendChild\(hud\)/);
  assert.match(source, /uploadBtn\.textContent = '上传'/);
  assert.match(source, /const newId = await collectibleDB\.addCollectible\(cleanName, base64\)/);
  assert.match(source, /collectibleId: block\.collectibleId/);
  assert.match(source, /collectibleId: b\.collectibleId/);
  assert.match(source, /spawnBlock\(sb\.col, sb\.row, sb\.length, sb\.color, sb\.id, sb\.noGravity, sb\.isCollectible, sb\.isProp, sb\.propType, sb\.propDir \|\| 'left', sb\.collectibleId\)/);
});

test('changing multi collectible slots refreshes existing collectible blocks', () => {
  assert.match(source, /const item = getNextMultiCollectibleItem\(\);[\s\S]*?spawnBlock\(col, row, length, color, id, noGravity, true, false, undefined, 'left', item\?\.id\)/);
  assert.match(source, /select\.addEventListener\('change', async \(\) => \{[\s\S]*?await rebuildMultiCollectibleItems\(\);[\s\S]*?refreshExistingMultiCollectibleBlocks\(\);/);
  assert.match(source, /countSelect\?\.addEventListener\('change', async \(\) => \{[\s\S]*?await rebuildMultiCollectibleItems\(\);[\s\S]*?refreshExistingMultiCollectibleBlocks\(\);/);
  assert.match(source, /async function rebuildMultiCollectibleItems\(\) \{[\s\S]*?normalizeMultiCollectibleSlotIds\(\);[\s\S]*?const selectedIds = multiCollectibleSlotIds\.slice/);
});

test('multi collectible flight targets matching left-side collectible', () => {
  const flyStart = source.indexOf('function playCollectibleFlyAnimation(b: Block)');
  assert.notEqual(flyStart, -1);
  const flyEnd = source.indexOf('function deactivateCollectMode()', flyStart);
  assert.notEqual(flyEnd, -1);
  const flyBody = source.slice(flyStart, flyEnd);

  assert.match(flyBody, /getMultiCollectibleItem\(b\.collectibleId\)/);
  assert.match(flyBody, /\.multi-collectible-target/);
  assert.match(flyBody, /dataset\.multiCollectibleId === multiItem\.id/);
  assert.match(flyBody, /multiItem\.count\+\+/);
  assert.match(flyBody, /syncMultiCollectibleHudCounts\(\)/);
});

test('single collectible and multi collectible modes stay mutually exclusive', () => {
  assert.match(source, /const btnMultiCollectMode = document\.getElementById\('btn-multi-collect-mode'\)!/);
  assert.match(source, /setBtnActive\(btnCollectMode, isCollectMode && !multiCollectibleModeEnabled\)/);
  assert.match(source, /setBtnActive\(btnMultiCollectMode, isCollectMode && multiCollectibleModeEnabled\)/);
  assert.match(source, /btnCollectMode\.onclick = async \(\) => \{[\s\S]*?multiCollectibleModeEnabled = false/);
  assert.match(source, /btnMultiCollectMode\.onclick = async \(\) => \{[\s\S]*?multiCollectibleModeEnabled = true/);
  assert.match(source, /function getCollectionAvatarTargetElement\(\): HTMLElement \| null \{[\s\S]*?if \(multiCollectibleModeEnabled\) return null/);
});

test('recording renders the multi collectible header instead of single collect fallback', () => {
  assert.match(source, /function drawRecordingMultiCollectibleHud\(/);
  assert.match(source, /document\.querySelectorAll<HTMLElement>\('\.multi-collectible-target'\)/);
  assert.match(source, /drawRecordingMultiCollectibleHud\([\s\S]*?if \(!didDrawMultiCollectibleHud\) \{/);
  assert.match(source, /multiCollectibleItems\.forEach\(\(item, index\) => \{/);
});
