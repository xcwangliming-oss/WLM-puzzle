#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('index.html', encoding='utf-8') as f:
    html = f.read()

# Only replace within the "✨ 特效类型管理" section
start_marker = '✨ 特效类型管理'
end_marker = '<!-- 音频类型管理' # Or just some known HTML after it
if start_marker not in html:
    print("Could not find start marker")
    sys.exit(1)

start_idx = html.find(start_marker)
# Find the next section '排面存档管理'
end_idx = html.find('排面存档管理', start_idx)
if end_idx == -1:
    end_idx = len(html)

section = html[start_idx:end_idx]

# Perform replacements
section = section.replace('gap: 10px;', 'gap: 4px;')
section = section.replace('width: 40px; height: 40px;', 'width: 32px; height: 32px;')
section = section.replace('font-size: 14px;', 'font-size: 12px;')

# Reassemble
html = html[:start_idx] + section + html[end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Patch applied successfully.")
