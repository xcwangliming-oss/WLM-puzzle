with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')

for i, line in enumerate(lines, 1):
    if 'function getSimPossibleMoves' in line.strip():
        print(f'Found at line {i}')
        for j in range(i-1, min(i+120, len(lines))):
            print(f'{j+1}: {lines[j].rstrip()[:130]}')
        break
