const fs=require('fs');
let ts=fs.readFileSync('src/main.ts','utf8'); 
const targetElim = `    // Process all identified eliminations`;
const replElim = `    triggerMachineHeadAttack(); // TR-ANIM: Trigger attack state on elimination\n    // Process all identified eliminations`;

const targetNoElim = `    // No full rows to eliminate ?combo chain is over`;
const replNoElim = `    revertMachineHeadIdle(); // TR-ANIM: Revert to idle state when no more eliminations\n    // No full rows to eliminate ?combo chain is over`;

ts = ts.replace(targetElim, replElim); 
ts = ts.replace(targetNoElim, replNoElim); 
fs.writeFileSync('src/main.ts', ts);
