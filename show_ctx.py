with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# Find the window export and show context
idx = content.find('(window as any).importPropImage')
if idx >= 0:
    print(repr(content[idx-50:idx+200]))
