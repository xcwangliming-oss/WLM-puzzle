import os, re

js_path = r'e:\Gemini\个人Blog\public\playables\block-puzzle\assets\index-CnSCNEWE.js'
js = open(js_path, encoding='utf-8').read()
print('showMaterialMapperDialog in JS:', 'showMaterialMapperDialog' in js)
print('JS size (bytes):', len(js))

# Find parseMaterialTextureName region
idx = js.find('parseMaterialTextureName')
if idx >= 0:
    snippet = js[idx:idx+400]
    print('parseMaterialTextureName snippet:', repr(snippet[:400]))
else:
    print('parseMaterialTextureName NOT FOUND in JS')
