with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'function update(' in line or 'requestAnimationFrame' in line:
        pass
    if 'scrollSpeed' in line and 'distanceToTop' in line:
        print(f'{i}: {line.rstrip()[:150]}')
    if 'currentSpeed' in line and ('scroll' in line.lower() or 'speed' in line.lower()):
        print(f'{i}: {line.rstrip()[:150]}')
