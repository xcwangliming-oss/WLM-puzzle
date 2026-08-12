with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')

for i, line in enumerate(lines, 1):
    s = line.strip()
    if ('autoGenerate' in s or 'auto_generate' in s or 
        '自动生成' in s or 'generateStep' in s or
        'generateSteps' in s or 'autoStep' in s or
        ('candidate' in s.lower() and 'block' in s.lower()) or
        ('eligible' in s.lower() and 'block' in s.lower())):
        print(f'{i}: {s[:120]}')
