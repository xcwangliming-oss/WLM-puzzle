with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'propTextureCache' in line and ('let' in line or 'const' in line or '{}' in line):
        print(f'{i}: {line.rstrip()}')
