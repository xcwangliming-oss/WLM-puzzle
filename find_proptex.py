with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'function getPropTexture' in line.strip() or ('propTextureCache' in line.strip() and i < 100):
        print(f'{i}: {line.rstrip()}')
        for j in range(i, min(i+100, len(lines))):
            print(f'{j+1}: {lines[j].rstrip()}')
        break
