with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'spawnProp' in s or 'prop' in s.lower() and 'addchild' in s.lower():
        print(f'{i}: {s}')
    if 'b.isProp' in s and 'addChild' in s:
        print(f'{i}: {s}')
