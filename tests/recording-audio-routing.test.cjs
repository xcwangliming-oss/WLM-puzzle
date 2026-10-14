const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
const selected = new Set(['audioCtx', 'recAudioDest', 'audioSourcesInitialized',
  'recordingAudioSources', 'concentricSoundLastPlayback', 'connectAudioForRecording',
  'initAudioContext', 'playSound']);
const fragments = ast.statements.filter(statement => {
  if (ts.isFunctionDeclaration(statement)) return selected.has(statement.name?.text);
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.some(d => selected.has(d.name.getText(ast)));
  }
  return false;
}).map(statement => statement.getText(ast)).join('\n');
const nodes = [];
const output = {};
const record = { stream: { getAudioTracks: () => [{ kind: 'audio' }] } };
let resumes = 0;
class Context {
  constructor() { this.destination = output; this.state = 'running'; }
  createMediaStreamDestination() { return record; }
  createMediaElementSource(audio) {
    assert.ok(!nodes.some(node => node.audio === audio), 'an element must only be captured once');
    const node = { audio, outputs: [], connect(destination) { this.outputs.push(destination); } };
    nodes.push(node);
    return node;
  }
  resume() { resumes++; this.state = 'running'; return Promise.resolve(); }
}
function audio() { return { currentTime: 7, plays: 0, play() { this.plays++; return Promise.resolve(); } }; }
const sounds = { fall: audio(), propElim: audio(), spawn: audio(), collect: audio(),
  obtain: audio(), combos: [audio()], vocals: { good: audio() } };
const sandbox = { window: { AudioContext: Context }, sounds, isConcentricObstacleMode: false,
  console, WeakMap, Date };
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(fragments, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText + '\nthis.player = playSound; this.context = () => audioCtx;', sandbox);

(async () => {
  // Recording can start before any lazy launch/impact voice exists.
  vm.runInContext('initAudioContext()', sandbox);
  const initialCount = nodes.length;
  const launch = audio();
  const impact = audio();
  sandbox.player(launch);
  sandbox.player(impact);
  for (let i = 0; i < 30; i++) sandbox.player(launch);
  assert.equal(nodes.length, initialCount + 2, 'lazy voices route once and remain reusable');
  assert.equal(launch.plays, 31, 'every emission still plays immediately');
  assert.equal(impact.plays, 1);
  assert.equal(launch.currentTime, 0);
  for (const node of nodes) {
    assert.ok(node.outputs.includes(output), 'sound must stay audible on the page');
    assert.ok(node.outputs.includes(record), 'sound must also reach the recording audio track');
  }
  sandbox.context().state = 'suspended';
  const resumedSound = audio();
  sandbox.player(resumedSound);
  await Promise.resolve();
  assert.equal(resumes, 1);
  assert.equal(resumedSound.plays, 1);
  assert.match(source, /ballShooterSystem\.setSoundPlayer\(playSound\)/);
  assert.match(source, /playSound\(ballShooterShatterSound\)/);
  assert.match(source, /tracksMOV\.push\(audioTrack\)/);
  console.log('Recording captures lazy launch, impact and shatter sounds without double-routing');
})().catch(err => { console.error(err); process.exitCode = 1; });
