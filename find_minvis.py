with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'minVisibleY' in s:
        print(f'{i}: {s}')
        if i > 21100:
            for j in range(i-20, i):
                print(f'{j}: {lines[j-1].rstrip()}')
