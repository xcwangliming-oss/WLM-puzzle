with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if '录制' in line:
        print(f'{i}: {line.strip()}')
