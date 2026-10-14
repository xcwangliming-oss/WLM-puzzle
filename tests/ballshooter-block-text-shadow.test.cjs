const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/ballShooterMode.ts'), 'utf8');
const ast = ts.createSourceFile('ballShooterMode.ts', source, ts.ScriptTarget.Latest, true);
const systemClass = ast.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'BallShooterSystem');
const method = systemClass.members.find(node => node.name?.getText(ast) === 'randomizeHPForBlocks');
const compiled = ts.transpileModule(`class TestSystem { ${method.getText(ast)} } globalThis.system = new TestSystem();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
class Text {
  constructor(options) {
    Object.assign(this, options);
    this.anchor = { set: value => { this.anchorValue = value; } };
    this.position = { set: (x, y) => { this.x = x; this.y = y; } };
  }
}
const sandbox = { PIXI: { Text } };
vm.runInNewContext(compiled, sandbox);
const system = sandbox.system;
system.getBoardDimensionsCallback = () => ({ cellSize: 53 });
system.blockTextsContainer = { addChild: text => { text.parent = system.blockTextsContainer; } };
const block = { length: 2, sprite: { x: 53, y: 106 } };
const prop = { isProp: true };
system.randomizeHPForBlocks([block, prop]);
const text = block.hpTextSprite;
assert.equal(text.style.dropShadow, false, 'new block labels have no shadow');
assert.equal(text.style.fill, 0xffffff, 'white fill is preserved');
assert.equal(text.style.stroke.width, 4, 'readable outline is preserved');
assert.equal(text.eventMode, 'none', 'labels do not intercept block dragging');
assert.equal(text.x, 106);
assert.equal(text.y, 132.5);
assert.equal(prop.hpTextSprite, undefined, 'props are unaffected');
text.style.dropShadow = { alpha: 0.7 };
block.sprite.x = 159;
system.randomizeHPForBlocks([block]);
assert.equal(block.hpTextSprite, text, 'existing labels are reused');
assert.equal(text.style.dropShadow, false, 'reused labels also lose any old shadow');
assert.equal(text.x, 212);
assert.equal(text.text, String(block.hitPoints));
console.log('Ball Shooter block labels are shadow-free on creation and reuse');
