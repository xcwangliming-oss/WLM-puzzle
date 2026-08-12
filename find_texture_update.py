with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'function updateAllBlockTextures' in s or 'function updateBlockTextures' in s or 'function changeTextureMode' in s or 'btnMaterialMode.onclick = async () => {' in s:
        print(f'{i}: {s}')
        if 'btnMaterialMode.onclick' in s:
            pass
        else:
            for j in range(i, min(i+25, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
