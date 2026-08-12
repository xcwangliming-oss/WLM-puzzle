with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'DEFAULT_SOUND_SOURCES' in s:
        print(f'{i}: {s}')
        if 'const DEFAULT_SOUND_SOURCES =' in s:
            for j in range(i, min(i+15, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
