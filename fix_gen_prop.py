with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# Target: the forEach body of getSimPossibleMoves
# We need to insert isProp guard right after the forEach opening
ANCHOR = 'function getSimPossibleMoves(simBlocks: SimBlock[], minRow?: number, maxRow?: number): SimMove[] {'

idx = content.find(ANCHOR)
if idx < 0:
    print("ERROR: function not found"); import sys; sys.exit(1)

# Find the forEach start after the function declaration
foreach_start = content.find('simBlocks.forEach(b =>', idx)
if foreach_start < 0:
    print("ERROR: forEach not found"); import sys; sys.exit(1)

# Find the start of the forEach body (opening brace)
brace_pos = content.find('{', foreach_start)
if brace_pos < 0:
    print("ERROR: brace not found"); import sys; sys.exit(1)

# Insert the guard right after the opening brace
INSERT = '\n\n    // Props are fixed obstacles — skip them in auto-generation\n    if (b.isProp) return;\n'
content = content[:brace_pos+1] + INSERT + content[brace_pos+1:]

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("OK: isProp guard inserted in getSimPossibleMoves")

# Verify
with open('src/main.ts', encoding='utf-8') as f:
    c2 = f.read()
print("Verified:", 'Props are fixed obstacles' in c2)
