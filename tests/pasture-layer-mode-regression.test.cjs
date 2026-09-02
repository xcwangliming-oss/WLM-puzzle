const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(
  mainSource,
  /id = 'pasture-layer-section'[\s\S]*?toggle-pasture-layer-mode[\s\S]*?pasture-layer-asset-grid/,
  'pasture mode must have its own asset panel and enable switch',
);
assert.doesNotMatch(htmlSource, /btn-pasture-layer-mode/, 'pasture mode must not displace the gameplay rule buttons');
assert.match(
  mainSource,
  /PASTURE_LAYER_MODE[\s\S]*?type PastureLayerStage = 'framed-grass' \| 'grass' \| 'sheep'/,
  'pasture layers must stay explicitly marked and independent from prop rules',
);
assert.match(
  mainSource,
  /function isPastureLayerCandidate[\s\S]*?block\.color === 'green'[\s\S]*?const resolvedPastureStage = pastureStage \|\| \(isPastureLayerMode && isPastureLayerCandidate/,
  'only green ordinary blocks should start as framed grass in pasture mode',
);
assert.match(
  mainSource,
  /function sendSheepToPastureBlock[\s\S]*?const startX = targetX \+ targetWidth[\s\S]*?visitor\.x = startX[\s\S]*?const revealMask = new PIXI\.Graphics\(\)[\s\S]*?revealMask\.drawRect\(targetX, targetY, targetWidth, targetHeight\)[\s\S]*?visitor\.mask = revealMask[\s\S]*?block\.pastureStage = 'sheep'[\s\S]*?replacePastureLayerSprite\(block, visitor\)[\s\S]*?schedulePastureSheepGravity\(\)[\s\S]*?gsap\.to\(visitor, \{[\s\S]*?x: targetX[\s\S]*?duration: \.8[\s\S]*?ease: 'none'[\s\S]*?onComplete: completeArrival/,
  'the sheep must move right-to-left into the grass block while a fixed tile mask clips the motion',
);
assert.doesNotMatch(
  mainSource,
  /function sendSheepToPastureBlock[\s\S]*?visitor\.x = block\.col \* PARAMS\.cellSize \+ block\.length \* PARAMS\.cellSize/,
  'sheep arrival must not start outside the tile as an unmasked whole-block slide',
);
assert.match(
  mainSource,
  /if \(block\.pastureStage === 'framed-grass'\)[\s\S]*?const vanishSprite = new PIXI\.Sprite\(block\.sprite\.texture\)[\s\S]*?block\.pastureStage = 'grass'[\s\S]*?refreshPastureLayerSprite\(block\)[\s\S]*?setPastureSpriteScale\(block, \.7\)[\s\S]*?width: 0[\s\S]*?ease: 'back\.out\(2\.2\)'[\s\S]*?sendSheepToPastureBlock\(block\)/,
  'the first clear must still switch to uploaded grass, bounce from 70%, and then trigger sheep arrival',
);
assert.match(
  mainSource,
  /if \(block\.pastureStage === 'sheep'\)[\s\S]*?scale: \.72[\s\S]*?ease: 'power2\.in'[\s\S]*?scale: 1\.28[\s\S]*?ease: 'back\.out\(1\.8\)'[\s\S]*?alpha: 0/,
  'the second clear must shrink the occupying sheep first, quickly pop it larger, then disappear',
);
assert.match(
  mainSource,
  /const blocksToPhysicallyRemove = blocksToRemove\.filter\(b => !b\.pastureStage \|\| b\.pastureStage === 'sheep'\)/,
  'grass layers must remain board occupants while the sheep is removed on its next clear',
);
assert.match(
  mainSource,
  /const blocksToPhysicallyRemove = blocksToRemove\.filter\(b => !b\.pastureStage \|\| b\.pastureStage === 'sheep'\)[\s\S]*?if \(b\.pastureStage && b\.pastureStage !== 'sheep'\) \{[\s\S]*?tl\.call\(\(\) => \{ advancePastureLayer\(b\); \}, \[\], rowPlaybackOffset\)/,
  'pasture layer advancement must be owned by its row-clear timeline, not by row confirmation',
);
assert.match(
  mainSource,
  /const pastureRowBlocks = rowBlocks\.filter\(b => b\.pastureStage\);[\s\S]*?const effectRowBlocks = rowBlocks\.filter\(b => !b\.pastureStage\);[\s\S]*?const effectOnlyCols = new Set<number>\(\);[\s\S]*?effectRowBlocks\.forEach[\s\S]*?pastureRowBlocks\.forEach[\s\S]*?playRowShatterEffect\(r, explosionColor, effectRowBlocks, effectSkipCols, effectOnlyCols\)/,
  'ordinary row shatter effects must exclude pasture cells so the uploaded first-clear grass is not covered by framed-grass particles',
);
assert.match(
  mainSource,
  /const blocksToRemove = lockedSequentialIdSet[\s\S]*?getPastureBlocksForConfirmedClear\(blocksToRemove\);[\s\S]*?const blocksToPhysicallyRemove = blocksToRemove\.filter\(b => !b\.pastureStage \|\| b\.pastureStage === 'sheep'\)/,
  'a confirmed live clear must restore missing pasture markers before deciding which blocks to remove',
);
assert.match(
  mainSource,
  /function runPhysicsInstant\(\)[\s\S]*?const pastureBlocks = getPastureBlocksForConfirmedClear\(rowBlocks\)[\s\S]*?const physicalBlocks = rowBlocks\.filter\(b => !b\.pastureStage \|\| b\.pastureStage === 'sheep'\)[\s\S]*?pastureBlocks\.forEach\(block => advancePastureLayer\(block\)\)/,
  'instant physics used by editor/script playback must preserve and advance pasture layers too',
);
assert.match(
  mainSource,
  /if \(b\.pastureStage === 'sheep'\) \{[\s\S]*?advancePastureLayer\(b\)[\s\S]*?return;/,
  'the final sheep layer must use the pasture zoom-out animation instead of the ordinary row shrink',
);
assert.match(
  mainSource,
  /function isPastureLayerGravityLocked[\s\S]*?return block\.pastureStage === 'grass';[\s\S]*?function applyGravity[\s\S]*?if \(isPastureLayerGravityLocked\(b\)\)[\s\S]*?function applySimGravity[\s\S]*?if \(isPastureLayerGravityLocked\(b\)\)/,
  'only the temporary grass layer is gravity-locked; sheep must fall with normal gravity after it arrives',
);
assert.match(
  mainSource,
  /isPastureLayerMode = loadedGameRule === 'pasture-layer'/,
  'playable imports must restore the independent pasture rule',
);
assert.match(
  mainSource,
  /savedBlocks\.forEach[\s\S]*?spawnBlock\([\s\S]*?if \(isPastureLayerMode\) setPastureLayerMode\(true\)/,
  'saved boards with the pasture toggle enabled must convert pre-existing green blocks after loading',
);
assert.match(
  mainSource,
  /initialBoardBlocks\.forEach[\s\S]*?spawnRecordedBlockState\(sb\)[\s\S]*?if \(isPastureLayerMode\) setPastureLayerMode\(true\)/,
  'saved scripts with the pasture toggle enabled must hydrate their recreated green blocks',
);
assert.match(
  mainSource,
  /pastureStage: b\.pastureStage/,
  'board snapshots and saves must retain the current pasture layer',
);
assert.match(
  mainSource,
  /getPastureLayerTextures[\s\S]*?normalizePastureLayerAssetFrames\(pastureLayerAssets\[stage\]/,
  'each pasture stage must resolve its own uploaded material before falling back to a test placeholder',
);
assert.match(
  mainSource,
  /type PastureLayerAssetValue = string \| string\[\][\s\S]*?const pastureLayerTextureCache = new Map<string, PastureLayerTextureSet>[\s\S]*?function normalizePastureLayerAssetFrames[\s\S]*?async function ensurePastureLayerTexturesLoaded[\s\S]*?Promise\.all\(frames\.map\(source => loadPastureLayerImageTexture\(source\)\)\)[\s\S]*?function getPastureLayerTextures[\s\S]*?getCachedPastureLayerTextures\(stage, normalizedLength\)/,
  'uploaded pasture images must support both legacy single data-url strings and multi-frame data-url arrays',
);
assert.match(
  mainSource,
  /function createPastureLayerSpriteFromTextures\(textures: PIXI\.Texture\[\]\)[\s\S]*?textures\.length > 1[\s\S]*?new PIXI\.AnimatedSprite\(textures\)[\s\S]*?function applyPastureLayerSpriteTextures[\s\S]*?const shouldAnimate = textures\.length > 1[\s\S]*?currentSprite instanceof PIXI\.AnimatedSprite[\s\S]*?if \(currentSprite\.textures !== textures\) currentSprite\.textures = textures[\s\S]*?if \(!currentSprite\.playing\) currentSprite\.play\(\)[\s\S]*?replacePastureLayerSprite\(block, createPastureLayerSpriteFromTextures\(textures\)\)/,
  'multi-frame pasture slots must render as animated sprites instead of showing only the first frame',
);
assert.match(
  mainSource,
  /function replacePastureLayerSprite[\s\S]*?nextSprite\.eventMode = previousSprite\.eventMode[\s\S]*?nextSprite\.cursor = previousSprite\.cursor[\s\S]*?previousSprite\.listeners\('pointerdown'\)[\s\S]*?nextSprite\.on\('pointerdown'/,
  'replacing a pasture block with an animated sprite must preserve its pointer interaction',
);
assert.match(
  mainSource,
  /sprite\.on\('pointerdown'[\s\S]*?dragStartX = block\.sprite\.x[\s\S]*?block\.sprite\.filters = \[brightFilter\][\s\S]*?app\.stage\.on\('pointermove'[\s\S]*?block\.sprite\.x = newX[\s\S]*?const newCol = Math\.round\(block\.sprite\.x \/ PARAMS\.cellSize\)[\s\S]*?blocksContainer\.addChild\(block\.sprite\)/,
  'dragging must operate on the current block sprite after a pasture sequence-frame sprite replacement',
);
assert.match(
  mainSource,
  /async function applyMaterialPack[\s\S]*?if \(b\.isCollectible \|\| b\.isProp \|\| b\.pastureStage\) return;[\s\S]*?function restoreDefaultTextures[\s\S]*?if \(b\.isCollectible \|\| b\.isProp \|\| b\.pastureStage\) return;[\s\S]*?function applyCachedMaterialPack[\s\S]*?if \(b\.isCollectible \|\| b\.isProp \|\| b\.pastureStage\) return;/,
  'ordinary material-pack changes must not overwrite framed grass, grass, or sheep textures',
);
assert.match(
  mainSource,
  /interface SimBlock[\s\S]*?pastureStage\?: PastureLayerStage[\s\S]*?function checkSimEliminations[\s\S]*?if \(isPastureLayerMode\)[\s\S]*?b\.pastureStage = 'sheep'[\s\S]*?const pastureStagesBeforeClear = new Map[\s\S]*?const retainedPastureLayer = isPastureLayerMode[\s\S]*?pastureStagesBeforeClear\.get\(b\.id\) !== 'sheep'[\s\S]*?!retainedPastureLayer/,
  'auto-play simulation must retain first-clear pasture blocks and remove only the final sheep layer',
);
assert.match(
  mainSource,
  /function refreshPastureLayerSprite[\s\S]*?fitBlockSpriteToGrid\(block\)[\s\S]*?function fitBlockSpriteToGrid[\s\S]*?block\.sprite\.width = block\.length \* PARAMS\.cellSize/,
  'uploaded pasture textures must be refitted to their occupied 1-4 grid cells',
);
assert.doesNotMatch(mainSource, /playPastureLeafBurst|playPastureWoolBurst|getPastureLeafParticleTextures|getPastureWoolParticleTexture/, 'pasture leaf and wool particle effects must stay disabled for user-provided later effects');
assert.match(
  mainSource,
  /function getPastureAssetLengthFromFileName[\s\S]*?const sequenceMatch[\s\S]*?function applyPastureLayerAssetFiles[\s\S]*?bucket\.push\(file\)[\s\S]*?input-pasture-batch-\$\{stage\}[\s\S]*?batchInput\.multiple = true[\s\S]*?input\.multiple = true/,
  'each pasture material group must support batch length mapping and each 1-4 slot must accept multi-frame uploads',
);
assert.match(
  mainSource,
  /let pastureSheepGravityScheduled = false[\s\S]*?let pastureSheepGravityTimer: number \| null = null[\s\S]*?function schedulePastureSheepGravity\(\)[\s\S]*?window\.clearTimeout\(pastureSheepGravityTimer\)[\s\S]*?window\.setTimeout[\s\S]*?if \(isAnimating\) \{[\s\S]*?schedulePastureSheepGravity\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?applyGravity\(true\)[\s\S]*?PASTURE_SHEEP_GRAVITY_DEBOUNCE_MS/,
  'sheep gravity passes must be debounced and retried if row-clear animation is still busy',
);
assert.match(
  mainSource,
  /function sendSheepToPastureBlock[\s\S]*?visitor\.mask = revealMask[\s\S]*?block\.pastureStage = 'sheep'[\s\S]*?replacePastureLayerSprite\(block, visitor\)[\s\S]*?fitBlockSpriteToGrid\(block\)[\s\S]*?schedulePastureSheepGravity\(\)/,
  'sheep arrival must reuse the masked incoming sheep sprite as the occupying sheep block',
);
assert.match(
  mainSource,
  /function sendSheepToPastureBlock[\s\S]*?gsap\.to\(visitor, \{[\s\S]*?x: targetX[\s\S]*?duration: \.8[\s\S]*?ease: 'none'[\s\S]*?onComplete: completeArrival/,
  'sheep visitor must animate right-to-left from the grass-block right edge inside the fixed mask at the requested linear speed',
);
assert.match(
  mainSource,
  /import 'pixi\.js\/prepare'[\s\S]*?async function preparePastureLayerTexturesForRender[\s\S]*?prepare\.upload\(textures\)[\s\S]*?ensurePastureLayerTexturesLoaded[\s\S]*?await preparePastureLayerTexturesForRender\(textures\)[\s\S]*?pastureLayerTextureCache\.set/,
  'uploaded pasture textures must be prepared on the renderer before sheep or grass first appear on the board',
);
assert.match(
  mainSource,
  /PASTURE_LAYER_ASSET_DB = 'puzzle-editor-pasture-assets'[\s\S]*?indexedDB\.open\(PASTURE_LAYER_ASSET_DB, 1\)[\s\S]*?async function persistPastureLayerAssets[\s\S]*?async function hydratePastureLayerAssets[\s\S]*?void hydratePastureLayerAssets\(\)/,
  'uploaded pasture assets must persist in IndexedDB and hydrate after refresh',
);
assert.match(
  mainSource,
  /let pastureLayerAssets: PastureLayerAssets = \(\(\) => \{[\s\S]*?return emptyPastureLayerAssets\(\);[\s\S]*?\}\)\(\);[\s\S]*?localStorage\.removeItem\(PASTURE_LAYER_ASSET_STORAGE\)/,
  'stale localStorage pasture image mirrors must not override the fresh IndexedDB grass/sheep uploads',
);
assert.match(
  mainSource,
  /BLOCK_TEXTURE_SANITIZE[\s\S]*?PIXI\.Texture\.from\(source\)/,
  'ordinary blocks must use a real gem texture instead of the visible debug-square fallback',
);
assert.doesNotMatch(
  mainSource,
  /fallbackG\.roundRect\(/,
  'the flat rounded debug fallback must never be rendered as a board block',
);
assert.match(
  mainSource,
  /if \(!blocks\.includes\(block\) \|\| block\.pastureStage !== 'grass'\) \{[\s\S]*?discardVisitor\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?block\.pastureStage = 'sheep'/,
  'the sheep arrival must follow its current grass stage even if scripted playback re-syncs the mode',
);

console.log('pasture layer mode regression checks passed');
