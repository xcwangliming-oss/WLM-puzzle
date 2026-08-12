with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    s = line.strip()
    if 'blocks.forEach' in s and 'delete' in s or 'create' in s and 'Particle' in s or 'createExplosion' in s or 'createParticles' in s:
        print(f'{i}: {s}')
