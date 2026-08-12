with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'isPlayingScript' in line:
        print(f'{i}: {line.strip()[:130]}')
