with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'function initAudioContext' in s:
        for j in range(i, min(i+60, len(lines))):
            print(f'{j+1}: {lines[j].strip()}')
        break
