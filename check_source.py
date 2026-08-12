with open('src/main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

print('showMaterialMapperDialog in source:', 'showMaterialMapperDialog' in content)
print('single-char colors in source:', '|红|蓝|绿|黄|粉)' in content)
print('Source file size (bytes):', len(content))

# Show the parseMaterialTextureName function
idx = content.find('function parseMaterialTextureName')
if idx >= 0:
    print('parseMaterialTextureName function:')
    print(content[idx:idx+500])
