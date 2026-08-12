with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# Add window exports
ANCHOR = '(window as any).parseMaterialTextureName'
if '(window as any).importPropImage' not in content:
    if ANCHOR in content:
        content = content.replace(
            ANCHOR,
            "(window as any).importPropImage      = (role: 'machine'|'candy') => importPropImage(role);\n"
            "  (window as any).clearCustomPropImages = clearCustomPropImages;\n"
            "  " + ANCHOR,
            1
        )
        print("OK: window exports added")
    else:
        # Find any window as any to insert after
        idx = content.find('(window as any).')
        if idx >= 0:
            line_end = content.find('\n', idx)
            insert_after = line_end + 1
            inject = (
                "  (window as any).importPropImage      = (role: 'machine'|'candy') => importPropImage(role);\n"
                "  (window as any).clearCustomPropImages = clearCustomPropImages;\n"
            )
            content = content[:insert_after] + inject + content[insert_after:]
            print("OK: window exports injected after first (window as any)")
        else:
            print("ERROR: no (window as any) found")

# Add init calls
if 'loadCustomPropImages()' not in content:
    # Find the first (window as any).importPropImage and insert before it
    LOAD_ANCHOR = '(window as any).importPropImage'
    if LOAD_ANCHOR in content:
        idx = content.find(LOAD_ANCHOR)
        line_start = content.rfind('\n', 0, idx) + 1
        inject = '  loadCustomPropImages();\n  setTimeout(() => { initPropStylePanel(); }, 600);\n'
        content = content[:line_start] + inject + content[line_start:]
        print("OK: init calls added")
    else:
        print("WARN: could not add init calls")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
