import os

# Search HTML files for btn-autoplay-generate
for fname in ['index.html', 'src/index.html', 'public/index.html']:
    if os.path.exists(fname):
        with open(fname, encoding='utf-8') as f:
            lines = f.readlines()
        for i, line in enumerate(lines, 1):
            if 'autoplay' in line.lower() or 'btn-autoplay' in line.lower():
                print(f'{fname}:{i}: {line.rstrip()[:150]}')
