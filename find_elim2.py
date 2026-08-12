with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

lines = content.split('\n')

# Find all occurrences of 'eliminate' and 'fullRow' to understand the logic
import re

hits = []
for i, line in enumerate(lines, 1):
    if re.search(r'(eliminat|fullRow|full.*row|row.*full|getFullRow|tryElim)', line, re.IGNORECASE):
        hits.append((i, line.strip()))

for line_no, line in hits[:40]:
    print(f'{line_no}: {line}')
