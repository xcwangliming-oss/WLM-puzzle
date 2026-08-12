with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')

idx = content.find('function getGridOccupancy')
if idx >= 0:
    # Find b.isProp inside this function
    prop_idx = content.find('b.isProp', idx)
    if prop_idx >= 0:
        print(content[prop_idx:prop_idx+600])
