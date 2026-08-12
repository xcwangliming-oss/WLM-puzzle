with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(33260, 33330):
    print(f'{i+1}: {lines[i].strip()}')
