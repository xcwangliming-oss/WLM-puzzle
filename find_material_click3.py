with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(33190, 33260):
    print(f'{i+1}: {lines[i].strip()}')
