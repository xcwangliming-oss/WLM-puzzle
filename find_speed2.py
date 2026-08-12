with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'currentSpeed' in line or 'factor' in line:
        if i < 39000: # before generator logic
            print(f'{i}: {line.rstrip()[:150]}')
