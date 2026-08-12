const fs=require('fs');
let ts=fs.readFileSync('src/main.ts','utf8'); 
ts=ts.replace('head && head.play && head.textures !== machineAttackTextures', 'head && (head instanceof PIXI.AnimatedSprite) && head.textures !== machineAttackTextures'); 
ts=ts.replace('head && head.play && head.textures === machineAttackTextures', 'head && (head instanceof PIXI.AnimatedSprite) && head.textures === machineAttackTextures'); 
fs.writeFileSync('src/main.ts', ts);
