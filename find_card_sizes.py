with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'style="gap: 10px;"' in s or 'width: 40px; height: 40px;' in s:
        print(f'{i}: {s}')
