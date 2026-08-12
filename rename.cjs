const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public/assets/宝石块儿');
const files = fs.readdirSync(dir);

const colorMap = {
  '粉': 'pink',
  '红': 'red',
  '绿': 'green',
  '蓝': 'blue',
  '黄': 'yellow'
};

files.forEach(f => {
  let newName = f;
  // f is like "粉1?1.png" where ? is some character.
  // We can just extract the color character, and the length digit.
  // Assuming format is [color]1[separator][length].png
  const colorChar = f.charAt(0);
  if (colorMap[colorChar]) {
    const color = colorMap[colorChar];
    // Find the number before .png
    const match = f.match(/(\d)\.png$/);
    if (match) {
      const length = match[1];
      const newPath = path.join(dir, `${color}-${length}.png`);
      fs.renameSync(path.join(dir, f), newPath);
      console.log(`Renamed ${f} to ${color}-${length}.png`);
    }
  }
});
