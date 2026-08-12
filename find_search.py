with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')

# Find searchDemoScript function definition
for i, line in enumerate(lines, 1):
    if 'function searchDemoScript' in line.strip():
        print(f'Found at line {i}')
        for j in range(i-1, min(i+100, len(lines))):
            print(f'{j+1}: {lines[j].rstrip()[:120]}')
        break
