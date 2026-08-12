with open('src/main.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'showMaterialMapperDialog' in l and 'async function' in l:
        print(f'DEFINITION at line {i+1}: {l.strip()}')
    if 'showMaterialMapperDialog(selectedFiles)' in l:
        print(f'CALL at line {i+1}: {l.strip()}')
    if 'proceed = confirm' in l:
        print(f'SOFT-CHECK at line {i+1}: {l.strip()}')
