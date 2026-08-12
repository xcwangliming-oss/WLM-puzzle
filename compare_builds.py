import re

# Search for prop occupancy handling in the old pre-built JS
with open(r'e:\Gemini\Puzzle编辑器\assets\index-BaKaDsc3.js', 'r', encoding='utf-8') as f:
    old_js = f.read()

# The minified version exports parseMaterialTextureName - let's find getPropOccupiedColumns equivalent
# Search for "candyCount" or "length-1" or similar patterns near occupancy
patterns = [
    r'isProp.{0,300}',
    r'propDir.{0,200}',
    r'propOccupied.{0,200}',
]

for pat in patterns:
    m = re.search(pat, old_js)
    if m:
        print(f'Pattern {pat[:30]}:')
        print(m.group()[:300])
        print()
    else:
        print(f'NOT FOUND: {pat[:30]}')
        print()
