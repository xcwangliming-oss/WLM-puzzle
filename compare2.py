import re

with open(r'e:\Gemini\Puzzle编辑器\assets\index-BaKaDsc3.js', 'r', encoding='utf-8') as f:
    old_js = f.read()

# Find the getGridOccupancy equivalent - look for isProp check near grid filling
# In minified code, look for patterns like "isProp" followed by col/grid filling
m = re.search(r'\.isProp\b.{0,600}', old_js)
if m:
    print('isProp section (old build):')
    print(m.group()[:800])
