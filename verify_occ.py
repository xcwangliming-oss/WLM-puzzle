with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

idx = content.find('function getGridOccupancy')
if idx >= 0:
    snippet = content[idx:idx+1000]
    print(snippet)
