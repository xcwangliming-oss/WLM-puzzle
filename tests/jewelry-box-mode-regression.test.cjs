const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');

// 1. DOM and CSS UI verification
assert.match(
  htmlSource,
  /id="jewelry-score-hud"[\s\S]*?id="jewelry-target-1"[\s\S]*?id="jewelry-header-icon"[\s\S]*?class="jewelry-score-x">[Xx]<\/span>[\s\S]*?id="jewelry-collect-val"[\s\S]*?id="jewelry-target-2"[\s\S]*?id="jewelry-header-icon-2"[\s\S]*?class="jewelry-score-x">[Xx]<\/span>[\s\S]*?id="jewelry-collect-val-2"/,
  'top header must include dual collectible targets with X separator for pearl and diamond'
);

assert.match(
  cssSource,
  /\.jewelry-score-hud[\s\S]*?\.jewelry-header-icon[\s\S]*?\.jewelry-score-x[\s\S]*?\.jewelry-fly-img/,
  'style.css must contain styles for jewelry HUD, X separator, and flying gem particle animation'
);

assert.match(
  cssSource,
  /#board-wrapper\.jewelry-box-live \.collect-score-hud\s*\{[\s\S]*?align-items:\s*flex-start;[\s\S]*?text-align:\s*left;/,
  'score HUD in jewelry box mode must be left-aligned'
);

// 2. Editor Panel & Upload Controls
assert.match(
  mainSource,
  /id = 'jewelry-box-section'[\s\S]*?toggle-jewelry-box-mode[\s\S]*?jewelry-box-asset-grid[\s\S]*?btn-clear-jewelry-assets/,
  'style assets panel must include jewelry box configuration section with toggle, grid, and clear button'
);

// 3. Asset keys and procedural generation
assert.match(
  mainSource,
  /type JewelryBoxAssetKey = '1-closed' \| '1-open' \| '2-closed' \| '2-open' \| 'gem' \| 'gem-1' \| 'gem-2'/,
  'jewelry box assets must support 1x1 closed/open, 1x2 closed/open, gem-1 pearl, and gem-2 diamond'
);

assert.match(
  mainSource,
  /const JEWELRY_BOX_ASSET_KEYS: JewelryBoxAssetKey\[\] = \['1-closed', '1-open', 'gem-1', '2-closed', '2-open', 'gem-2'\];/,
  'jewelry box upload panel must register 6 asset keys in order'
);

assert.match(
  mainSource,
  /headerItemEl\.innerHTML = `<span class="collect-score-hud"><span class="collect-score-label">SCORE<\/span><span id="score-val" class="collect-score-value">\$\{currentScore\.toLocaleString\(\)\}<\/span><\/span><span id="level-val" style="display:none;">\$\{currentLevel\}<\/span>`;/,
  'jewelry box mode must position SCORE on the left and hide LEVEL in header'
);

assert.match(
  mainSource,
  /const targetId = is1x1 \? 'jewelry-target-1' : 'jewelry-target-2';/,
  'flight animation must route 1x1 pearls to target 1 and 1x2 diamonds to target 2'
);

assert.match(
  mainSource,
  /function generateProceduralJewelryDataUrl[\s\S]*?drawJewelryRoundRect[\s\S]*?drawJewelryClasp[\s\S]*?drawJewelryGemInside/,
  'procedural jewelry generator must render velvet box, gold clasp, and brilliant cut gem'
);

// 4. Block Candidate & Spawn Handling
assert.match(
  mainSource,
  /function isJewelryBoxCandidate\(block: Pick<Block, 'length' \| 'isProp' \| 'isCollectible'>\): boolean \{[\s\S]*?\(block\.length === 1 \|\| block\.length === 2\) && !block\.isProp && !block\.isCollectible/,
  'only 1x1 and 1x2 non-prop non-collectible blocks can be jewelry boxes'
);

assert.match(
  mainSource,
  /function spawnBlock\([\s\S]*?isJewelryBox\?: boolean, jewelryBoxState\?: 'closed' \| 'open'\) \{[\s\S]*?resolvedIsJewelryBox[\s\S]*?getJewelryBoxTexture\(length, resolvedJewelryBoxState/,
  'spawnBlock must resolve jewelry box textures and attach jewelry box properties'
);

// 5. Two-stage Elimination: 1st clear intercepts removal, advances to open
assert.match(
  mainSource,
  /getJewelryBoxBlocksForConfirmedClear\(blocksToRemove\)[\s\S]*?const blocksToPhysicallyRemove = blocksToRemove\.filter\(b => !b\.pastureStage \|\| b\.pastureStage === 'sheep'\)\.filter\(b => !b\.isJewelryBox \|\| b\.jewelryBoxState === 'open'\)/,
  'checkEliminations must keep closed jewelry boxes on the board by filtering them out of blocksToPhysicallyRemove'
);

assert.match(
  mainSource,
  /if \(b\.isJewelryBox && b\.jewelryBoxState !== 'open'\) \{[\s\S]*?tl\.call\(\(\) => \{ advanceJewelryBox\(b\); \}, \[\], rowPlaybackOffset\)[\s\S]*?return;/,
  'the 1st clear on timeline must advance jewelry box to open and return early without shrinking'
);

// 6. Two-stage Elimination: 2nd clear flies to HUD and removes box
assert.match(
  mainSource,
  /if \(b\.isJewelryBox && b\.jewelryBoxState === 'open'\) \{[\s\S]*?tl\.call\(\(\) => \{[\s\S]*?playJewelryBoxFlyAnimation\(b\);[\s\S]*?\}, \[\], rowPlaybackOffset \+ delay\);[\s\S]*?\}/,
  'the 2nd clear on timeline must trigger jewelry fly animation and remove the open box'
);

// 7. Instant Physics Support (Editor and Script Playback)
assert.match(
  mainSource,
  /function runPhysicsInstant\(\)[\s\S]*?const jewelryBoxBlocks = getJewelryBoxBlocksForConfirmedClear\(rowBlocks\)[\s\S]*?jewelryBoxBlocks\.forEach\(block => advanceJewelryBox\(block\)\)/,
  'runPhysicsInstant must advance closed jewelry boxes when full rows clear'
);

// 8. AI Simulation (SimBlock and simulateSimMove)
assert.match(
  mainSource,
  /interface SimBlock \{[\s\S]*?isJewelryBox\?: boolean;[\s\S]*?jewelryBoxState\?: 'closed' \| 'open';/,
  'SimBlock interface must carry jewelry box state'
);

assert.match(
  mainSource,
  /function checkSimEliminations\(simBlocks: SimBlock\[\]\): number\[\] \{[\s\S]*?if \(isJewelryBoxMode\) \{[\s\S]*?b\.isJewelryBox = true;[\s\S]*?b\.jewelryBoxState = 'open';/,
  'checkSimEliminations must advance jewelry box state during auto-play simulation'
);

assert.match(
  mainSource,
  /const jewelryBoxStatesBeforeClear = new Map\(simBlocks\.map\(b => \[b\.id, b\.jewelryBoxState\]\)\)[\s\S]*?const retainedJewelryBox = \(isJewelryBoxMode \|\| b\.isJewelryBox\)[\s\S]*?jewelryBoxStatesBeforeClear\.get\(b\.id\) !== 'open'[\s\S]*?!retainedJewelryBox/,
  'simulateSimMove must retain closed jewelry boxes on their first simulated clear wave'
);

// 9. Save & Load Persistence
assert.match(
  mainSource,
  /getActiveGameRuleForExport\(\): string \{[\s\S]*?if \(isJewelryBoxMode\) return 'jewelry-box';/,
  'game rule export must identify jewelry-box mode'
);

assert.match(
  mainSource,
  /isJewelryBoxMode = loadedGameRule === 'jewelry-box' \|\| !!\(saveData\.isJewelryBoxMode \?\? savedModes\.isJewelryBoxMode\)/,
  'loadPlayableState must restore jewelry box mode'
);

assert.match(
  mainSource,
  /spawnRecordedBlockState[\s\S]*?sb\.isJewelryBox[\s\S]*?sb\.jewelryBoxState/,
  'spawnRecordedBlockState must pass recorded jewelry box state'
);

// 10. Mutual Exclusivity
assert.match(
  mainSource,
  /function setPastureLayerMode\(enabled: boolean\): void \{[\s\S]*?if \(isJewelryBoxMode\) setJewelryBoxMode\(false\);/,
  'enabling pasture layer mode must disable jewelry box mode'
);

assert.match(
  mainSource,
  /function playJewelryBoxOpenAnimation\(block: Block\): void \{[\s\S]*?anim\.x = block\.sprite\.x;[\s\S]*?anim\.y = block\.sprite\.y \+ cellSize - targetH;[\s\S]*?parent\.addChild\(anim\);[\s\S]*?anim\.gotoAndPlay\(0\)/,
  'must set anim position before parent.addChild to prevent 1-frame flash at (0, 0)'
);

assert.match(
  mainSource,
  /function advanceJewelryBox\(block: Block\): number \{[\s\S]*?refreshJewelryBoxSprite\(block\);[\s\S]*?playJewelryBoxOpenAnimation\(block\);/,
  'advanceJewelryBox must trigger playJewelryBoxOpenAnimation on 1st clear'
);

const expectedSequences = [
  'blue_1x1.webp', 'blue_1x2.webp',
  'green_1x1.webp', 'green_1x2.webp',
  'pink_1x1.webp', 'pink_1x2.webp',
  'red_1x1.webp', 'red_1x2.webp',
  'yellow_1x1.webp', 'yellow_1x2.webp',
];
expectedSequences.forEach(seqFile => {
  const pubPath = path.join(root, 'public', 'assets', 'jewelry_box_sequences', seqFile);
  assert.ok(fs.existsSync(pubPath), `public asset ${seqFile} must exist`);
});

// 11. Recording Video Export Support (HUD and flying gems)
assert.match(
  mainSource,
  /function drawRecordingJewelryBoxHud\([\s\S]*?jewelry-target-1[\s\S]*?jewelry-target-2/,
  'recording must define drawRecordingJewelryBoxHud supporting both jewelry targets'
);

assert.match(
  mainSource,
  /const isJewelryBoxRecording = isJewelryBoxMode \|\| blocks\.some\(b => b\.isJewelryBox\) \|\| \(document\.getElementById\('jewelry-score-hud'\)\?\.style\.display === 'flex'\);[\s\S]*?drawRecordingJewelryBoxHud\(/,
  'drawFrame must invoke drawRecordingJewelryBoxHud during jewelry box recording'
);

assert.match(
  mainSource,
  /const flyImgs = document\.querySelectorAll\('\.collectible-fly-img, \.jewelry-fly-img'\);/,
  'recording canvas must capture both collectible-fly-img and jewelry-fly-img elements'
);

// 12. Progressive Count Up and Pop Animation with Fira Sans Font
assert.match(
  cssSource,
  /@font-face\s*\{[\s\S]*?font-family:\s*['"]Fira Sans['"][\s\S]*?url\(['"]\/fonts\/FiraSans-Black\.ttf['"]\)/,
  'style.css must define @font-face for Fira Sans Black'
);

assert.match(
  cssSource,
  /\.jewelry-score-x\s*\{[\s\S]*?font-family:\s*['"]Fira Sans['"][\s\S]*?font-weight:\s*900/,
  '.jewelry-score-x must use Fira Sans font with weight 900'
);

assert.match(
  cssSource,
  /\.jewelry-score-val\s*\{[\s\S]*?font-family:\s*['"]Fira Sans['"][\s\S]*?font-weight:\s*900[\s\S]*?transform-origin:\s*center center/,
  '.jewelry-score-val must use Fira Sans font with weight 900 and centered transform origin'
);

assert.match(
  cssSource,
  /@keyframes jewelryValPopAnim[\s\S]*?scale\(1\.5[\s\S]*?\.jewelry-score-val\.pop-anim/,
  'style.css must define bouncy scale-up and scale-down animation for jewelry-score-val'
);

assert.match(
  mainSource,
  /function triggerJewelryCountPop\(targetIndex: 1 \| 2\): void \{[\s\S]*?countEl\.classList\.add\('pop-anim'\)/,
  'main.ts must define triggerJewelryCountPop triggering progressive count up and pop-anim'
);

assert.match(
  mainSource,
  /flyImg\.remove\(\);[\s\S]*?triggerJewelryCountPop\(targetIndex\);/,
  'main.ts must trigger count increment and pop animation when flying gem lands at target'
);

console.log('jewelry box mode regression checks passed');

