with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'function changeColor' in s or 'function changeCustomTwoColor' in s or 'function changeRainbow' in s:
        print(f'{i}: {s}')
