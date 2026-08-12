with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'function playRowShatterEffect' in line:
        print(f'{i}: {line.strip()}')
        for j in range(i, min(i+50, len(lines))):
            s = lines[j].strip()
            print(f'{j+1}: {s}')
        break
