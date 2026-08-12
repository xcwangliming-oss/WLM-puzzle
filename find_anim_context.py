with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(23440, 23480):
    print(f'{i+1}: {lines[i].strip()}')
