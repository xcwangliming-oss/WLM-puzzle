with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

lines = content.split('\n')

# Find where runPhysicsInstant is called, and where drag ends
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    if 'runPhysicsInstant' in stripped or ('pointerup' in stripped.lower() and 'block' in stripped.lower()) or 'dragEnd' in stripped or 'onDragEnd' in stripped or ('runPhysics' in stripped):
        print(f'{i}: {stripped[:120]}')
