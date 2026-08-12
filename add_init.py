with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

if 'loadCustomPropImages()' not in content:
    LOAD_ANCHOR = '(window as any).importPropImage'
    idx = content.find(LOAD_ANCHOR)
    line_start = content.rfind('\n', 0, idx) + 1
    inject = '  loadCustomPropImages();\n  setTimeout(() => { initPropStylePanel(); }, 600);\n'
    content = content[:line_start] + inject + content[line_start:]
    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("OK: init calls added")
else:
    print("Already present")
