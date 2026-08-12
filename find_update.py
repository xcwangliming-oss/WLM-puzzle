with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'function update(' in line:
        print(f'Found update at line {i}')
        # print some lines from update
        for j in range(i, min(i+200, len(lines))):
            s = lines[j].strip()
            if 'speed' in s.lower() or 'scroll' in s.lower() or 'worldcontainer.y' in s.lower():
                print(f'{j+1}: {s[:130]}')
        break
