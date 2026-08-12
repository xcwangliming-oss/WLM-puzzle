with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'getPropTexture' in s or 'propTextureCache' in s or 'createProp' in s or 'spawnProp' in s:
        pass
    if 'b.sprite' in s and 'addChild' in s:
        print(f'{i}: {s}')
    if 'b.sprite =' in s or 'b.sprite = new' in s:
        print(f'{i}: {s}')
