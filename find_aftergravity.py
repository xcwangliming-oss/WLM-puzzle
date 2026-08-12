with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'function afterGravityComplete' in line.strip():
        print(f'FOUND at line {i}')
        # Print the next 80 lines
        for j in range(i, min(i+80, len(lines))):
            print(f'{j+1}: {lines[j]}')
        break
