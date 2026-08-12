with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(21050, 21100):
    print(f'{j+1}: {lines[j].strip()}')
