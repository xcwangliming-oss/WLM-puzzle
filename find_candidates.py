with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')

# Look for where blocks are filtered for candidates to move in the generator
# Search around line 39324 and beyond for movable block selection
results = []
for i, line in enumerate(lines, 1):
    s = line.strip()
    # Lines that filter/select blocks to move in the simulation
    if (('filter' in s and ('isProp' in s or 'isCollectible' in s or 'noGravity' in s)) or
        ('movable' in s.lower()) or
        ('candidate' in s.lower()) or
        ('simBlock' in s and 'filter' in s) or
        (i > 39300 and i < 41700 and 'isProp' in s)):
        results.append(f'{i}: {s[:130]}')

for r in results[:50]:
    print(r)
