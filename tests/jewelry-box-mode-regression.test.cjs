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
  /id="jewelry-score-hud"[\s\S]*?id="jewelry-header-icon"[\s\S]*?id="jewelry-collect-val"/,
  'top header must include jewelry collection HUD with icon and count display'
);

assert.match(
  cssSource,
  /\.jewelry-score-hud[\s\S]*?\.jewelry-header-icon[\s\S]*?\.jewelry-fly-img/,
  'style.css must contain styles for jewelry HUD and flying gem particle animation'
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
  /type JewelryBoxAssetKey = '1-closed' \| '1-open' \| '2-closed' \| '2-open' \| 'gem'/,
  'jewelry box assets must support 1x1 closed/open, 1x2 closed/open, and flight gem'
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
  /function setJewelryBoxMode\(enabled: boolean\): void \{[\s\S]*?if \(isPastureLayerMode\) setPastureLayerMode\(false\);/,
  'enabling jewelry box mode must disable pasture layer mode'
);

console.log('jewelry box mode regression checks passed');
