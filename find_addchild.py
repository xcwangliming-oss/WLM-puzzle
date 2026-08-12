with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'blocksContainer.addChild' in s or 'worldContainer.addChild' in s:
        print(f'{i}: {s}')
    if 'app.stage.addChild' in s:
        print(f'{i}: {s}')
