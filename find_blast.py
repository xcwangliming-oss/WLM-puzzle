with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'blast' in s.lower() and 'effect' in s.lower():
        print(f'{i}: {s[:130]}')
