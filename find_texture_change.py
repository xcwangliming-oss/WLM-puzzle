with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if '变材质' in s or 'changeTexture' in s or 'setTheme' in s or 'updateAllBlockTextures' in s:
        print(f'{i}: {s}')
        if 'function' in s or '=>' in s:
            for j in range(max(0, i-2), min(i+15, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
