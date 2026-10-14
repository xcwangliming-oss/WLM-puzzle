const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const collisionSource = fs.readFileSync(path.join(__dirname, '../src/ballShooterCollision.ts'), 'utf8');
const collision = { exports: {} };
vm.runInNewContext(ts.transpileModule(collisionSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: collision.exports });
const { sweepBallAgainstBlock } = collision.exports;
const source = fs.readFileSync(path.join(__dirname, '../src/ballShooterMode.ts'), 'utf8');
const ast = ts.createSourceFile('ballShooterMode.ts', source, ts.ScriptTarget.Latest, true);
const systemClass = ast.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'BallShooterSystem');
const method = systemClass.members.find(node => node.name?.getText(ast) === 'updateBallsPhysics');
const compiled = ts.transpileModule(`class TestSystem { ${method.getText(ast)} } globalThis.system = new TestSystem();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
function block(x, y, length = 1, hp = 1000) {
  return { sprite: { x, y }, length, hitPoints: hp, col: -10, row: -10 };
}
function setup(blocks, values) {
  const sandbox = { sweepBallAgainstBlock };
  vm.runInNewContext(compiled, sandbox);
  const system = sandbox.system;
  const ball = {
    active: true, returning: false, radius: 6.5,
    sprite: { position: { set() {} } },
    trailGraphics: { clear() {}, poly() {}, fill() {} },
    ...values,
  };
  system.balls = [ball];
  system.getBlocksCallback = () => blocks;
  system.getBoardDimensionsCallback = () => ({ width: 500, height: 1060, cellSize: 50 });
  system.createSparks = () => {};
  system.updateReadyBallCountText = () => {};
  system.collectBall = b => { b.active = false; };
  system.hits = [];
  system.handleBlockHit = (b, x, y) => {
    b.hitPoints--;
    system.hits.push({ block: b, x, y });
  };
  return { system, ball };
}

// Reproduce the old nearest-edge mistake: after a half-step at (102,99),
// the upper brick's bottom is closer than its right face (1px versus 2px).
// The actual trajectory enters the continuous RIGHT face first at y=104.625.
for (const reverse of [false, true]) {
  const bricks = [block(50, 50), block(50, 100)];
  if (reverse) bricks.reverse();
  const { system, ball } = setup(bricks, { x: 110, y: 109, vx: -16, vy: -20 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vx, 16, 'vertical wall reflects horizontal speed');
  assert.equal(ball.vy, -20, 'row seam must NOT bounce an upward ball down');
  assert.equal(system.hits.length, 1, 'one wall contact causes one damage event');
  assert.equal(system.hits[0].y, 104.625, 'damage belongs to first contact, not the penetrated corner');
}

// Mirrored wall and two horizontally joined bricks use the same rule.
{
  const { system, ball } = setup([block(150, 50), block(150, 100)], { x: 140, y: 109, vx: 16, vy: -20 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vx, -16);
  assert.equal(ball.vy, -20);
}
for (const reverse of [false, true]) {
  const bricks = [block(50, 100), block(100, 100)];
  if (reverse) bricks.reverse();
  const { system, ball } = setup(bricks, { x: 109, y: 90, vx: -20, vy: 16 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vx, -20, 'column seam must not add a sideways bounce');
  assert.equal(ball.vy, -16);
  assert.equal(system.hits.length, 1);
}

// Repeated upward travel across many row joints, changing brick lengths,
// high speed, and both block orders. Only side velocity is reflected.
for (const reverse of [false, true]) {
  for (const yOffset of [0, 0.2, 6.5, 17]) {
    const bricks = [];
    for (let row = 1; row <= 18; row++) {
      const length = row % 2 + 1;
      bricks.push(block(150 - length * 50, row * 50, length));
      bricks.push(block(350, row * 50, length));
    }
    if (reverse) bricks.reverse();
    const { system, ball } = setup(bricks, { x: 250, y: 850 + yOffset, vx: 120, vy: -25 });
    for (let frame = 0; frame < 20; frame++) {
      system.updateBallsPhysics(1);
      assert.equal(ball.vy, -25, `no false vertical bounce at seam, frame ${frame}`);
      assert.ok(ball.x >= 156.5 && ball.x <= 343.5, 'ball stays outside both solid walls');
    }
    assert.ok(system.hits.length > 10, 'trajectory actually exercises repeated wall contacts');
  }
}

// Sweep must hit the first solid face even when an entire brick is crossed
// between the old two sample points, and use live sprite rather than stale col.
{
  const { system, ball } = setup([block(100, 100)], { x: 450, y: 125, vx: -2000, vy: 0 });
  system.updateBallsPhysics(0.2);
  assert.equal(ball.vx, 2000);
  assert.equal(system.hits.length, 1);
  assert.ok(ball.x > 156.5);
}

// A real exposed bottom/ledge STILL bounces downward; actual empty corridors
// remain passable. This is not a blanket suppression of downward reflection.
{
  const { system, ball } = setup([block(100, 100)], { x: 125, y: 170, vx: 0, vy: -30 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vy, 30);
  assert.equal(system.hits.length, 1);
}
{
  const { system, ball } = setup([block(50, 100), block(150, 100)], { x: 125, y: 180, vx: 0, vy: -100 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vy, -100);
  assert.equal(ball.y, 80);
  assert.equal(system.hits.length, 0);
}
{
  const { system, ball } = setup([block(100, 100)], { x: 170, y: 170, vx: -30, vy: -30 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vx, 30);
  assert.equal(ball.vy, 30, 'true exposed 45-degree corner reflects both axes');
  assert.equal(system.hits.length, 1);
}

// Destroyed blocks disappear from collision immediately for following balls.
{
  const bricks = [block(100, 100, 1, 1)];
  const { system, ball } = setup(bricks, { x: 170, y: 125, vx: -30, vy: 0 });
  system.balls.push({ ...ball, sprite: { position: { set() {} } } });
  system.updateBallsPhysics(1);
  assert.equal(bricks[0].hitPoints, 0);
  assert.equal(system.hits.length, 1);
  assert.equal(system.balls[1].vx, -30, 'following ball passes through the destroyed block');
}

// Board wall and bottom collection participate in the same earliest-hit sweep.
{
  const { system, ball } = setup([], { x: 20, y: 100, vx: -30, vy: -10 });
  system.updateBallsPhysics(1);
  assert.equal(ball.vx, 30);
  assert.equal(ball.vy, -10);
}
{
  const { system, ball } = setup([], { x: 250, y: 1030, vx: 10, vy: 30 });
  system.updateBallsPhysics(1);
  assert.equal(ball.returning, true);
  assert.equal(ball.y, 1040);
  assert.equal(ball.vx, 0);
  assert.equal(ball.vy, 0);
}
console.log('Continuous brick walls: row/column seams, first-contact reflection, fast shots, real ledges, destruction and collection passed');
