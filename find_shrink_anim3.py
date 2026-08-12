with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(18862, 18910):
    print(f'{i+1}: {lines[i].strip()}')
