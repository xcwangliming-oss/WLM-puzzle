with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'worldContainer.addChild' in s or 'blocksContainer.addChild' in s or 'app.stage.addChild' in s:
        if 'prop' in s.lower() or 'container' in s.lower():
            # don't print all of them, just a few context
            pass
    if 'const worldContainer =' in s or 'const blocksContainer =' in s:
        print(f'{i}: {s}')
    if 'addChild(blocksContainer)' in s or 'addChild(worldContainer)' in s or 'addChild(effectContainer)' in s:
        print(f'{i}: {s}')
    if 'zIndex' in s:
        print(f'{i}: {s[:130]}')
