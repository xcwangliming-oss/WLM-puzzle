with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'setRecordButtonContent' in s and 'function' not in s:
        print(f'{i}: {s}')
