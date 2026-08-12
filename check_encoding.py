with open('src/main.ts', 'rb') as f:
    raw = f.read(100)

print('BOM:', raw[:3].hex())
print('First 100 bytes hex:', raw.hex())
print('First 100 bytes decoded as utf-8-sig attempt:')
try:
    print(raw.decode('utf-8-sig'))
except Exception as e:
    print('utf-8-sig failed:', e)

# Also check around parseMaterialTextureName
with open('src/main.ts', 'rb') as f:
    content_bytes = f.read()

idx = content_bytes.find(b'parseMaterialTextureName')
print('\nAround parseMaterialTextureName (raw hex):')
snippet = content_bytes[idx:idx+200]
print(snippet)
try:
    print(snippet.decode('utf-8'))
except:
    try:
        print(snippet.decode('utf-8-sig'))
    except:
        print('Cannot decode')
