with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

call_str = 'loadCustomPropImages();\n'
if call_str not in content:
    ANCHOR = "(window as any).importPropImage      = (role: 'machine'|'candy') => importPropImage(role);"
    if ANCHOR in content:
        content = content.replace(
            ANCHOR,
            "loadCustomPropImages();\nsetTimeout(() => { initPropStylePanel(); }, 600);\n" + ANCHOR,
            1
        )
        with open('src/main.ts', 'w', encoding='utf-8') as f:
            f.write(content)
        print("OK: init calls added")
    else:
        print("ERROR: anchor not found")
        idx = content.find('(window as any).importPropImage')
        print("Found at:", idx)
        print(repr(content[idx:idx+120]))
else:
    print("Already has call")
