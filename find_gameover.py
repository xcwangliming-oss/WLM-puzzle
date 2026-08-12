with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'checkGameOver' in s or 'Game Over' in s or 'isGameOver' in s:
        print(f'{i}: {s[:130]}')
