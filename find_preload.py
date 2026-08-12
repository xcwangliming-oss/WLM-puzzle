with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'gemShatterTextures[c][i] = tex;' in s:
        print(f'{i}: {s}')
        for j in range(max(0, i-5), min(i+5, len(lines))):
            print(f'{j+1}: {lines[j].strip()}')
        break
