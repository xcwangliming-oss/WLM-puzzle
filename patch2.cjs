const fs=require('fs');
let ts=fs.readFileSync('src/main.ts','utf8'); 
const target = `    if (customPropMachineImg) {
      const msc = Math.min(machineW / customPropMachineImg.naturalWidth, cellSize / customPropMachineImg.naturalHeight);`;
const repl = `    if (customPropMachineImg && machineIdleTextures.length === 0) {
      const msc = Math.min(machineW / customPropMachineImg.naturalWidth, cellSize / customPropMachineImg.naturalHeight);`;
ts = ts.replace(target, repl); 
fs.writeFileSync('src/main.ts', ts);
