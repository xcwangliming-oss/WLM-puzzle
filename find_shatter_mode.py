with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'shatterMode === 3' in s or 'mode === 3' in s or 'blast' in s.lower() or 'playRowShatterEffect' in line:
        if i > 21000 and i < 22500:
            print(f'{i}: {s[:130]}')
