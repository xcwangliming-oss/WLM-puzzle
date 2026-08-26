const fs = require('fs');
const path = require('path');
const assert = require('assert');

const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
const body = fs.readFileSync(mainPath, 'utf8');
const style = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.css'), 'utf8');

assert.match(
  body,
  /const BOARD_FRAME_VERTICAL_SCALE = 1\.04;/,
  'phone-style board frame should keep its lower safe-area extension'
);

assert.match(
  style,
  /#board-clip\s*\{[\s\S]*?top:\s*12\.5%;[\s\S]*?width:\s*89\.1667%;[\s\S]*?height:\s*85%;[\s\S]*?overflow:\s*hidden;/,
  'board clip should stay fixed to the master phone background for every column count'
);

assert.match(
  body,
  /let previewRenderRows = DEFAULT_BOARD_ROWS;[\s\S]*?function getPreviewRenderRows\(\)[\s\S]*?return Math\.max\(1, Math\.min\(PARAMS\.totalRows, previewRenderRows \|\| PARAMS\.viewportRows\)\);[\s\S]*?function getPreviewRendererGameHeight\(\)[\s\S]*?return getPreviewRenderRows\(\) \* PARAMS\.cellSize;/,
  'preview renderer should extend far enough for the fixed board clip to crop the bottom without stretching cells'
);

assert.match(
  body,
  /function getMasterBoardRect\(width: number, height: number\)[\s\S]*?w: MASTER_UI\.board\.w \* width,[\s\S]*?h: MASTER_UI\.board\.h \* height/,
  'master board rect should use the fixed template position instead of changing with grid columns'
);

assert.match(
  body,
  /function getViewportGameHeight\(\): number \{[\s\S]*?return PARAMS\.viewportRows \* PARAMS\.cellSize;[\s\S]*?\}/,
  'logical viewport height should stay tied to saved viewportRows for old script compatibility'
);

assert.match(
  body,
  /function getScrollViewportGameHeight\(\): number \{[\s\S]*?return getPreviewRendererGameHeight\(\);[\s\S]*?\}/,
  'scroll boundary should use the full visible preview height'
);

assert.match(
  body,
  /function getEliminationVisibleRowRangeForWorldY\([\s\S]*?const boardClip = document\.getElementById\('board-clip'\);[\s\S]*?const visibleBottom = Math\.min\(clipRect\.bottom, canvasRect\.bottom\);[\s\S]*?visibleGameBottom = Math\.min\(getPreviewRendererGameHeight\(\), rendererBottom - PADDING\);/,
  'elimination visibility should follow the actual board clip instead of the configured row count or hidden renderer overscan'
);

assert.match(
  body,
  /function updateBoardViewportMask\(\)[\s\S]*?\.rect\(PADDING, PADDING, PARAMS\.gridCols \* PARAMS\.cellSize, getPreviewRendererGameHeight\(\)\)/,
  'board viewport mask should expose the fractional bottom area instead of covering it'
);

assert.match(
  body,
  /const gridStart = 0;[\s\S]*?const gridColEnd = PARAMS\.gridCols;[\s\S]*?const gridRowEnd = PARAMS\.totalRows;/,
  'generated background mode should not clip away the first or last grid line'
);

assert.match(
  body,
  /function getBottomWorldY\(\): number \{[\s\S]*?PARAMS\.totalRows \* PARAMS\.cellSize - getScrollViewportGameHeight\(\)/,
  'bottom scroll clamp should account for the extended preview frame separately from game logic'
);

assert.match(
  body,
  /const rowsToCoverFrame = Math\.ceil\(boardFrameInnerH \/ displayCellSize\) \+ 1;[\s\S]*?previewRenderRows = Math\.max\(PARAMS\.viewportRows, Math\.min\(PARAMS\.totalRows, rowsToCoverFrame\)\);[\s\S]*?const previewGameHeight = getPreviewRendererGameHeight\(\);[\s\S]*?const contentDisplayH = Math\.round\(previewGameHeight \* fitScale \+ PADDING \* 2 \* fitScale\);[\s\S]*?const displayH = Math\.max\(contentDisplayH, frameDisplayH\);/,
  'renderer height should cover the fixed frame plus one crop row without changing square-cell scaling'
);

assert.match(
  body,
  /function getBoardCanvasContentSize\(\)[\s\S]*?w: PARAMS\.gridCols \* PARAMS\.cellSize \+ PADDING \* 2,[\s\S]*?h: getPreviewRendererGameHeight\(\) \+ PADDING \* 2/,
  'preview and recording should share the same square-cell canvas content size'
);

assert.match(
  body,
  /function getMasterBoardCanvasRect\(width: number, height: number\)[\s\S]*?return fitRectToFixedWidthPreserveAspect\(boardBox, contentSize\.w, contentSize\.h\);/,
  'recording should keep the board x/y/width fixed and let the drawn canvas continue downward with content height'
);

assert.match(
  body,
  /function fitRectToFixedWidthPreserveAspect\([\s\S]*?const scale = target\.w \/ contentW;[\s\S]*?const h = Math\.max\(target\.h, contentH \* scale\);[\s\S]*?x: target\.x,[\s\S]*?y: target\.y,/,
  'fixed-width board fitting should fill the fixed frame when the visible row content is shorter'
);

assert.match(
  body,
  /canvas\.style\.left = '0px';[\s\S]*?canvas\.style\.top = '0px';/,
  'editor preview canvas should keep the left and top edges fixed to the board frame'
);

assert.match(
  body,
  /positionBoardClipInMaster\(\)[\s\S]*?const boardBox = getMasterBoardContentRect\(boardWrapper\.clientWidth, boardWrapper\.clientHeight\);[\s\S]*?boardClip\.style\.left = `\$\{boardBox\.x\}px`;[\s\S]*?boardClip\.style\.top = `\$\{boardBox\.y\}px`;[\s\S]*?boardClip\.style\.width = `\$\{boardBox\.w\}px`;[\s\S]*?boardClip\.style\.height = `\$\{boardBox\.h\}px`;/,
  'editor board clip should stay in the fixed template area even when the drawn canvas continues downward'
);

assert.match(
  body,
  /const cssScale = targetWidth \/ Math\.max\(1, canvas\.width\);[\s\S]*?const targetHeight = canvas\.height \* cssScale;[\s\S]*?canvas\.style\.top = '0px';[\s\S]*?canvas\.style\.height = `\$\{targetHeight\}px`;/,
  'editor canvas should use one CSS scale for square cells while the board clip crops the bottom'
);

assert.match(
  body,
  /const boardClipBox = getRecordingBoardClipRect\(boardWrapper \|\| null, width, height\);[\s\S]*?recordingCtx!\.rect\(boardClipBox\.x, boardClipBox\.y, boardClipBox\.w, boardClipBox\.h\);/,
  'recording should clip the downward-extending canvas to the same live board area shown in the editor'
);

assert.doesNotMatch(
  body,
  /fitRectCoverPreserveAspect|fitRectContainPreserveAspect/,
  'preview fitting should not use cover or contain helpers because they either crop or leave inner bands'
);

assert.doesNotMatch(
  body,
  /Math\.max\(target\.w \/ contentW, target\.h \/ contentH\)/,
  'preview fitting must not cover-scale because cover scaling crops blocks at some column counts'
);

console.log('preview canvas aspect regression passed');
