const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');

// Ensure index.html does not force unconstrained visible overflow
assert.doesNotMatch(
  html,
  /body:not\(\.is-playable\)\s+#material-panel\s*\{[^}]*max-height:\s*none\s*!important/i,
  'material-panel must not be forced to max-height: none in index.html'
);
assert.doesNotMatch(
  html,
  /body:not\(\.is-playable\)\s+#material-panel\s*\{[^}]*overflow:\s*visible\s*!important/i,
  'material-panel must not be forced to overflow: visible in index.html'
);
assert.doesNotMatch(
  html,
  /body:not\(\.is-playable\)\s+#style-assets-panel\s*\{[^}]*max-height:\s*none\s*!important/i,
  'style-assets-panel must not be forced to max-height: none in index.html'
);
assert.doesNotMatch(
  html,
  /body:not\(\.is-playable\)\s+#style-assets-panel\s*\{[^}]*overflow:\s*visible\s*!important/i,
  'style-assets-panel must not be forced to overflow: visible in index.html'
);

// Ensure index.html and style.css constrain height and enable scrolling
assert.match(
  html,
  /body:not\(\.is-playable\)\s+#material-panel\s*\{[^}]*max-height:\s*calc\(var\(--editor-stage-height,\s*1180px\)\s*-\s*8px\)\s*!important/i,
  'material-panel must constrain max-height to editor stage height in index.html'
);
assert.match(
  html,
  /body:not\(\.is-playable\)\s+#material-panel\s*\{[^}]*overflow-y:\s*auto\s*!important/i,
  'material-panel must enable vertical scrolling in index.html'
);

assert.match(
  html,
  /body:not\(\.is-playable\)\s+#style-assets-panel\s*\{[^}]*max-height:\s*calc\(var\(--editor-stage-height,\s*1180px\)\s*-\s*8px\)\s*!important/i,
  'style-assets-panel must constrain max-height to editor stage height in index.html'
);
assert.match(
  html,
  /body:not\(\.is-playable\)\s+#style-assets-panel\s*\{[^}]*overflow-y:\s*auto\s*!important/i,
  'style-assets-panel must enable vertical scrolling in index.html'
);

assert.match(
  css,
  /body:not\(\.is-playable\)\s+#material-panel\s*\{[^}]*max-height:\s*calc\(var\(--editor-stage-height,\s*1180px\)\s*-\s*8px\)/i,
  'material-panel must constrain max-height to editor stage height in style.css'
);
assert.match(
  css,
  /body:not\(\.is-playable\)\s+#material-panel\s*\{[^}]*overflow-y:\s*auto/i,
  'material-panel must enable vertical scrolling in style.css'
);

assert.match(
  css,
  /body:not\(\.is-playable\)\s+#style-assets-panel\s*\{[^}]*max-height:\s*calc\(var\(--editor-stage-height,\s*1180px\)\s*-\s*8px\)/i,
  'style-assets-panel must constrain max-height to editor stage height in style.css'
);
assert.match(
  css,
  /body:not\(\.is-playable\)\s+#style-assets-panel\s*\{[^}]*overflow-y:\s*auto/i,
  'style-assets-panel must enable vertical scrolling in style.css'
);

// Ensure scrollbars are not suppressed with display: none
assert.doesNotMatch(
  css,
  /#material-panel::-webkit-scrollbar[^{]*\{\s*display:\s*none/i,
  'material-panel scrollbar must not be hidden with display: none'
);
assert.doesNotMatch(
  css,
  /#style-assets-panel::-webkit-scrollbar[^{]*\{\s*display:\s*none/i,
  'style-assets-panel scrollbar must not be hidden with display: none'
);

console.log('sidebar panels scroll regression checks passed');
