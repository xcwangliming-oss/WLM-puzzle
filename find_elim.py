with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

keywords = ['checkAndEliminate', 'eliminateRow', 'isRowFull', 'fullRows', 'clearRow', 'rowIsFull', 'eliminate']
for kw in keywords:
    idx = content.find(kw)
    if idx >= 0:
        line_no = content[:idx].count('\n') + 1
        print(f'{kw}: line {line_no}')
    else:
        print(f'{kw}: NOT FOUND')
