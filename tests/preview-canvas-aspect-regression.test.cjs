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
  /function getPreviewRendererGameHeight\(\)[\s\S]*?const contentWidth = PARAMS\.gridCols \* PARAMS\.cellSize \+ PADDING \* 2;[\s\S]*?const boardAspect = MASTER_UI\.board\.h \/ MASTER_UI\.board\.w;[\s\S]*?return Math\.max\(PARAMS\.cellSize, contentWidth \* boardAspect - PADDING \* 2\);/,
  'preview renderer height should match the fixed board frame aspect so every column count fits without cropping'
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
  /const previewGameHeight = getPreviewRendererGameHeight\(\);[\s\S]*?const displayH = Math\.round\(previewGameHeight \* fitScale \+ PADDING \* 2 \* fitScale\);/,
  'renderer height should include frame overscan without stretching square blocks'
);

assert.match(
  body,
  /function getBoardCanvasContentSize\(\)[\s\S]*?w: PARAMS\.gridCols \* PARAMS\.cellSize \+ PADDING \* 2,[\s\S]*?h: getPreviewRendererGameHeight\(\) \+ PADDING \* 2/,
  'preview and recording should share the same square-cell canvas content size'
);

assert.match(
  body,
  /function fitRectContainPreserveAspect\([\s\S]*?const scale = Math\.min\(target\.w \/ contentW, target\.h \/ contentH\);[\s\S]*?const w = contentW \* scale;[\s\S]*?const h = contentH \* scale;/,
  'preview canvas should fit completely inside the fixed board frame without cropping blocks'
);

assert.match(
  body,
  /x: target\.x \+ \(target\.w - w\) \/ 2,/,
  'preview canvas should remain centered if there is any subpixel aspect difference'
);

assert.match(
  body,
  /y: target\.y \+ \(target\.h - h\) \/ 2,/,
  'preview canvas should remain vertically centered if there is any subpixel aspect difference'
);

assert.match(
  body,
  /const rect = fitRectContainPreserveAspect\([\s\S]*?\{ x: 0, y: 0, w: targetWidth, h: targetHeight \},[\s\S]*?contentSize\.w,[\s\S]*?contentSize\.h[\s\S]*?\);/,
  'editor preview should use non-cropping fitting inside the fixed master board frame'
);

assert.match(
  body,
  /function getMasterBoardCanvasRect\(width: number, height: number\)[\s\S]*?return fitRectContainPreserveAspect\(boardBox, contentSize\.w, contentSize\.h\);/,
  'recording should use the same non-cropping canvas rect as the editor preview'
);

assert.doesNotMatch(
  body,
  /Math\.max\(target\.w \/ contentW, target\.h \/ contentH\)/,
  'preview fitting must not cover-scale because cover scaling crops blocks at some column counts'
);

assert.doesNotMatch(
  body,
  /const h = target\.h;/,
  'preview canvas must not use independent target height because that makes square blocks look stretched'
);

console.log('preview canvas aspect regression passed');
