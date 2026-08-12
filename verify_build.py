import os, glob

# Find the new JS file
js_files = glob.glob(r'e:\Gemini\个人Blog\public\playables\block-puzzle\assets\index-*.js')
print('JS files found:', js_files)

js = open(js_files[0], encoding='utf-8').read()
print('showMaterialMapperDialog in JS:', 'showMaterialMapperDialog' in js)
print('single-char colors in JS:', 'pink|\u7ea2\u8272|\u84dd\u8272|\u7eff\u8272|\u9ec4\u8272|\u7c89\u8272|\u7ea2|\u84dd|\u7eff|\u9ec4|\u7c89' in js)
print('JS size (bytes):', len(js))
