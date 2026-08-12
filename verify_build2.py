import glob

js_files = glob.glob(r'e:\Gemini\个人Blog\public\playables\block-puzzle\assets\index-*.js')
js = open(js_files[0], encoding='utf-8').read()

# Check for unique strings from the mapper function (they won't be minified)
checks = [
    '\u624b\u52a8\u5206\u914d\u6750\u8d28\u56fe\u7247',   # 手动分配材质图片
    'mapper-body',
    'mapper-slot',
    'mapper-file-thumb',
    '\u5df2\u5206\u914d',   # 已分配
    '\u7c89\u8272|\u7ea2\u8272|\u84dd\u8272',  # part of colorPattern
]

for c in checks:
    print(f'{repr(c)}: {c in js}')

print(f'Total JS size: {len(js)} bytes')
