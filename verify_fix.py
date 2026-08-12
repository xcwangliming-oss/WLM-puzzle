with open('src/main.ts', 'rb') as f:
    content = f.read().decode('utf-8')
idx = content.find('b.isProp')
if idx >= 0:
    print(content[idx:idx+400])
