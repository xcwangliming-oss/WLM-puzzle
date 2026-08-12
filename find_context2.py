with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i in [36873, 36889, 36917, 36993, 37145]:
    print(f'--- Context for line {i} ---')
    for j in range(max(0, i-5), min(i+5, len(lines))):
        print(f'{j+1}: {lines[j].strip()}')
