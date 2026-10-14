const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'settleBallShooterLayout');
const sandbox = { PARAMS: { viewportRows: 17, cellSize: 53 }, blocks: [] };
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(fn.getText(ast), {}).outputText, sandbox);
function verify(input) {
  sandbox.blocks = input.map((b, i) => ({ ...b, id: i, hitPoints: 123, sprite: { y: b.row * 53 } }));
  const original = sandbox.blocks.map(b => ({ ...b }));
  sandbox.settleBallShooterLayout();
  const floor = sandbox.PARAMS.viewportRows - 3;
  assert.equal(sandbox.blocks.length, input.length);
  for (const b of sandbox.blocks) {
    assert.ok(b.row >= original[b.id].row && b.row <= floor);
    assert.equal(b.sprite.y, b.row * 53);
    assert.equal(b.hitPoints, 123);
    assert.ok(b.row === floor || sandbox.blocks.some(s => s.row === b.row + 1 && b.col < s.col + s.length && s.col < b.col + b.length), 'each rigid brick has support or rests on the brick-area floor');
    assert.ok(!sandbox.blocks.some(s => s !== b && s.row === b.row && b.col < s.col + s.length && s.col < b.col + b.length), 'settling must not overlap bricks');
  }
  const first = JSON.stringify(sandbox.blocks);
  sandbox.settleBallShooterLayout();
  assert.equal(JSON.stringify(sandbox.blocks), first, 'settling an already supported layout is stable');
}
verify([{ col: 2, row: 5, length: 2 }, { col: 2, row: 10, length: 3 }, { col: 4, row: 13, length: 1 }]);
verify([{ col: 0, row: 1, length: 4 }, { col: 0, row: 4, length: 1 }, { col: 3, row: 6, length: 1 }]);
for (const rows of [17, 19, 20]) {
  sandbox.PARAMS.viewportRows = rows;
  const input = [];
  for (let row = 0; row < rows - 2; row++) for (let col = 0; col < 10;) {
    const length = Math.min(1 + ((row * 3 + col) % 4), 10 - col);
    if ((row + col) % 3 !== 0) input.push({ col, row, length });
    col += length;
  }
  verify(input);
}
console.log('Generated bricks settle onto supports without overlaps, deletion, HP changes or invading the launcher rows');
