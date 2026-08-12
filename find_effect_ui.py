with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if '粉色碎石' in s or '默认碎屏' in s or '特效类型' in s:
        print(f'{i}: {s}')
        if '粉色碎石' in s:
            for j in range(max(0, i-5), min(i+10, len(lines))):
                print(f'{j+1}: {lines[j].strip()}')
