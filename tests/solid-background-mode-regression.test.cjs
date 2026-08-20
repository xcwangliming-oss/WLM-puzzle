const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(
  source,
  /const SOLID_BACKGROUND_ID = 'solid';/,
  'solid background should be a built-in managed background mode'
);

assert.match(
  source,
  /const SOLID_BACKGROUND_COLORS = \[[\s\S]*?#f06f91[\s\S]*?#8cebc0[\s\S]*?#c9a7ff/,
  'solid background should expose a pastel macaron color palette'
);

assert.match(
  html,
  /data-solid-bg-variant="solid"[\s\S]*data-solid-bg-variant="animated"/,
  'background manager should provide solid and animated-color switches'
);

assert.match(
  source,
  /function isRecordingBackgroundActive\(\)[\s\S]*?isSolidRecordingBackgroundActive\(\) \|\| isImageRecordingBackgroundActive\(\)/,
  'recording should treat solid and image backgrounds as the same enabled background path'
);

assert.match(
  source,
  /function drawRecordingBackground\([\s\S]*?isSolidRecordingBackgroundActive\(\)[\s\S]*?createSolidBackgroundGradient[\s\S]*?drawSolidRecordingFrame/,
  'recording background draw should render the solid gradient and the solid-mode frame'
);

assert.match(
  css,
  /#board-wrapper\.solid-bg-live #board-clip[\s\S]*?background:\s*#232d5c;[\s\S]*?border:\s*5px solid #1c2655;/,
  'editor preview should use the dark board frame style in solid background mode'
);

assert.match(
  source,
  /gridGraphics\.stroke\(\{[\s\S]*?useSolidBackgroundUI \? 0x151f43[\s\S]*?useSolidBackgroundUI \? 0\.58/,
  'solid background mode should use darker, stronger grid lines'
);

console.log('solid background mode regression checks passed');
