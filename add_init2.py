with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# Check if there's actually a call (not just definition)
call_str = 'loadCustomPropImages();\n'
if call_str not in content:
    LOAD_ANCHOR = '  (window as any).importPropImage'
    if LOAD_ANCHOR in content:
        content = content.replace(
            LOAD_ANCHOR,
            '  loadCustomPropImages();\n  setTimeout(() => { initPropStylePanel(); }, 600);\n  (window as any).importPropImage',
            1
        )
        with open('src/main.ts', 'w', encoding='utf-8') as f:
            f.write(content)
        print("OK: init calls added")
    else:
        print("ERROR: anchor not found")
else:
    print("Already has call")
