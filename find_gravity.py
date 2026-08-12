with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

lines = content.split('\n')

for i, line in enumerate(lines, 1):
    stripped = line.strip()
    if 'function applyGravity' in stripped or 'function waitForPhysics' in stripped:
        print(f'{i}: {stripped[:120]}')
