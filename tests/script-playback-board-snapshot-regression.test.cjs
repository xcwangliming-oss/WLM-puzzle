const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');

test('recorded script steps persist board states without rebuilding the live board between steps', () => {
  assert.match(source, /interface ScriptStep \{[\s\S]*?boardBefore\?: BoardBlockState\[\];/);
  assert.match(source, /const SCRIPT_PLAYBACK_DATA_VERSION = 5;/);
  assert.match(source, /playbackDataVersion\?: number;/);
  assert.match(source, /function captureCurrentBoardBlockStates\(\): BoardBlockState\[\]/);
  assert.match(source, /function restoreBoardBlockStates\(states: BoardBlockState\[\]\)/);
  assert.match(source, /function areBoardBlockStatesEquivalent\(states: BoardBlockState\[\]\): boolean/);
  assert.match(source, /let forcedPlaybackFullRows: number\[\] \| null = null;/);
  assert.match(source, /const oldCol = block\.col;[\s\S]*?const boardBeforeMove = captureCurrentBoardBlockStates\(\);[\s\S]*?block\.col = newCol;/);
  assert.match(source, /scriptSteps\.push\(\{[\s\S]*?boardBefore: boardBeforeMove/);
  assert.match(source, /scriptSteps\.push\(\{[\s\S]*?playbackDataVersion: SCRIPT_PLAYBACK_DATA_VERSION/);

  const playStart = source.indexOf('async function playScript(');
  const playEnd = source.indexOf('function playScriptFromButton', playStart);
  assert.notEqual(playStart, -1);
  assert.notEqual(playEnd, -1);
  const playBody = source.slice(playStart, playEnd);
  assert.doesNotMatch(
    playBody,
    /restoreBoardBlockStates\(step\.boardBefore\);/,
    'live playback must never clear and rebuild the board from a per-step snapshot'
  );
  assert.match(playBody, /const stepStateBefore: BoardBlockState\[\] = captureCurrentBoardBlockStates\(\);/);
  assert.match(playBody, /restoreBoardBlockStates\(stepStateBefore\);/);
  assert.match(playBody, /const immediatePlaybackRows = getImmediatePlayableFullRows\(\);[\s\S]*?forcedPlaybackFullRows = immediatePlaybackRows;[\s\S]*?checkEliminations\(\);[\s\S]*?forcedPlaybackFullRows = null;[\s\S]*?await waitForPhysics\(\);/);
  assert.match(playBody, /if \(immediatePlaybackRows\.length === 0\) \{[\s\S]*?applyGravity\(true\);[\s\S]*?await waitForPhysics\(\);/);
  assert.match(
    playBody,
    /block\.noGravity = false;[\s\S]*?releaseNoGravityBlocksInCurrentBoard\([\s\S]*?getStepGravityMaxRow\(step\)[\s\S]*?const immediatePlaybackRows/,
    'playback should use the same bounded no-gravity release as recording before resolving the move'
  );

  const repairStart = source.indexOf('function repairScriptSteps');
  const repairEnd = source.indexOf('function jumpToStepState', repairStart);
  assert.notEqual(repairStart, -1);
  assert.notEqual(repairEnd, -1);
  const repairBody = source.slice(repairStart, repairEnd);
  assert.match(repairBody, /step\.boardBefore = captureCurrentBoardBlockStates\(\);/);
  assert.match(repairBody, /step\.playbackDataVersion = SCRIPT_PLAYBACK_DATA_VERSION;/);
  assert.match(repairBody, /Block not found for step[\s\S]*?step\.playbackDataVersion = SCRIPT_PLAYBACK_DATA_VERSION;[\s\S]*?continue;/);
  assert.match(repairBody, /target column[\s\S]*?step\.playbackDataVersion = SCRIPT_PLAYBACK_DATA_VERSION;[\s\S]*?continue;/);
  assert.match(repairBody, /const hasCurrentPlaybackData = step\.playbackDataVersion === SCRIPT_PLAYBACK_DATA_VERSION;[\s\S]*?preserveExistingEliminations[\s\S]*?&& hasCurrentPlaybackData/);
  assert.match(repairBody, /restoreBoardBlockStates\(currentBlocksBackup\);[\s\S]*?pendingOffscreenFullRowBlockIds = \[\];/);

  assert.match(source, /function scriptNeedsPlaybackRepair\(\)[\s\S]*?step\.playbackDataVersion !== SCRIPT_PLAYBACK_DATA_VERSION/);
  assert.match(source, /if \(scriptNeedsPlaybackRepair\(\)\) \{[\s\S]*?repairScriptSteps\(\{[\s\S]*?preserveExistingEliminations: true/);
  assert.match(source, /function alignInstantPlaybackViewportToNextWave\(\)[\s\S]*?getNextPlaybackWaveWorldY\(activeSimulatingStepIndex\)[\s\S]*?setWorldY\(nextWaveWorldY\)/);
  assert.match(source, /safetyCounter\+\+;[\s\S]*?alignInstantPlaybackViewportToNextWave\(\);[\s\S]*?if \(isNoGravityMode\) resolveNoGravityStates\(\);/);
  assert.match(source, /else if \(forcedPlaybackFullRows && forcedPlaybackFullRows\.length > 0\) \{[\s\S]*?fullRows\.push\(\.\.\.forcedPlaybackFullRows\);/);
  assert.match(source, /function shouldContinuePlaybackClearChain\(stepIndex: number \| null\): boolean \{[\s\S]*?getCurrentVisiblePlaybackFullRows\(stepIndex\)\.length > 0[\s\S]*?if \(waves\.length === 0\) \{[\s\S]*?hasAnyEliminationThisStep[\s\S]*?getPlaybackAllowedRows\(step\)\.length > 0;[\s\S]*?return activeEliminationWaveIndex < waves\.length;/);
  assert.match(source, /setTimeout\(\(\) => \{[\s\S]*?continueGravityAfterElimination\(\);/);
  assert.doesNotMatch(source, /function shouldResolveNoGravityStatesForGravity\(/);
  assert.match(source, /if \(isNoGravityMode\) resolveNoGravityStates\(getActivePhysicsMaxRow\(\)\);/);
  assert.match(
    source,
    /if \(isPlayingScript && isNoGravityMode && scriptPlaybackAdvanceMode === 'fixed'\) \{[\s\S]*?return getVisibleBottomRowForWorldY/,
    'fixed no-gravity playback must never expand physics into offscreen recorded rows'
  );
});

test('recorded elimination waves require a visible trigger before clearing pending rows', () => {
  const start = source.indexOf('function getPlaybackFullRowsFromOccupancy');
  const end = source.indexOf('function shouldAdvancePlaybackWave', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const body = source.slice(start, end);

  assert.match(body, /const newVisibleAllowedRows = visibleFullRows\.filter\([\s\S]*?!pendingRows\.includes\(row\)/);
  assert.match(body, /if \(newVisibleAllowedRows\.length === 0\) \{[\s\S]*?pendingOffscreenFullRowBlockIds\.push\(ids\);[\s\S]*?return \[\];/);
  assert.match(body, /\.\.\.allowedFullRows,[\s\S]*?\.\.\.refreshPendingOffscreenFullRows\(occ\)[\s\S]*?return rowsToClear;/);
  assert.doesNotMatch(source, /function alignRecordedWaveRowsToCurrentFullRows\(/);
  assert.doesNotMatch(body, /return visibleRecordedRows;/);
});

test('selected color rules persist into the recorded playback start board', () => {
  assert.match(
    source,
    /function syncInitialBoardColorsFromCurrentBoard\(\)[\s\S]*?initialBlock\.color = currentBlock\.color/,
  );

  const colorButtonStart = source.indexOf('btnColorMode.onclick = async () =>');
  const multiCollectStart = source.indexOf('btnMultiCollectMode.onclick = async () =>', colorButtonStart);
  assert.notEqual(colorButtonStart, -1);
  assert.notEqual(multiCollectStart, -1);
  const colorRuleHandlers = source.slice(colorButtonStart, multiCollectStart);
  const syncCount = (colorRuleHandlers.match(/syncInitialBoardColorsFromCurrentBoard\(\);/g) || []).length;
  assert.ok(syncCount >= 5, 'color, single-color, rainbow, rainbow-fixed, and custom two-color handlers must sync playback start colors');
});
