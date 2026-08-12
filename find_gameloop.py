with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'function updateGameLoop' in line:
        print(f'Found at {i}')
        for j in range(i, min(i+250, len(lines))):
            s = lines[j].strip()
            if ('speed' in s.lower() or 'scroll' in s.lower() or 'worldcontainer' in s.lower() or 'delta' in s.lower() or 'top' in s.lower() or 'factor' in s.lower()):
                print(f'{j+1}: {s[:130]}')
        break
