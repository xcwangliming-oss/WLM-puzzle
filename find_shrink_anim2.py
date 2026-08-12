with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(18818, 18880):
    print(f'{i+1}: {lines[i].strip()}')
