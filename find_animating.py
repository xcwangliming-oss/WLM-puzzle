with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'isAnimating = false;' in s:
        print(f'{i}: {s}')
        for j in range(max(0, i-20), min(i+10, len(lines))):
            if 'setTimeout' in lines[j] or 'isAnimating = false' in lines[j]:
                print(f'{j+1}: {lines[j].strip()}')
