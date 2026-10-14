const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real launch/update/interaction code with lightweight render/audio
// doubles, and a controllable wall clock (no browser autoplay dependency).
class DisplayObject {
  constructor() {
    this.children = [];
    this.visible = true;
    this.position = { set: (x, y) => { this.x = x; this.y = y; } };
    this.handlers = {};
  }
  addChild(child) { this.children.push(child); return child; }
  on(event, handler) { this.handlers[event] = handler; }
  toLocal(point) { return point; }
  circle() { return this; }
  poly() { return this; }
  fill() { return this; }
  clear() {}
}
let now = 0;
const playedAt = [];
const players = [];
class FakeAudio {
  constructor(url) { this.url = url; players.push(this); }
  load() { this.loaded = true; }
  play() { playedAt.push(now); return Promise.resolve(); }
}
const source = fs.readFileSync(path.join(__dirname, '../src/ballShooterMode.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = {
  exports: {}, Audio: FakeAudio, performance: { now: () => now },
  require(name) {
    if (name === 'pixi.js') return { Container: DisplayObject, Graphics: DisplayObject, Text: DisplayObject };
    if (name === 'gsap') return {};
    if (name === './ballShooterCollision') {
      const collisionSource = fs.readFileSync(path.join(__dirname, '../src/ballShooterCollision.ts'), 'utf8');
      const collision = { exports: {} };
      vm.runInNewContext(ts.transpileModule(collisionSource, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText, { exports: collision.exports });
      return collision.exports;
    }
    if (name === './cannonAim') return { getCannonMuzzle: (x, y, angle, length) => ({
      x: x + Math.cos(angle) * length, y: y + Math.sin(angle) * length,
    }) };
    if (name === './cannonArtwork') {
      const artworkSource = fs.readFileSync(path.join(__dirname, '../src/cannonArtwork.ts'), 'utf8');
      const artwork = { exports: {} };
      vm.runInNewContext(ts.transpileModule(artworkSource, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText, { exports: artwork.exports });
      return artwork.exports;
    }
    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.png')) return name;
    throw new Error(`Unexpected import: ${name}`);
  },
};
vm.runInNewContext(compiled, sandbox);
const system = new sandbox.exports.BallShooterSystem();
system.enabled = true;
system.updateSparks = () => {};
system.createSparks = () => {};
system.getBoardDimensionsCallback = () => ({ width: 530, height: 1060, cellSize: 53 });
system.cannonX = 238.5;
system.cannonY = 1034;
system.setBallCount(3);
system.startLaunch();
assert.equal(playedAt.length, 0, 'sound belongs to ball emission, not the launch button');
assert.equal(system.readyBallCount, 0);
assert.equal(system.ballsToLaunch, 3);
assert.equal(system.cannonCountText.text, 'x0', 'display is recovered ammo, not total ball count');
system.update(100);
assert.equal(system.ballsToLaunch, 0);
assert.equal(playedAt.length, 2, 'balls 1 and 3 sound, ball 2 is quiet even within the same frame');
assert.equal(system.activeBallCount, 3);

// Real physics arrival collects only that ball and makes it available again.
const recovered = system.balls[0];
recovered.returning = true;
recovered.x = system.cannonX;
recovered.y = system.cannonY;
system.updateBallsPhysics(0);
assert.equal(system.readyBallCount, 1);
assert.equal(system.activeBallCount, 2);
assert.equal(system.cannonCountText.text, 'x1');
// Control later recovery explicitly so incidental wall bounces cannot affect
// the exact emission/audio counts in the repeated relaunch scenarios below.
system.updateBallsPhysics = () => {};
const survivors = system.balls.filter(ball => ball.active);
const original = survivors.map(ball => ({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }));
system.aimAngle = -0.6;
system.startLaunch();
assert.equal(system.ballsToLaunch, 1, 'relaunch fires only the one collected ball');
assert.equal(system.readyBallCount, 0);
for (let i = 0; i < survivors.length; i++) {
  assert.equal(survivors[i].active, true, 'old balls stay active');
  assert.equal(survivors[i].sprite.visible, true);
  assert.deepEqual({ x: survivors[i].x, y: survivors[i].y, vx: survivors[i].vx, vy: survivors[i].vy }, original[i]);
}
now = 40;
system.update(3);
assert.equal(playedAt.length, 2, 'the fourth emitted ball stays quiet on partial relaunch');
assert.equal(recovered.active, true, 'only inactive recovered sprite is reused');
assert.ok(recovered.vx > 0 && recovered.vy < 0, 'new ball uses new aim');
assert.equal(system.balls.length, 3, 'no extra balls are created on relaunch');
assert.equal(system.activeBallCount, 3);
system.startLaunch();
assert.equal(system.ballsToLaunch, 0, 'zero recovered ammo cannot duplicate active balls');

// Repeated partial recovery/relaunch conserves the original total.
for (let i = 0; i < 30; i++) {
  system.collectBall(system.balls.find(ball => ball.active));
  system.startLaunch();
  now += 40;
  system.update(3);
  assert.equal(system.readyBallCount + system.ballsToLaunch + system.activeBallCount, 3);
  assert.equal(system.balls.length, 3);
}
assert.equal(playedAt.length, 17, '34 emissions produce 17 sounds, including partial relaunches');
assert.equal(players.length, 8, 'audio voice pool stays bounded');

const stage = new DisplayObject();
system.app = { stage, screen: {} };
let playMode = true;
system.isPlayModeCallback = () => playMode;
system.updateAim = () => {};
system.setupInteraction();
system.collectBall(system.balls.find(ball => ball.active));
stage.handlers.pointerdown({ global: { x: 250, y: 800 } });
assert.equal(system.isAiming, true, 'can aim again while old balls are still active');
stage.handlers.pointerup();
assert.equal(system.isAiming, false);
assert.equal(system.ballsToLaunch, 1);
assert.equal(system.activeBallCount, 2, 'release does not discard the old shot');
system.update(3);

// Pending launch queue is also preserved during a new aim/partial relaunch.
system.setBallCount(5);
system.resetAllBalls();
system.startLaunch();
system.update(3);
assert.equal(system.ballsToLaunch, 4);
system.collectBall(system.balls.find(ball => ball.active));
stage.handlers.pointerdown({ global: { x: 250, y: 800 } });
system.update(10);
assert.equal(system.ballsToLaunch, 4, 'pending emission pauses while aiming');
stage.handlers.pointerup();
assert.equal(system.ballsToLaunch, 5, 'pending four plus recovered one are queued, not discarded');
system.update(100);
assert.equal(system.activeBallCount, 5);
assert.equal(system.balls.length, 5);
assert.equal(system.readyBallCount, 0);

system.setBallCount(7);
assert.equal(system.readyBallCount, 2, 'count increase adds only the difference');
system.setBallCount(2);
assert.equal(system.activeBallCount, 5, 'count decrease does not erase active balls');
for (const ball of system.balls) system.collectBall(ball);
assert.equal(system.readyBallCount, 2, 'excess balls retire after return');
assert.equal(system.cannonCountText.text, 'x2');

playMode = false;
stage.handlers.pointerdown({ global: { x: 250, y: 800 } });
assert.equal(system.isAiming, false, 'drawing mode still blocks aiming');
playMode = true;
system.getBlocksCallback = () => [{ length: 1, hitPoints: 10, sprite: { visible: true, x: 0, y: 0 } }];
stage.handlers.pointerdown({ global: { x: 25, y: 25 } });
assert.equal(system.isAiming, false, 'brick dragging retains priority');

// Every aim direction kicks backwards; only the tube moves, not the base.
system.customCannonSprite = new DisplayObject();
system.customCannonBarrelSprite = new DisplayObject();
system.customCannonSprite.position.set(0, 26);
system.cannonPivotOffsetY = -12;
for (const angle of [-2.6, -Math.PI / 2, -0.5]) {
  system.cannonRecoilOffset = 0;
  system.aimAngle = angle;
  system.triggerCannonRecoil();
  const kick = system.cannonRecoilOffset;
  assert.ok(kick > 0 && kick <= 53 * 0.06);
  assert.ok(Math.abs(system.customCannonBarrelSprite.x + Math.cos(angle) * kick) < 1e-9);
  assert.ok(Math.abs(system.customCannonBarrelSprite.y - (-12 - Math.sin(angle) * kick)) < 1e-9);
  assert.equal(system.customCannonSprite.x, 0);
  assert.equal(system.customCannonSprite.y, 26);
  const muzzle = system.getMuzzlePosition();
  assert.ok(Math.abs(muzzle.x - (system.cannonX + Math.cos(angle) * (system.cannonMuzzleLength - kick))) < 1e-9);
  system.updateCannonRecoil(150 / 16.6);
  assert.ok(system.cannonRecoilOffset < kick * 0.07, 'tube quickly springs back');
}
for (let i = 0; i < 100; i++) system.triggerCannonRecoil();
assert.ok(system.cannonRecoilOffset <= 53 * 0.06, 'rapid fire cannot accumulate displacement');
system.resetAllBalls();
assert.equal(system.cannonRecoilOffset, 0);
assert.equal(Math.abs(system.customCannonBarrelSprite.x), 0);
assert.equal(system.customCannonBarrelSprite.y, -12);

const routedSounds = [];
system.setSoundPlayer(sound => { routedSounds.push(sound); sound.currentTime = 0; sound.play(); });
system.playLaunchSound();
assert.equal(routedSounds.length, 1, 'launch must use the recording-compatible player');
assert.ok(routedSounds[0].url.endsWith('ball-launch.mp3'));
assert.equal(routedSounds[0].volume, 0.225, 'launch volume is half the previous 0.45');
assert.ok(system.launchSounds.every(sound => sound.volume === 0.225));
system.triggerBlockHighlight = () => {};
const hitBlock = { hitPoints: 5 };
system.handleBlockHit(hitBlock, 1, 1);
assert.equal(hitBlock.hitPoints, 4);
assert.equal(routedSounds.length, 2, 'non-fatal brick hits play the impact sound');
assert.ok(routedSounds[1].url.endsWith('ball-impact-tight.wav'));
assert.equal(routedSounds[1].volume, 0.0875, 'impact volume is halved again; launch stays unchanged');
assert.ok(system.impactSounds.every(sound => sound.loaded && sound.preload === 'auto'), 'impact voices preload before the first collision');
for (let i = 0; i < 40; i++) system.playImpactSound();
assert.equal(system.impactSounds.length, 16, 'dense collision audio uses a bounded voice pool');
assert.equal(routedSounds.length, 22, '41 collisions produce 21 recording-routed sounds plus the launch');
system.resetAllBalls();
system.setBallCount(500);
system.startLaunch();
assert.equal(system.ballsToLaunch, 500, '500 balls are queued without the old 100-ball limit');
system.update(10000);
assert.equal(routedSounds.length, 272, '500 balls produce 250 recording-routed launch sounds after reset');
assert.equal(system.activeBallCount, 500, 'all 500 balls emit successfully');
assert.equal(system.readyBallCount + system.ballsToLaunch + system.activeBallCount, 500);
const editorHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.match(editorHtml, /id="slider-ballshooter-count"[^>]*max="500"/);
console.log('Ball Shooter per-ball audio, impact routing, partial relaunch, ammo conservation and recoil passed');
