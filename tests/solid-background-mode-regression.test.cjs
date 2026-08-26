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
  /const SOLID_BACKGROUND_COLORS(?:: SolidBackgroundColor\[\])? = \[[\s\S]*?#344372[\s\S]*?#563762[\s\S]*?#3a356f[\s\S]*?#6b3c7f/,
  'solid background should expose heavier blue-purple colors based on the reference background'
);

assert.match(
  source,
  /const SOLID_BACKGROUND_COLORS(?:: SolidBackgroundColor\[\])? = \[[\s\S]*?macaron-pink[\s\S]*?#ffd1dc[\s\S]*?macaron-mint[\s\S]*?#c8f7dc[\s\S]*?macaron-sky[\s\S]*?#c7e8ff[\s\S]*?macaron-lavender[\s\S]*?#dec8ff[\s\S]*?macaron-peach[\s\S]*?#ffd5bd[\s\S]*?macaron-cream[\s\S]*?#fff1b8/,
  'solid background should include a macaron color set'
);

assert.match(
  source,
  /const DEFAULT_SOLID_BACKGROUND_COLOR_ID = 'deep-blue';/,
  'solid background should default to the reference-like deep blue-purple palette'
);

assert.match(
  html,
  /data-solid-bg-variant="solid"[\s\S]*data-solid-bg-variant="animated"/,
  'background manager should provide solid and animated-color switches'
);

assert.match(
  html,
  /id="input-solid-bg-color"[\s\S]*id="btn-add-solid-bg-color"/,
  'solid background manager should allow adding colors with a color picker'
);

assert.match(
  html,
  /data-solid-bg-group="dark"[\s\S]*data-solid-bg-group="light"[\s\S]*data-solid-bg-group="custom"/,
  'solid background manager should keep dark, light, and custom color groups separate'
);

assert.match(
  source,
  /function addCustomSolidBackgroundColor\(hex: string\)[\s\S]*?const customGroup: SolidBackgroundGroup = 'custom'[\s\S]*?SOLID_BACKGROUND_COLORS\.push\(color\)[\s\S]*?setSolidBackgroundColor\(color\.id\)/,
  'custom solid colors should be added to the palette and previewed immediately'
);

assert.match(
  source,
  /function deleteCustomSolidBackgroundColor\(id: string\)[\s\S]*?SOLID_BACKGROUND_COLORS\.splice\(index, 1\)[\s\S]*?syncRecordingBackgroundUI\(\)/,
  'custom solid colors should be removable from the palette'
);

assert.match(
  source,
  /solidColors: SOLID_BACKGROUND_COLORS\.filter\(color => color\.custom\)/,
  'playable export should include custom solid background colors'
);

assert.match(
  source,
  /applyCustomSolidBackgroundColors\(savedBackground\.solidColors\)/,
  'playable import should restore custom solid background colors'
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
  source,
  /function advanceSolidBackgroundColorOnElimination\(\)[\s\S]*?const colors = getSolidBackgroundColorsForActiveGroup\(\)[\s\S]*?solidBackgroundColorId = next\.id[\s\S]*?persistRecordingBackgroundState\(\)[\s\S]*?syncRecordingBackgroundUI\(\)/,
  'animated solid background mode should advance within the active color group only when an elimination occurs'
);

assert.match(
  source,
  /comboCount \+= Math\.max\(1, fullRows\.length\);[\s\S]*?advanceSolidBackgroundColorOnElimination\(\);/,
  'each elimination wave should trigger one solid background color step'
);

assert.doesNotMatch(
  source,
  /Math\.sin\(timeMs \/ 1400\)/,
  'animated solid backgrounds should not change color continuously over time'
);

assert.match(
  source,
  /preview\.style\.background = '';[\s\S]*?preview\.style\.backgroundImage = `url\("\$\{recordingBackgroundDataUrl\}"\)`/,
  'uploaded background preview should clear the solid shorthand before assigning the image'
);

assert.match(
  source,
  /boardWrapper\.style\.background = '';[\s\S]*?boardWrapper\.style\.backgroundImage = `url\("\$\{recordingBackgroundDataUrl\}"\)`/,
  'uploaded live background should clear the solid shorthand before assigning the image'
);

assert.match(
  css,
  /#board-wrapper\.solid-bg-live #board-clip[\s\S]*?background:\s*rgba\(35,\s*45,\s*92,\s*0\.7\);[\s\S]*?border:\s*5px solid rgba\(28,\s*38,\s*85,\s*0\.7\);/,
  'editor preview should use a 70 percent transparent dark board frame in solid background mode'
);

assert.match(
  source,
  /function drawSolidRecordingBoardFrame[\s\S]*?ctx\.fillStyle = 'rgba\(35, 45, 92, 0\.7\)'[\s\S]*?ctx\.strokeStyle = 'rgba\(28, 38, 85, 0\.7\)'/,
  'recording should use the same 70 percent transparent board frame in solid background mode'
);

assert.match(
  source,
  /gridGraphics\.stroke\(\{[\s\S]*?useSolidBackgroundUI \? 0x151f43[\s\S]*?useSolidBackgroundUI \? 0\.58/,
  'solid background mode should use darker, stronger grid lines'
);

console.log('solid background mode regression checks passed');
