const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');

assert.match(source, /let pendingSequentialClearBlockIds: number\[\]\[\] = \[\];/, 'sequential row clears should keep a locked block-id queue');
assert.match(source, /function getRowsForLockedSequentialBlocks\(ids: number\[\] \| null\): number\[\]/, 'locked sequential clears should map original block ids to their current rows after gravity');
assert.match(source, /const startLockedSequentialClear = \(rows: number\[\]\) => \{[\s\S]*?sort\(\(a, b\) => b - a\)[\s\S]*?filter\(block => !block\.isProp && block\.row === row\)[\s\S]*?map\(block => block\.id\)/, 'multi-row sequential clears should lock each originally full row by block id from bottom to top');
assert.match(source, /if \(pendingSequentialClearBlockIds\.length > 0\) \{[\s\S]*?lockedSequentialBlockIds = pendingSequentialClearBlockIds\.shift\(\) \|\| null;[\s\S]*?fullRows = getRowsForLockedSequentialBlocks\(lockedSequentialBlockIds\);/, 'pending sequential clear waves should run before recalculating new full rows');
assert.match(source, /PARAMS\.rowClearOrder === 'bottom-up'[\s\S]*?fullRows\.length > 1[\s\S]*?startLockedSequentialClear\(fullRows\);/, 'bottom-up row clear mode should split simultaneous full rows into locked waves');
assert.match(source, /const lockedSequentialIdSet = lockedSequentialBlockIds \? new Set\(lockedSequentialBlockIds\) : null;[\s\S]*?lockedSequentialIdSet[\s\S]*?blocks\.filter\(b => !b\.isProp && lockedSequentialIdSet\.has\(b\.id\)\)/, 'locked waves should remove blocks by id instead of the row after gravity');
assert.match(source, /function clearAllBlocks\(\)[\s\S]*?pendingSequentialClearBlockIds = \[\];/, 'clearing or restoring the board should reset pending sequential clears');

console.log('sequential row lock regression checks passed');
