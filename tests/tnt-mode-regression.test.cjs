const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const rulesPath = path.join(root, 'src', 'tntRules.ts');
const source = fs.readFileSync(rulesPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const rulesModule = new Module(rulesPath, module);
rulesModule.filename = rulesPath;
rulesModule.paths = Module._nodeModulePaths(path.dirname(rulesPath));
rulesModule._compile(compiled, rulesPath);

const { getTntBlastCellKeys, getTntThreeRowBlastCellKeys, isTntBlock, resolveTntBlast } = rulesModule.exports;

assert.equal(isTntBlock({ propType: 'tnt', length: 1 }), true, 'TNT must be a 1x1 special block');
assert.equal(isTntBlock({ propType: 'tnt', length: 2 }), false, 'TNT must not be a multi-cell prop');

assert.deepEqual(
  [...getTntBlastCellKeys(0, 0, 4, 4)].sort(),
  ['0:0', '0:1', '1:0', '1:1'],
  'corner TNT blasts should be clipped to the board',
);
assert.deepEqual(
  [...getTntThreeRowBlastCellKeys(2, 5, 5)].sort(),
  ['1:0', '1:1', '1:2', '1:3', '1:4', '2:0', '2:1', '2:2', '2:3', '2:4', '3:0', '3:1', '3:2', '3:3', '3:4'],
  'three-row TNT blasts should cover the row above, current row, and row below',
);

const blocks = [
  { id: 1, row: 5, col: 5, length: 1, propType: 'tnt' },
  { id: 2, row: 4, col: 4, length: 1 },
  { id: 3, row: 6, col: 6, length: 1 },
  { id: 4, row: 5, col: 7, length: 1 },
  { id: 5, row: 6, col: 5, length: 1, propType: 'tnt' },
  { id: 6, row: 7, col: 5, length: 1 },
];

assert.deepEqual(
  new Set(resolveTntBlast(blocks, [1], 10, 10).removedIds),
  new Set([1, 2, 3, 5, 6]),
  'a detonated TNT should remove its 3x3 neighbors and chain into another TNT once',
);
assert.deepEqual(
  resolveTntBlast(blocks, [1], 10, 10).tntIds,
  [1, 5],
  'chained TNT ids should preserve detonation order',
);
assert.deepEqual(
  new Set(resolveTntBlast(blocks, [1], 10, 10, 'three-rows').removedIds),
  new Set([1, 2, 3, 4, 5, 6]),
  'three-row TNT mode should remove blocks across the three affected full rows',
);

const mainSource = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /id="btn-tnt-mode"[\s\S]*?三消TNT/, 'editor should expose a TNT mode button');
assert.match(html, /id="tnt-blast-mode-group"[\s\S]*?data-tnt-blast-mode="area-3x3"[\s\S]*?3x3[\s\S]*?data-tnt-blast-mode="three-rows"[\s\S]*?三整行/, 'editor should expose TNT blast mode buttons');
assert.match(mainSource, /let isTntMode = false;/, 'TNT mode should have explicit runtime state');
assert.match(mainSource, /tntSpawnChance:\s*10/, 'TNT mode should use a configurable default spawn chance');
assert.match(mainSource, /let pendingTntDetonationIds = new Set<number>\(\);/, 'runtime should track TNTs that must fall before chained detonation');
assert.match(mainSource, /function resolveCurrentTntBlast\([\s\S]*?pendingChainedTntIds\.add\(block\.id\)[\s\S]*?removedIds\.add\(block\.id\)[\s\S]*?pendingTntIds: \[\.\.\.pendingChainedTntIds\]/, 'current TNT blast should remove non-TNT blocks while deferring chained TNTs');
assert.match(mainSource, /TNT_PRE_EXPLOSION_FRAME_COUNT = 30/, 'TNT should preload the pre-explosion effect frames');
assert.match(mainSource, /function playTntPreExplosionEffect\([\s\S]*?TNT_PRE_EXPLOSION_ALIASES[\s\S]*?loop = true/, 'TNT should show a pre-explosion effect while shaking');
assert.match(mainSource, /const TNT_PRE_EXPLOSION_SECONDS = 0\.8;/, 'TNT pre-explosion shake should last 0.8s');
assert.doesNotMatch(mainSource, /playTntGlowEffect|destroyTntGlow|TNT_GLOW_TEXTURE_URL|tnt-glow-image-slot/, 'TNT should not add an extra glow layer or glow upload controls');
assert.match(mainSource, /function playTntSound\(\)[\s\S]*?cloneNode\(true\)[\s\S]*?createMediaElementSource\(audio\)[\s\S]*?node\.connect\(recAudioDest\)[\s\S]*?audio\.play\(\)/, 'TNT sound should use a cloned audio instance and route it into the recording track');
assert.doesNotMatch(mainSource, /tl\.call\(\(\) => \{\s*playTntSound\(\);[\s\S]*?playTntPreExplosionEffect\(block, TNT_PRE_EXPLOSION_SECONDS\);/, 'TNT sound should not start when the pre-explosion shake begins');
assert.match(mainSource, /tl\.call\(\(\) => \{[\s\S]*?playTntSound\(\);[\s\S]*?playTntBurstWave\(block\);[\s\S]*?playTntExplosionEffect\(block\);[\s\S]*?\}, \[\], at \+ TNT_PRE_EXPLOSION_SECONDS\);/, 'TNT sound should start when the bomb bursts');
assert.match(mainSource, /scheduleTntDetonation\([\s\S]*?let baseScaleX = sprite\.scale\.x[\s\S]*?sprite\.texture = getTntArmedTexture\(\);[\s\S]*?baseScaleX = sprite\.scale\.x[\s\S]*?playTntPreExplosionEffect\(block, TNT_PRE_EXPLOSION_SECONDS\)[\s\S]*?x: \(\) => baseScaleX \* 1\.35[\s\S]*?duration: TNT_PRE_EXPLOSION_SECONDS[\s\S]*?at \+ TNT_PRE_EXPLOSION_SECONDS[\s\S]*?x: \(\) => baseScaleX \* 2\.5/, 'TNT should scale relative to its fitted armed 1-cell size, shake at about 1.35 cells, then burst to about 2.5 cells');
assert.match(mainSource, /function playTntExplosionEffect\([\s\S]*?PARAMS\.cellSize \* 6/, 'TNT explosion GIF should cover about six cells around the blast cell');
assert.match(mainSource, /const textures = TNT_EXPLOSION_ALIASES[\s\S]*?PIXI\.Assets\.get\(alias\)/, 'TNT explosion should use the default explosion frame sequence');
assert.doesNotMatch(mainSource, /customTntExplosionTextures|TNT_STORAGE_EXPLOSION_FRAMES|applyTntExplosionFiles/, 'TNT UI uploads should not override the explosion sequence');
assert.match(mainSource, /if \(textures\.length === 1\)[\s\S]*?new PIXI\.Sprite\(textures\[0\]\)[\s\S]*?sprite\.width = PARAMS\.cellSize \* 6[\s\S]*?sprite\.zIndex = 20006/, 'single uploaded TNT explosion image should render visibly above the bomb');
assert.match(mainSource, /const anim = new PIXI\.AnimatedSprite\(textures\)[\s\S]*?anim\.width = PARAMS\.cellSize \* 6[\s\S]*?anim\.zIndex = 20006/, 'animated TNT explosion should render above the bomb and shatter layers');
assert.match(mainSource, /function getTntDetonationStartTimes\(tntIds: number\[\], initialTntIds: Set<number>\)[\s\S]*?initialTntIds\.has\(id\)[\s\S]*?startTimes\.set\(id, 0\)[\s\S]*?chainIndex \* TNT_PRE_EXPLOSION_SECONDS/, 'initial row TNT should detonate together while chained TNT starts sequentially');
assert.match(mainSource, /const initialDetonatingTntIds = new Set\(\[\.\.\.blocksToRemove, \.\.\.pendingTntBlocks\]\.filter\(block => isTntBlock\(block\)\)\.map\(block => block\.id\)\);[\s\S]*?getTntDetonationStartTimes\(tntBlast\.tntIds, initialDetonatingTntIds\)/, 'TNT timing should detonate only row-cleared or post-fall pending TNTs in the current wave');
assert.match(mainSource, /const blastAt = detonatingTntIds\.size > 0 \? \(tntBlastRemovalTimes\.get\(block\.id\) \?\? TNT_PRE_EXPLOSION_SECONDS\) : 0;/, 'TNT blast removals should wait for the relevant TNT explosion time');
assert.match(mainSource, /const initialRemovedBlockIds = new Set\(blocksToRemove\.map\(block => block\.id\)\);[\s\S]*?tntBlastIdSet\.has\(b\.id\) && !initialRemovedBlockIds\.has\(b\.id\)/, 'row-cleared blocks should keep normal row timing even when a TNT in that row also blasts them');
assert.match(mainSource, /resolveCurrentTntBlast\([\s\S]*?blocksToRemove,[\s\S]*?pendingTntBlocks,[\s\S]*?tntBlastMode[\s\S]*?\);[\s\S]*?tntBlast\.pendingTntIds\.forEach\(id => pendingTntDetonationIds\.add\(id\)\);/, 'elimination should pass the selected TNT blast mode and defer chained TNTs until after gravity');
assert.match(mainSource, /const tntThreeRowComboRows = tntBlastMode === 'three-rows' && detonatingTntIds\.size > 0[\s\S]*?new Set\(expandedBlocksToRemove\.map\(block => block\.row\)\)\.size[\s\S]*?const comboIncrement = Math\.max\(1, tntThreeRowComboRows \|\| fullRows\.length\);[\s\S]*?comboCount \+= comboIncrement;/, 'three-row TNT blasts should add combo by the blasted row count');
assert.match(mainSource, /getTntBlastRemovalTimes\([\s\S]*?mode: TntBlastMode[\s\S]*?getTntBlastCells\(tnt\.row, tnt\.col, PARAMS\.totalRows, PARAMS\.gridCols, mode\)[\s\S]*?Math\.min\(previous, blastAt\)/, 'overlapping non-TNT blast blocks should be removed by the earliest TNT explosion in the selected mode');
assert.match(mainSource, /const shouldSyncTntThreeRowShatter = tntBlastMode === 'three-rows' && detonatingTntIds\.size > 0;[\s\S]*?const tntRowShatterTimes = new Map<number, number>\(\);[\s\S]*?if \(shouldSyncTntThreeRowShatter\)[\s\S]*?tntBlastRemovalTimes\.get\(block\.id\)[\s\S]*?tntRowShatterTimes\.set\(block\.row[\s\S]*?tntRowShatterTimes\.forEach\(\(blastAt, row\)[\s\S]*?playClearAudioAtShatter\(\);[\s\S]*?playRowShatterEffect\(row, explosionColor, rowBlocks, propSkipCols\)/, 'three-row TNT mode should play full-row shatter at the TNT blast time');
assert.match(mainSource, /const originalTntVisualDelay = detonatingTntIds\.size > 0 && tntBlastIdSet\.has\(b\.id\)[\s\S]*?Math\.max\(rowPlaybackOffset \+ delay[\s\S]*?: rowPlaybackOffset \+ delay;[\s\S]*?const tntRowShatterAt = shouldSyncTntThreeRowShatter \? tntRowShatterTimes\.get\(b\.row\) : undefined;[\s\S]*?const visualDelay = tntRowShatterAt !== undefined \? tntRowShatterAt \+ delay : originalTntVisualDelay;/, '3x3 TNT should keep the original timing while three-row mode removes row blocks with the selected shatter spread');
assert.match(mainSource, /const getBlockShatterDelay = \(block: Block\) => \{[\s\S]*?PARAMS\.shatterMode[\s\S]*?return Math\.max\(0, dist\) \* staggerPerCell;[\s\S]*?const blastVisualDelay = tntRowShatterAt !== undefined[\s\S]*?\? tntRowShatterAt \+ getBlockShatterDelay\(block\)[\s\S]*?: blastAt;[\s\S]*?tl\.to\(block\.sprite\.scale[\s\S]*?blastVisualDelay/, 'three-row TNT blast blocks should disappear with the shatter wave instead of all at once');
assert.match(mainSource, /if \(!shouldSyncTntThreeRowShatter && PARAMS\.effectType !== 'gem-shatter'\)[\s\S]*?const tntExtraShatterGroups = new Map[\s\S]*?group\.cols\.add\(block\.col \+ offset\)[\s\S]*?playRowShatterEffect\(group\.row, explosionColor, group\.blocks, new Set\(\), group\.cols\)/, '3x3 TNT extra blast blocks should play localized shatter for their affected cells');
assert.match(mainSource, /function seedTntBlocksOnCurrentBoard\(\)[\s\S]*?Math\.max\(1,[\s\S]*?convertBlockToTnt/, 'turning on TNT mode should convert existing 1x1 blocks immediately');
assert.match(mainSource, /btnTntMode\.onclick[\s\S]*?seedTntBlocksOnCurrentBoard\(\);/, 'TNT mode button should visibly seed the current board');
assert.match(mainSource, /const TNT_STORAGE_IMAGE = 'custom_tnt_image_b64';/, 'custom TNT image should persist locally');
assert.match(mainSource, /const TNT_STORAGE_ARMED_IMAGE = 'custom_tnt_armed_image_b64';/, 'custom TNT armed image should persist locally');
assert.match(mainSource, /let tntBlastMode: TntBlastMode = 'area-3x3';[\s\S]*?const TNT_STORAGE_BLAST_MODE = 'tnt_blast_mode';/, 'TNT blast mode should default to 3x3 and persist locally');
assert.match(mainSource, /const saveData = \{[\s\S]*?modes: \{[\s\S]*?isTntMode,[\s\S]*?tntBlastMode,[\s\S]*?\}[\s\S]*?\};[\s\S]*?try \{[\s\S]*?localStorage\.setItem\(`blockPuzzleDemoScript_\$\{name\}`[\s\S]*?alert\(`成功保存演示剧本：\$\{name\}`\);[\s\S]*?catch \(error\)[\s\S]*?保存演示剧本失败/, 'demo script saves should persist TNT mode state and report success or storage failures clearly');
assert.match(mainSource, /isTntMode = !!modes\.isTntMode;[\s\S]*?if \(modes\.tntBlastMode === 'three-rows' \|\| modes\.tntBlastMode === 'area-3x3'\)[\s\S]*?tntBlastMode = modes\.tntBlastMode;[\s\S]*?localStorage\.setItem\(TNT_STORAGE_BLAST_MODE, tntBlastMode\)/, 'demo script loads should restore TNT blast mode state');
assert.match(mainSource, /id='tnt-image-slot'[\s\S]*?id='tnt-armed-slot'[\s\S]*?id='input-tnt-image'[\s\S]*?id='input-tnt-armed-image'[\s\S]*?id='btn-clear-tnt-image'[\s\S]*?id='btn-clear-tnt-armed'/, 'style panel should expose TNT bomb and armed-state upload controls');
assert.match(mainSource, /TNT 炸弹贴图[\s\S]*?grid-template-columns:1fr 1fr[\s\S]*?炸弹[\s\S]*?未引爆[\s\S]*?引爆[\s\S]*?开始晃动/, 'TNT upload should show left idle bomb and right armed-shake bomb cards');
assert.match(mainSource, /id='prop-eat-slot'[\s\S]*?id='toggle-obstacle-eater'[\s\S]*?id='btn-clear-prop-style'[\s\S]*?TNT 炸弹贴图/, 'obstacle options should stay with the obstacle upload section above TNT options');
assert.match(mainSource, /querySelectorAll<HTMLButtonElement>\('\.tnt-blast-mode-btn'\)[\s\S]*?localStorage\.setItem\(TNT_STORAGE_BLAST_MODE, tntBlastMode\)/, 'TNT blast mode buttons should update UI state and localStorage');
assert.match(mainSource, /function applyTntImageFile\([\s\S]*?localStorage\.setItem\(TNT_STORAGE_IMAGE[\s\S]*?refreshTntBlockTextures/, 'uploaded TNT images should refresh existing TNT blocks');
assert.match(mainSource, /function getImagePixelBounds\([\s\S]*?alpha <= alphaThreshold[\s\S]*?function trimTransparentImageDataUrl\([\s\S]*?getImagePixelBounds\(ctx, canvas\.width, canvas\.height, 8\)[\s\S]*?cropCanvasToDataUrl/, 'uploaded TNT armed image should have transparent padding trim support');
assert.match(mainSource, /function normalizeTntArmedImageDataUrl\([\s\S]*?customTntImage[\s\S]*?getImagePixelBounds\(idleCtx[\s\S]*?180\)[\s\S]*?getImagePixelBounds\(armedCtx[\s\S]*?180\)[\s\S]*?idleBody\.minX[\s\S]*?armedBody\.minX/, 'uploaded TNT armed image should normalize its opaque bomb body against the idle bomb body');
assert.match(mainSource, /function applyTntArmedImageFile\([\s\S]*?normalizeTntArmedImageDataUrl\(dataUrl\)[\s\S]*?localStorage\.setItem\(TNT_STORAGE_ARMED_IMAGE, normalizedDataUrl\)[\s\S]*?refreshPropStylePanel/, 'uploaded TNT armed image should save the normalized image and refresh the style panel');
assert.match(mainSource, /function restoreCustomTntArmedImage\([\s\S]*?normalizeTntArmedImageDataUrl\(stored\)[\s\S]*?localStorage\.setItem\(TNT_STORAGE_ARMED_IMAGE, normalizedStored\)/, 'stored TNT armed images should be migrated to idle-matched bounds');
assert.match(mainSource, /sprite\.texture = getTntArmedTexture\(\);[\s\S]*?playTntPreExplosionEffect\(block, TNT_PRE_EXPLOSION_SECONDS\)/, 'TNT should switch to the armed image when shaking starts');
assert.match(mainSource, /blocksContainer\.sortableChildren = true;/, 'block container should sort zIndex for top-layer effects');
assert.match(mainSource, /let tntEffectsContainer: PIXI\.Container;/, 'TNT should have a dedicated top-layer container');
assert.match(mainSource, /tntEffectsContainer = new PIXI\.Container\(\);[\s\S]*?tntEffectsContainer\.zIndex = 100000[\s\S]*?worldContainer\.addChild\(tntEffectsContainer\)/, 'TNT effects container should sit above board and shatter layers');
assert.match(mainSource, /if \(sprite\.parent !== tntEffectsContainer\) tntEffectsContainer\.addChild\(sprite\);/, 'detonating TNT sprites should move to the TNT top layer');
assert.match(mainSource, /tntEffectsContainer\.addChild\(anim\)/, 'TNT animation effects should render in the top layer');
assert.match(mainSource, /if \(b\.sprite\.parent\) b\.sprite\.parent\.removeChild\(b\.sprite\);/, 'removed TNT sprites should be cleaned up from their actual parent layer');
assert.match(mainSource, /function playTntBurstWave[\s\S]*?wave\.circle[\s\S]*?scale[\s\S]*?1\.8/, 'TNT burst should add a compact center-out impact wave');
assert.match(mainSource, /tntBlastRemovalTimes\.get\(block\.id\)[\s\S]*?tl\.to\(block\.sprite\.scale, \{ y: 0[\s\S]*?tl\.to\(block\.sprite, \{ alpha: 0/, 'TNT extra blast blocks should wait for the blast, shatter, and shrink away');
assert.match(mainSource, /function scheduleTntDetonation[\s\S]*?sprite\.zIndex = 20003[\s\S]*?sprite\.zIndex = 20004/, 'detonating TNT should stay above shatter and explosion effects');
assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'sounds', 'tnt-explosion.mp3')), 'TNT explosion sound should be bundled');
assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'tnt', 'explosion-frames', 'frame-00.png')), 'transparent explosion frame sequence should be bundled');
assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'tnt', 'pre-explosion-frames', 'frame-00.png')), 'transparent pre-explosion frame sequence should be bundled');

console.log('tnt mode regression checks passed');
