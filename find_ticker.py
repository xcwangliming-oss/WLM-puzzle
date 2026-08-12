with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'app.ticker.add' in line or 'ticker.add' in line:
        print(f'{i}: {line.strip()[:150]}')
        for j in range(i, min(i+100, len(lines))):
            s = lines[j].strip()
            if 'speed' in s.lower() or 'worldcontainer.y' in s.lower() or 'delta' in s.lower():
                print(f'{j+1}: {s[:130]}')
        break
