with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(2970, 3010):
    print(f'{i+1}: {lines[i].strip()}')
