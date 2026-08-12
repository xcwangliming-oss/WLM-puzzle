with open('src/style.css', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if '#game-header' in s or '.header-item' in s:
        print(f'{i}: {s}')
        if '{' in s or '}' in s:
            for j in range(max(0, i-5), min(i+15, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
