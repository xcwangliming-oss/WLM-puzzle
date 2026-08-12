with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')

# Look for the auto-generation button handler
for i, line in enumerate(lines, 1):
    s = line.strip()
    if ('自动' in s or 'Auto' in s or 'auto' in s) and len(s) < 200:
        print(f'{i}: {s[:120]}')
