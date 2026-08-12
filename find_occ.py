with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

lines = content.split('\n')

# Find getGridOccupancy
for i, line in enumerate(lines, 1):
    if 'getGridOccupancy' in line or 'GridOccupancy' in line:
        print(f'{i}: {line.strip()}')
