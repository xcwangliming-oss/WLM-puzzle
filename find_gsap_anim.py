with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'blocksToRemove.forEach' in s and 'tl.to' in s:
        pass
    if 'tl.to(b.sprite.scale' in s:
        print(f'{i}: {s}')
        for j in range(max(0, i-5), min(i+10, len(lines))):
            print(f'{j+1}: {lines[j].strip()}')
