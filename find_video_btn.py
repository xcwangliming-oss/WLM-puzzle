with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if '录制视频' in line:
        print(f'{i}: {line.strip()}')
        for j in range(max(0, i-5), min(i+5, len(lines))):
            print(f'{j+1}: {lines[j].strip()}')
