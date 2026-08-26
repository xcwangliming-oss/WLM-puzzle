const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');

for (const state of ['idle', 'collect']) {
  assert.match(
    html,
    new RegExp(`id="input-collection-avatar-${state}"[^>]*multiple`),
    `${state} avatar upload must accept a sequence of frames`,
  );
}

assert.match(html, /id="collection-avatar-hud"/, 'collection avatar must have a centered HUD target');
assert.match(html, /id="collection-avatar-image"/, 'collection avatar HUD must render the active frame');
assert.match(
  style,
  /#collection-avatar-hud\s*\{[\s\S]*?left:\s*50%;[\s\S]*?top:\s*50%;[\s\S]*?transform:\s*translate\(-50%,\s*-50%\)/,
  'collection avatar HUD must stay centered in the header',
);
assert.match(
  style,
  /#collection-avatar-hud\s*\{[\s\S]*?width:\s*104px;[\s\S]*?height:\s*104px;/,
  'collection avatar HUD must use the enlarged 1.8x footprint',
);
assert.match(
  style,
  /#collection-avatar-image\s*\{[\s\S]*?object-fit:\s*contain/,
  'avatar images must preserve their source aspect ratio',
);

assert.match(
  source,
  /headerItemEl\.innerHTML = `<span class="collect-score-hud">[\s\S]*?id="score-val"[\s\S]*?id="level-val" style="display:none;"/,
  'collection mode must show a dedicated score HUD while preserving hidden level compatibility',
);
assert.match(
  style,
  /\.collect-score-hud\s*\{[\s\S]*?flex-direction:\s*column/,
  'collection score label and value must stack vertically',
);
assert.match(
  style,
  /\.collect-score-value\s*\{[\s\S]*?font-weight:\s*900/,
  'collection score value must use a heavier mobile HUD weight',
);
assert.match(
  source,
  /const avatarTargetEl = getCollectionAvatarTargetElement\(\);[\s\S]*?const multiTargetEl = multiItem[\s\S]*?const multiTargetImageEl = multiTargetEl\?\.querySelector<HTMLElement>\('img'\)[\s\S]*?const targetEl = multiTargetImageEl \|\| avatarTargetEl \|\| document\.getElementById\('collectible-header-icon'\)/,
  'collectibles must target the matching multi-collectible icon first, then the center avatar, then the old right-icon fallback',
);
assert.match(
  source,
  /if \(avatarTargetEl\) \{[\s\S]*?Math\.min\(58, targetRect\.width\)[\s\S]*?\(targetRect\.width - targetSize\) \/ 2[\s\S]*?\(targetRect\.height - targetSize\) \/ 2/,
  'the enlarged avatar must receive a centered collectible without enlarging the flying icon',
);
assert.match(
  source,
  /else if \(avatarTargetEl\) \{[\s\S]*?triggerCollectionAvatarCollectState\(\);[\s\S]*?\}/,
  'arrival at the avatar must play the collect state',
);
assert.match(
  source,
  /const COLLECTION_AVATAR_FPS = 30;[\s\S]*?const COLLECTION_AVATAR_FRAME_MS = 1000 \/ COLLECTION_AVATAR_FPS;/,
  'avatar sequences must play at a smooth 30 FPS cadence',
);
assert.match(
  source,
  /function playCollectionAvatarFrameSequence\([\s\S]*?performance\.now\(\)[\s\S]*?Math\.floor\(elapsed \/ COLLECTION_AVATAR_FRAME_MS\)[\s\S]*?requestAnimationFrame\(renderFrame\)/,
  'avatar sequence playback must use a time-based animation frame loop without timer drift',
);
assert.match(
  source,
  /function preloadCollectionAvatarFrame\([\s\S]*?image\.decoding = 'async';[\s\S]*?image\.decode\(\)/,
  'avatar frames must be decoded before smooth playback starts',
);

assert.match(
  source,
  /collectionAvatarStyle:\s*getExportableCollectionAvatarStyle\(\)/,
  'generated playables must embed avatar frames',
);
assert.match(
  source,
  /applyCollectionAvatarStylePayload\(saveData\.collectionAvatarStyle\)/,
  'generated playables must restore embedded avatar frames',
);
assert.match(
  source,
  /indexedDB\.open\(COLLECTION_AVATAR_DB_NAME,\s*1\)/,
  'editor avatar frames must persist outside localStorage',
);
assert.match(
  source,
  /await loadCollectionAvatarStyle\(\);[\s\S]*?bindCollectionAvatarManager\(\);[\s\S]*?await collectibleDB\.init\(\);/,
  'stored avatar frames must finish loading before upload handlers can replace them',
);
assert.match(
  source,
  /localeCompare\(b\.name,\s*undefined,\s*\{ numeric: true \}\)/,
  'uploaded sequence frames must use natural filename ordering',
);

assert.match(
  source,
  /if \(isCollectMode\) \{[\s\S]*?fillText\('SCORE',[\s\S]*?fillText\(scoreText,/,
  'collection recordings must render stacked SCORE label and value lines',
);
assert.match(
  source,
  /drawRecordingImageContained\(recordingCtx!,\s*avatarImageEl,\s*avatarBox\)/,
  'recordings must include the current centered avatar frame',
);
assert.match(
  source,
  /const avatarBox = useRecordingBackground\s*\?\s*mapBoardWrapperRectToRecordingRect\([\s\S]*?\{ x: 0, y: 0, w: width, h: height \}/,
  'recorded avatar must map against the full phone canvas instead of the board-only region',
);
assert.match(
  source,
  /const scale = Math\.min\(box\.w \/ sourceWidth,\s*box\.h \/ sourceHeight\)/,
  'recorded avatar frames must preserve aspect ratio',
);

console.log('collection avatar regression checks passed');
