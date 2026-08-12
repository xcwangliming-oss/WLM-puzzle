with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'customElimDelay =' in s or 'let customElimDelay' in s or 'const customElimDelay' in s:
        print(f'{i}: {s}')
        if 'customElimDelay' in s and ('checkEliminations' in s or 'let' in s):
            for j in range(max(0, i-5), min(i+10, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
