with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'btn-autoplay-generate' in line.strip() or 'autoplay-status' in line.strip():
        print(f'{i}: {line.rstrip()[:150]}')
