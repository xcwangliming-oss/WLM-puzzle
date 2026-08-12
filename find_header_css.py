with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if '#game-header' in s or '.header-item' in s:
        print(f'{i}: {s}')
        if '{' in s or '}' in s:
            pass
