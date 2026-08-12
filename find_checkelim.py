with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'function checkEliminations' in line.strip():
        print(f'FOUND at line {i}')
        for j in range(i-1, min(i+120, len(lines))):
            print(f'{j+1}: {lines[j]}')
        break
