#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Add to DEFAULT_SOUND_SOURCES
OLD_DEFAULT = (
    'const DEFAULT_SOUND_SOURCES = {\n'
    '\n'
    '\n'
    '\n'
    '  fall: \'/assets/音效/下落.mp3\',\n'
)
NEW_DEFAULT = (
    'const DEFAULT_SOUND_SOURCES = {\n'
    '\n'
    '  propElim: \'/audio/prop_elim.ogg\',\n'
    '\n'
    '  fall: \'/assets/音效/下落.mp3\',\n'
)
if OLD_DEFAULT in ts:
    ts = ts.replace(OLD_DEFAULT, NEW_DEFAULT, 1)
    print("OK: Patched DEFAULT_SOUND_SOURCES")
else:
    print("ERROR: DEFAULT_SOUND_SOURCES not found")
    sys.exit(1)

# 2. Add to const sounds
OLD_SOUNDS = (
    'const sounds = {\n'
    '\n'
    '\n'
    '\n'
    '  fall: createGameAudio(DEFAULT_SOUND_SOURCES.fall),\n'
)
NEW_SOUNDS = (
    'const sounds = {\n'
    '\n'
    '  propElim: createGameAudio((DEFAULT_SOUND_SOURCES as any).propElim || \'/audio/prop_elim.ogg\'),\n'
    '\n'
    '  fall: createGameAudio(DEFAULT_SOUND_SOURCES.fall),\n'
)
if OLD_SOUNDS in ts:
    ts = ts.replace(OLD_SOUNDS, NEW_SOUNDS, 1)
    print("OK: Patched const sounds")
else:
    print("ERROR: const sounds not found")
    sys.exit(1)

# 3. Add playSound in checkEliminations
OLD_DAMAGE = (
    '      const damage = damagePropForClearedRows(b, fullRows);\n'
    '\n'
    '      if (damage.triggered) {\n'
    '\n'
    '        const dir = b.propDir || \'left\';\n'
)
NEW_DAMAGE = (
    '      const damage = damagePropForClearedRows(b, fullRows);\n'
    '\n'
    '      if (damage.triggered) {\n'
    '        if ((sounds as any).propElim) playSound((sounds as any).propElim);\n'
    '\n'
    '        const dir = b.propDir || \'left\';\n'
)
if OLD_DAMAGE in ts:
    ts = ts.replace(OLD_DAMAGE, NEW_DAMAGE, 1)
    print("OK: Patched damage condition")
else:
    # Try more flexible approach
    idx = ts.find('const damage = damagePropForClearedRows(b, fullRows);')
    if idx > 0:
        idx_if = ts.find('if (damage.triggered) {', idx)
        if idx_if > 0:
            idx_if_end = idx_if + len('if (damage.triggered) {')
            ts = ts[:idx_if_end] + '\n        if ((sounds as any).propElim) playSound((sounds as any).propElim);\n' + ts[idx_if_end:]
            print("OK: Patched damage condition (flexible)")
        else:
            print("ERROR: damage condition not found")
            sys.exit(1)
    else:
        print("ERROR: damage function call not found")
        sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
