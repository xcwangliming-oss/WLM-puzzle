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
  /#board-clip\s*\{[\s\S]*?height:\s*auto;[\s\S]*?aspect-ratio:\s*var\(--board-grid-aspect,\s*11\s*\/\s*18\);[\s\S]*?overflow:\s*hidden;/,
  'board clip should use the playable grid aspect so the frame cannot show a bottom band'
);

assert.match(
  body,
  /function getPreviewRendererGameHeight\(\)[\s\S]*?return PARAMS\.viewportRows \* PARAMS\.cellSize \* BOARD_FRAME_VERTICAL_SCALE;/,
  'preview renderer should fill the phone frame with fractional vertical overscan'
);

assert.match(
  body,
  /function syncBoardFrameToGrid\(\)[\s\S]*?const gameHeight = getPreviewRendererGameHeight\(\) \+ PADDING \* 2;[\s\S]*?--board-grid-aspect/,
  'board clip aspect should use the same fractional preview height as the renderer'
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
  /let h = w \* \(contentH \/ contentW\);/,
  'preview canvas height should be derived from renderer aspect, not stretched to the clip height'
);

assert.match(
  body,
  /if \(h > target\.h\) \{[\s\S]*?w = h \* \(contentW \/ contentH\);[\s\S]*?\}/,
  'preview canvas should fall back to height fitting while preserving aspect'
);

assert.match(
  body,
  /x: target\.x \+ \(target\.w - w\) \/ 2,/,
  'preview canvas should be centered after aspect-preserving scaling'
);

assert.match(
  body,
  /fitRectToWidthPreserveAspect\([\s\S]*?'top'[\s\S]*?\);/,
  'preview canvas should start at the top after the renderer height covers the extended frame'
);

assert.doesNotMatch(
  body,
  /const h = target\.h;/,
  'preview canvas must not use independent target height because that makes square blocks look stretched'
);

console.log('preview canvas aspect regression passed');
