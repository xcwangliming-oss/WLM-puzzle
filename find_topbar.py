with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'LEVEL:' in s or 'SCORE:' in s or 'top-bar' in s.lower() or 'id="score-val"' in s:
        print(f'{i}: {s}')
        if '<div' in s and 'absolute' in s:
            for j in range(max(0, i-5), min(i+10, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
        elif 'style' in s:
            pass
