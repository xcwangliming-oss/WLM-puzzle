with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines, 1):
    if 'script' in l.lower() or 'stylesheet' in l.lower() or 'src=' in l.lower():
        print(f'{i}: {l.rstrip()}')
