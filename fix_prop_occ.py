with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

OLD = """      if (b.isProp) {

        getPropOccupiedColumns(b).forEach(col => {

          if (col >= 0 && col < PARAMS.gridCols) grid[b.row][col] = 1;

        });

        return;

      }"""

NEW = """      if (b.isProp) {

        // 道具占据全部 length 列（含机器头），确保消除判断正确
        // getPropOccupiedColumns 只返回糖果列，漏掉机器头导致满行永远判断失败

        for (let c = 0; c < b.length; c++) {

          if (b.col + c >= 0 && b.col + c < PARAMS.gridCols) grid[b.row][b.col + c] = 1;

        }

        return;

      }"""

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fix applied successfully!")
else:
    # Try with \r\n
    OLD_CRLF = OLD.replace('\n', '\r\n')
    NEW_CRLF = NEW.replace('\n', '\r\n')
    if OLD_CRLF in content:
        content = content.replace(OLD_CRLF, NEW_CRLF, 1)
        with open('src/main.ts', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fix applied with CRLF!")
    else:
        print("ERROR: target not found!")
        # Show a snippet around the isProp area
        idx = content.find('b.isProp')
        if idx >= 0:
            print("Found isProp at index", idx)
            print(repr(content[idx:idx+300]))
