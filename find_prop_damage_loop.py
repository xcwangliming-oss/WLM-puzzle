with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if i >= 22940 and i <= 22970:
        print(f'{i}: {line.strip()}')
