const fs=require('fs');
let ts=fs.readFileSync('src/main.ts','utf8'); 
const target = `    const texture = getPropTexture(length, propDir);



    sprite = new PIXI.Sprite(texture);`;
const repl = `    const texture = getPropTexture(length, propDir);
    if (machineIdleTextures.length > 0 && customPropMachineImg) {
      const container = new PIXI.Container();
      const baseSprite = new PIXI.Sprite(texture);
      const headSprite = new PIXI.AnimatedSprite(machineIdleTextures);
      
      const machineW = PARAMS.cellSize;
      const msc = Math.min(machineW / customPropMachineImg.naturalWidth, PARAMS.cellSize / customPropMachineImg.naturalHeight);
      const mW = customPropMachineImg.naturalWidth * msc;
      const mH = customPropMachineImg.naturalHeight * msc;
      const w2 = length * PARAMS.cellSize;
      
      const mX = propDir === 'left' ? w2 - machineW + (machineW - mW) / 2 : (machineW - mW) / 2;
      const mY = (PARAMS.cellSize - mH) / 2;
      
      headSprite.width = mW;
      headSprite.height = mH;
      headSprite.x = mX;
      headSprite.y = mY;
      
      if (propDir === 'right') {
        headSprite.x = mX + mW;
        headSprite.scale.x = -Math.abs(headSprite.scale.x);
      }
      
      headSprite.animationSpeed = 0.2;
      headSprite.play();
      
      container.addChild(baseSprite);
      container.addChild(headSprite);
      sprite = container as unknown as PIXI.Sprite;
    } else {
      sprite = new PIXI.Sprite(texture);
    }`;
ts = ts.replace(target, repl); 
fs.writeFileSync('src/main.ts', ts);
